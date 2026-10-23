"""Preserve only the three approved Animator vs. Animation titles, in order."""
from datetime import datetime, timezone
import json

from expand_fights import ROOT, preserve


def main():
    target = ROOT / "catalog.json"
    catalog = json.loads(target.read_text(encoding="utf-8"))
    known = {entry["id"]: entry for group in catalog["series"] for entry in group["episodes"]}
    episodes = []
    for suffix in ("", "2", "3"):
        identifier = "animatorvsanimation" + suffix
        entry = {"id": identifier, "title": "Animator vs. Animation" + (" " + suffix if suffix else ""),
                 "source": "https://stickpage.com/" + identifier + ".shtml"}
        episode = preserve(entry, "animator-vs-animation", known)
        episodes.append(episode)
        print(f"Saved {episode['title']}: {episode['bytes']:,} bytes; {episode['creator']}; stage {episode['stageBackground']}", flush=True)
    group = {"id": "animator-vs-animation", "title": "Animator vs. Animation", "category": "humor",
             "source": episodes[0]["source"], "episodes": episodes, "unavailable": []}
    existing = next((i for i, item in enumerate(catalog["series"]) if item["id"] == group["id"]), None)
    if existing is None:
        catalog["series"].append(group)
    else:
        catalog["series"][existing] = group
    catalog["updatedAt"] = datetime.now(timezone.utc).isoformat()
    temporary = target.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(target)


if __name__ == "__main__":
    main()
