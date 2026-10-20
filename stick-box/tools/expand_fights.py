"""Discover and preserve the collections linked from Stickpage's Fights index.

Use --inventory to save just the source-page inventory. No external HTML runs.
Downloads are limited to four workers and the existing Stickpage host allowlist.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import html
import json
from pathlib import Path
import re
import urllib.parse

from import_series import ROOT, download, plain, source, swf_metadata

HUB = "https://www.stickpage.com/stickfights.shtml"
# These links remain in cached official title pages even though the current
# title pages return an empty template. No media filenames are guessed.
RECOVERED_PLAY_PAGES = {
    "stickdudekillingarena": "https://www.stickpage.com/stickdudekillingarenaplay.shtml",
    "anicedaytodie": "https://www.stickpage.com/anicedaytodieplay.shtml",
}


def tiles(page_html, base):
    found = {}
    for match in re.finditer(r'&nbsp;\s*<a\s+href=["\']([^"\']+\.shtml)["\'][^>]*>(.*?)</a>\s*&nbsp;', page_html, re.I | re.S):
        url = urllib.parse.urljoin(base, html.unescape(match[1])).replace("http:", "https:")
        if urllib.parse.urlparse(url).hostname not in {"stickpage.com", "www.stickpage.com"}:
            continue
        label = plain(match[2])
        if label:
            found.setdefault(Path(urllib.parse.urlparse(url).path).stem, {"id": Path(urllib.parse.urlparse(url).path).stem, "title": label, "source": url})
    return list(found.values())


def inventory_group(group):
    stem = group["id"]
    group_id = {"killingspreeseries": "killing-spree", "shockseries": "shock"}.get(stem, re.sub(r"series$", "", stem))
    page_html = source(group["source"], group_id)
    members = tiles(page_html, group["source"])
    if re.search(r'class=["\']game_title["\']', page_html):
        members = [group]
    if not members:
        raise ValueError("No titles discovered: " + group["source"])
    return {"id": group_id, "title": re.sub(r" Series$", "", group["title"]), "source": group["source"], "entries": members}


def preserve(entry, folder, known):
    identifier = entry["id"]
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", identifier):
        raise ValueError("Unexpected title identifier")
    page_html = source(entry["source"], identifier)
    play_link = re.search(r'href=["\']([^"\']*play\.shtml)["\']', page_html, re.I)
    play_url = urllib.parse.urljoin(entry["source"], play_link[1]).replace("http:", "https:") if play_link else RECOVERED_PLAY_PAGES.get(identifier, entry["source"])
    play_html = source(play_url, identifier + "play") if play_url != entry["source"] else page_html
    files = re.findall(r'(?:https?:)?//farm\.stickpage\.com/[^\s"\'<>]+\.(?:swf|mp4|flv)', play_html, re.I)
    if not files:
        raise ValueError("No downloadable animation found on " + play_url)
    file_url = "https://" + html.unescape(files[0].split("//", 1)[1])
    extension = Path(urllib.parse.urlparse(file_url).path).suffix.lower()
    if extension != ".swf":
        raise ValueError("Needs media handling for " + file_url)
    previous = known.get(identifier)
    local_file = Path(previous["file"]) if previous else Path("archive") / folder / (identifier + extension)
    destination = ROOT / local_file
    destination.parent.mkdir(parents=True, exist_ok=True)
    data = destination.read_bytes() if destination.exists() else download(file_url)
    digest = hashlib.sha256(data).hexdigest()
    if previous and digest != previous["sha256"]:
        raise ValueError("Existing file hash changed: " + identifier)
    metadata = swf_metadata(data)
    if not destination.exists():
        destination.write_bytes(data)
    author = re.search(r'Author:</span>(.*?)</div>', play_html, re.I | re.S)
    description = re.search(r'Description:</span>\s*<br\s*/?>\s*<div[^>]*>(.*?)</div>', play_html, re.I | re.S)
    thumb_url = "https://static.stickpage.com/img/game_thumbs_wide/" + identifier + ".jpg"
    thumb_file = Path(previous["thumbnail"]) if previous and previous.get("thumbnail") else destination.with_suffix(".jpg").relative_to(ROOT)
    thumb_path = ROOT / thumb_file
    try:
        if not thumb_path.exists():
            thumbnail = download(thumb_url)
            if not thumbnail.startswith(b"\xff\xd8"):
                raise ValueError("Not a JPEG")
            thumb_path.write_bytes(thumbnail)
    except (OSError, ValueError):
        thumb_file = None
    return {
        "id": identifier, "title": entry["title"],
        "creator": plain(author[1]) if author else "Not listed on source page",
        "description": plain(description[1]) if description else "",
        "source": entry["source"], "playSource": play_url, "originalFile": file_url,
        "file": local_file.as_posix(), "thumbnail": thumb_file.as_posix() if thumb_file else None,
        "thumbnailSource": thumb_url if thumb_file else None,
        "bytes": len(data), "sha256": digest, **metadata,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", action="store_true")
    parser.add_argument("--retry-missing", action="store_true", help="Reuse catalog entries and retry only missing source files")
    args = parser.parse_args()
    hub_html = source(HUB, "fights-index")
    groups = tiles(hub_html, HUB)
    with ThreadPoolExecutor(max_workers=4) as pool:
        inventory = list(pool.map(inventory_group, groups))
    inventory_path = ROOT / "archive" / "fights-inventory.json"
    inventory_path.write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for group in inventory:
        print(f"{group['title']}: {len(group['entries'])} titles", flush=True)
    unique = {}
    for group in inventory:
        for entry in group["entries"]:
            unique.setdefault(entry["id"], (entry, group["id"]))
    print(f"Inventory: {len(inventory)} collections, {len(unique)} unique titles.", flush=True)
    if args.inventory:
        return
    previous = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
    known = {episode["id"]: episode for group in previous["series"] for episode in group["episodes"]}
    saved = {}
    failures = []

    def work(item):
        entry, folder = item
        if args.retry_missing and entry["id"] in known:
            return entry["id"], known[entry["id"]], None
        try:
            result = preserve(entry, folder, known)
            print(f"Saved {result['id']} | {result['bytes']:,} bytes", flush=True)
            return entry["id"], result, None
        except Exception as error:
            print(f"UNAVAILABLE {entry['id']}: {error}", flush=True)
            return entry["id"], known.get(entry["id"]), {**entry, "error": str(error)}

    with ThreadPoolExecutor(max_workers=4) as pool:
        for identifier, episode, failure in pool.map(work, unique.values()):
            if episode:
                saved[identifier] = episode
            if failure:
                failures.append(failure)
    catalog = {"archivedAt": previous["archivedAt"], "updatedAt": datetime.now(timezone.utc).isoformat(), "source": HUB, "series": []}
    for group in inventory:
        entries = [saved[entry["id"]] for entry in group["entries"] if entry["id"] in saved]
        unavailable = [entry for entry in group["entries"] if entry["id"] not in saved]
        catalog["series"].append({"id": group["id"], "title": group["title"], "source": group["source"], "episodes": entries, "unavailable": unavailable})
    # Never silently discard any previously preserved entries.
    for old_group in previous["series"]:
        current = next((group for group in catalog["series"] if group["id"] == old_group["id"]), None)
        if current is None:
            catalog["series"].append(old_group)
        else:
            current_ids = {entry["id"] for entry in current["episodes"]}
            current["episodes"].extend(entry for entry in old_group["episodes"] if entry["id"] not in current_ids)
    target = ROOT / "catalog.json"
    temporary = target.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(target)
    (ROOT / "archive" / "import-errors.json").write_text(json.dumps(failures, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Preserved {len(saved)} unique titles; {len(failures)} unavailable sources.", flush=True)


if __name__ == "__main__":
    main()
