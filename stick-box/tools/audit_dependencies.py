"""Identify saved Flash files that only launch external videos, without running them."""
import argparse
import json
import re

from import_series import ROOT, swf_body


def inspect_episode(episode):
    body = swf_body((ROOT / episode["file"]).read_bytes())
    if b"youtube.com/apiplayer" in body:
        identifier = re.search(rb"youtube\.com/v/([a-zA-Z0-9_-]{11})", body)
        return {
            "id": episode["id"], "status": "external-video",
            "reason": "The original SWF is a launcher for YouTube's retired Flash API, not a self-contained movie.",
            "externalSource": "https://www.youtube.com/watch?v=" + identifier[1].decode() if identifier else None,
        }
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Record confirmed external-only wrappers in the catalog")
    args = parser.parse_args()
    path = ROOT / "catalog.json"
    catalog = json.loads(path.read_text(encoding="utf-8"))
    reports = {}
    checked = set()
    for group in catalog["series"]:
        for episode in group["episodes"]:
            if episode["id"] not in checked:
                checked.add(episode["id"])
                report = inspect_episode(episode)
                if report:
                    reports[episode["id"]] = report
            if args.write and episode["id"] in reports:
                report = reports[episode["id"]]
                episode["playbackStatus"] = report["status"]
                episode["playbackNote"] = report["reason"]
                episode["externalSource"] = report["externalSource"]
    (ROOT / "archive" / "dependency-audit.json").write_text(json.dumps(list(reports.values()), indent=2) + "\n", encoding="utf-8")
    if args.write:
        path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Checked {len(checked)} unique SWFs; found {len(reports)} external-video launchers.")
    for report in reports.values():
        print(report["id"], report["externalSource"])


if __name__ == "__main__":
    main()
