"""Preserve only the two requested Stickpage series. Python standard library only.

Run from any directory: python stick-box/tools/import_series.py
Existing files are verified and reused. The importer never executes source HTML.
"""
import hashlib
import html
import json
import re
import time
import urllib.parse
import urllib.request
import zlib
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERIES = [
    ("killing-spree", "Killing Spree", "killingspreeseries.shtml", r"killingspree[1-6][ab]?"),
    ("shock", "Shock", "shockseries.shtml", r"shock(?:[123]|more|tribute)"),
]


def download(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.hostname not in {
        "www.stickpage.com", "stickpage.com", "farm.stickpage.com", "static.stickpage.com"
    }:
        raise ValueError(f"Unexpected source URL: {url}")
    request = urllib.request.Request(url, headers={"User-Agent": "StickBox-Preservation/1.0"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                if urllib.parse.urlparse(response.url).hostname not in {
                    "www.stickpage.com", "stickpage.com", "farm.stickpage.com", "static.stickpage.com"
                }:
                    raise ValueError("Unexpected redirect host")
                return response.read()
        except (OSError, TimeoutError):
            if attempt == 2:
                raise
            time.sleep(1 + attempt)


def plain(value):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", value))).strip(" |\t\n")


def source(url, name):
    path = ROOT / "archive" / "sources" / (name + ".html.txt")
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_bytes(download(url))
    return path.read_text(encoding="utf-8", errors="replace")


def swf_metadata(data):
    if data[:3] not in (b"FWS", b"CWS"):
        raise ValueError("Not a supported original SWF file")
    body = zlib.decompress(data[8:]) if data[:3] == b"CWS" else data[8:]
    if int.from_bytes(data[4:8], "little") != len(body) + 8:
        raise ValueError("SWF size check failed (possibly an incomplete download)")
    bits = "".join(f"{byte:08b}" for byte in body[:18])
    n = int(bits[:5], 2)
    values = []
    for i in range(4):
        value = int(bits[5 + i * n:5 + (i + 1) * n], 2)
        values.append(value - (1 << n) if value & (1 << (n - 1)) else value)
    offset = (5 + 4 * n + 7) // 8
    # Tag 9 is SetBackgroundColor. Keep this for auditing, never as a player
    # override: the SWF may change its own stage color later during playback.
    background = None
    position = offset + 4
    while position + 2 <= len(body):
        header = int.from_bytes(body[position:position + 2], "little")
        position += 2
        code, length = header >> 6, header & 63
        if length == 63:
            if position + 4 > len(body):
                raise ValueError("Truncated SWF tag header")
            length = int.from_bytes(body[position:position + 4], "little")
            position += 4
        if position + length > len(body):
            raise ValueError("Truncated SWF tag data")
        if code == 9:
            if length != 3:
                raise ValueError("Invalid SWF background color tag")
            background = "#" + body[position:position + 3].hex()
            break
        position += length
        if code == 0:
            break
    return {
        "width": round((values[1] - values[0]) / 20),
        "height": round((values[3] - values[2]) / 20),
        "frameRate": int.from_bytes(body[offset:offset + 2], "little") / 256,
        "frameCount": int.from_bytes(body[offset + 2:offset + 4], "little"),
        "swfVersion": data[3],
        "stageBackground": background,
    }


def main():
    catalog_path = ROOT / "catalog.json"
    known_hashes = {}
    if catalog_path.exists():
        previous = json.loads(catalog_path.read_text(encoding="utf-8"))
        known_hashes = {episode["file"]: episode["sha256"]
                        for series in previous["series"] for episode in series["episodes"]}
    catalog = {"archivedAt": datetime.now(timezone.utc).isoformat(), "series": []}
    failures = []
    for series_id, title, page, pattern in SERIES:
        series_url = "https://www.stickpage.com/" + page
        page_html = source(series_url, series_id)
        episodes = {}
        for match in re.finditer(r'<a\s+[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', page_html, re.I | re.S):
            episode_id = Path(urllib.parse.urlparse(match[1]).path).stem
            label = plain(match[2])
            if re.fullmatch(pattern, episode_id) and label:
                episodes.setdefault(episode_id, (label, urllib.parse.urljoin(series_url, match[1])))
        series = {"id": series_id, "title": title, "source": series_url, "episodes": []}
        if not episodes:
            raise ValueError(f"No episodes discovered for {title}")
        for episode_id, (label, page_url) in episodes.items():
            try:
                entry_html = source(page_url.replace("http:", "https:"), episode_id)
                play_link = re.search(r'href=["\']([^"\']*play\.shtml)["\']', entry_html, re.I)
                if not play_link:
                    raise ValueError("No playback page link")
                play_url = urllib.parse.urljoin(page_url, play_link[1]).replace("http:", "https:")
                play_html = source(play_url, episode_id + "play")
                files = re.findall(r'(?:https?:)?//farm\.stickpage\.com/[^\s"\'<>]+\.swf', play_html, re.I)
                if not files:
                    raise ValueError("No original SWF link")
                file_url = "https://" + files[0].split("//", 1)[1]
                local_file = Path("archive") / series_id / (episode_id + ".swf")
                destination = ROOT / local_file
                destination.parent.mkdir(parents=True, exist_ok=True)
                data = destination.read_bytes() if destination.exists() else download(file_url)
                expected = known_hashes.get(local_file.as_posix())
                if expected and hashlib.sha256(data).hexdigest() != expected:
                    raise ValueError("File differs from its preserved SHA-256; kept unchanged for review")
                metadata = swf_metadata(data)
                if not destination.exists():
                    destination.write_bytes(data)
                author_match = re.search(r'Author:</span>(.*?)</div>', play_html, re.I | re.S)
                desc_match = re.search(r'Description:</span>\s*<br\s*/?>\s*<div[^>]*>(.*?)</div>', play_html, re.I | re.S)
                thumbnail_url = "https://static.stickpage.com/img/game_thumbs_wide/" + episode_id + ".jpg"
                thumb_file = Path("archive") / series_id / (episode_id + ".jpg")
                try:
                    thumb_path = ROOT / thumb_file
                    if not thumb_path.exists():
                        thumb_data = download(thumbnail_url)
                        if not thumb_data.startswith(b"\xff\xd8"):
                            raise ValueError("Not a JPEG thumbnail")
                        thumb_path.write_bytes(thumb_data)
                except (OSError, ValueError) as error:
                    print(f"Thumbnail unavailable for {label}: {error}", flush=True)
                    thumb_file = None
                episode = {
                    "id": episode_id, "title": label,
                    "creator": plain(author_match[1]) if author_match else "Not listed on source page",
                    "description": plain(desc_match[1]) if desc_match else "",
                    "source": page_url, "playSource": play_url, "originalFile": file_url,
                    "file": local_file.as_posix(),
                    "thumbnail": thumb_file.as_posix() if thumb_file else None,
                    "thumbnailSource": thumbnail_url if thumb_file else None,
                    "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), **metadata,
                }
                series["episodes"].append(episode)
                print(f"Saved {label} | {episode['creator']} | {len(data):,} bytes | {metadata['width']}x{metadata['height']}", flush=True)
            except (OSError, ValueError, zlib.error) as error:
                failures.append({"id": episode_id, "error": str(error)})
                print(f"FAILED {label}: {error}", flush=True)
        catalog["series"].append(series)
    (ROOT / "catalog.json").write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (ROOT / "archive" / "import-errors.json").write_text(json.dumps(failures, indent=2) + "\n", encoding="utf-8")
    count = sum(len(series["episodes"]) for series in catalog["series"])
    print(f"Preserved {count} entries; {len(failures)} failures.", flush=True)
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
