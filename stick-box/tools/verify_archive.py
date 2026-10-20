"""Check the preserved files against their recorded catalog without network access."""
import hashlib
import json
from pathlib import Path
from import_series import swf_metadata

root = Path(__file__).resolve().parents[1]
catalog = json.loads((root / "catalog.json").read_text(encoding="utf-8"))
identifiers = {}
total_bytes = 0

for series in catalog["series"]:
    for episode in series["episodes"]:
        identifier = episode["id"]
        if identifier in identifiers:
            assert episode["file"] == identifiers[identifier]["file"] and episode["sha256"] == identifiers[identifier]["sha256"], f"Inconsistent duplicate listing: {identifier}"
            continue
        identifiers[identifier] = episode
        data = (root / episode["file"]).read_bytes()
        assert data[:3] in (b"FWS", b"CWS", b"ZWS"), f"Invalid SWF: {identifier}"
        assert len(data) == episode["bytes"], f"Size mismatch: {identifier}"
        assert hashlib.sha256(data).hexdigest() == episode["sha256"], f"Hash mismatch: {identifier}"
        assert episode["width"] > 0 and episode["height"] > 0, f"Invalid dimensions: {identifier}"
        metadata = swf_metadata(data)
        assert "stageBackground" in episode, f"Missing original background metadata: {identifier}"
        assert episode["stageBackground"] == metadata["stageBackground"], f"Background mismatch: {identifier}"
        if episode["thumbnail"]:
            assert (root / episode["thumbnail"]).read_bytes().startswith(b"\xff\xd8"), f"Invalid thumbnail: {identifier}"
        for name in (identifier, identifier + "play"):
            assert (root / "archive" / "sources" / (name + ".html.txt")).is_file(), f"Missing source snapshot: {name}"
        total_bytes += len(data)

failures = json.loads((root / "archive" / "import-errors.json").read_text(encoding="utf-8"))
missing = {entry["id"] for group in catalog["series"] for entry in group.get("unavailable", [])}
assert missing <= {entry["id"] for entry in failures}, "Missing source failure records"
print(f"Verified {len(identifiers)} original SWFs, authored stage colors, thumbnails, and source snapshots; {total_bytes:,} bytes. All SHA-256 hashes match.")
if failures:
    print(f"Documented {len(failures)} unavailable sources; these are not counted as preserved files.")
