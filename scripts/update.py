#!/usr/bin/env python3
"""Healthy.Life refresh: pulls public health feeds, creator video feeds and FDA food recalls.

Writes assets/data/news.json, videos.json, recalls.json and status.json. Standard library only.
A source that fails is skipped and reported in status.json; existing data is kept if nothing new arrives.

    python3 scripts/update.py
"""
import datetime
import email.utils
import html
import json
import os
import pathlib
import re
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "assets" / "data"
NOW = datetime.datetime.now(datetime.timezone.utc)
UA = "Mozilla/5.0 (compatible; HealthyLifeBot/1.0; +https://healthy.life/editorial-policy.html#automated)"
ATOM = "{http://www.w3.org/2005/Atom}"
YT = "{http://www.youtube.com/xml/schemas/2015}"

PILLAR_WORDS = [
    ("sleep", r"\b(sleep|insomnia|nap|naps|circadian|melatonin|bedtime)\b"),
    ("connect", r"\b(lonel\w+|social (connection|isolation)|isolation|friendship|relationships?|community)\b"),
    ("mind", r"\b(stress|anxiety|depress\w+|mental|mindful\w+|burnout|mood|wellbeing|well-being|meditation)\b"),
    ("move", r"\b(exercis\w+|walking|walk|steps|fitness|workout|physical activity|running|strength|sedentary|sitting|yoga)\b"),
    ("nourish", r"\b(diet\w*|nutrition\w*|food|foods|eating|sugar\w*|protein|fib(re|er)|vegetables?|fruit|processed|vitamin\w*|coffee|salt|sodium|hydration|meal\w*|obesity|weight)\b"),
    ("prevent", r"\b(blood pressure|hypertension|cholesterol|heart (health|disease|attack)|diabetes|prediabetes|screening\w*|vaccin\w+|prevent\w*|check-?ups?|smoking|tobacco|vaping|alcohol|sunscreen|skin cancer|hand ?washing|healthy ag(e)?ing|longevity|stroke|flu|immun\w+)\b"),
]
# Topic searches return anything; only these publishers are shown.
TRUSTED = {"harvard health", "healthline", "medical news today", "cnn", "the new york times", "the washington post", "npr", "bbc", "the guardian",
           "reuters", "ap news", "associated press", "time", "time magazine", "scientific american", "new scientist", "nature", "science", "the conversation",
           "sciencedaily", "medical xpress", "news-medical", "eurekalert!", "everyday health", "verywell health", "verywell mind", "verywell fit", "health",
           "prevention", "women's health", "men's health", "self", "eatingwell", "sleep foundation", "national geographic", "cbs news", "nbc news", "abc news",
           "usa today", "forbes", "fortune", "cnbc", "psychology today", "medscape", "stat", "the independent", "the telegraph", "cbc", "global news", "ctv news",
           "the globe and mail", "today.com", "today", "axios", "vox", "the atlantic", "wired", "popular science", "smithsonian magazine", "world health organization (who)",
           "american heart association", "national institutes of health (nih) (.gov)", "cdc", "nhs", "webmd", "yahoo", "runner's world", "outside magazine", "bbc science focus magazine"}
TRUSTED_PARTS = ("university", "clinic", "hospital", "medical school", "school of medicine", "school of public health", "medicine", "institutes of health", ".gov", ".edu", "health system", "college")


def trusted(source):
    low = source.lower().strip()
    return low in TRUSTED or any(part in low for part in TRUSTED_PARTS)
# Keep the feed suitable for a general audience and for advertising policies.
BLOCK = re.compile(r"\b(sex\w*|porn\w*|rape\w*|shooting|murder\w*|suicid\w*|own life|abortion\w*|overdose\w*|kill\w*|dead|die|dies|died|dying|death\w*|war|nude|gambling|casino|abus\w+|assault\w*|stabb\w+|lawsuit\w*|sued|court|trump|biden|congress|senate|election\w*|medicaid|strike|scandal\w*|inquest|inquiry)\b", re.I)


def fetch(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, application/json, text/html;q=0.8, */*;q=0.5", "Accept-Language": "en"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read()


def clean(text):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def to_iso(text):
    if not text:
        return ""
    text = text.strip()
    try:
        return email.utils.parsedate_to_datetime(text).astimezone(datetime.timezone.utc).isoformat()
    except (TypeError, ValueError, IndexError):
        pass
    for fmt in ("%a, %m/%d/%Y - %H:%M", "%a, %d %b %Y %H:%M:%S Z", "%a, %d %b %Y %H:%M:%S", "%d %b %Y %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%B %d, %Y", "%d %B %Y"):
        try:
            return datetime.datetime.strptime(text, fmt).replace(tzinfo=datetime.timezone.utc).isoformat()
        except ValueError:
            pass
    try:
        d = datetime.datetime.fromisoformat(text.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=datetime.timezone.utc)
        return d.astimezone(datetime.timezone.utc).isoformat()
    except ValueError:
        return ""


def pillar_for(title, default="prevent"):
    low = title.lower()
    for name, pattern in PILLAR_WORDS:
        if re.search(pattern, low):
            return name
    return default


def parse_feed(raw, feed):
    """Return a list of {title, url, source, date, pillar} from RSS 2.0 or Atom."""
    root = ET.fromstring(raw)
    kind = feed.get("kind", "rss")
    forced = kind.split(":")[1] if kind.startswith("gnews:") else None
    out = []
    for it in root.iter("item"):
        title = clean(it.findtext("title"))
        link = (it.findtext("link") or "").strip()
        date = to_iso(it.findtext("pubDate") or it.findtext("{http://purl.org/dc/elements/1.1/}date"))
        source = feed["name"]
        if forced:
            src = it.find("source")
            if src is not None and src.text:
                source = clean(src.text)
                if title.endswith(" - " + source):
                    title = title[: -len(source) - 3]
                if not trusted(source):
                    continue
        out.append((title, link, source, date))
    for it in root.iter(ATOM + "entry"):
        title = clean(it.findtext(ATOM + "title"))
        link = ""
        for ln in it.findall(ATOM + "link"):
            if ln.get("rel", "alternate") == "alternate":
                link = ln.get("href", "")
                break
        date = to_iso(it.findtext(ATOM + "published") or it.findtext(ATOM + "updated"))
        out.append((title, link, feed["name"], date))
    items = []
    for title, link, source, date in out:
        if not title or not link.startswith("http") or len(title) < 15 or BLOCK.search(title):
            continue
        pillar = forced or pillar_for(title, None if kind == "rss:topic" else "prevent")
        if not pillar:      # general news desks: keep only healthy-living stories
            continue
        items.append({"title": title[:180], "url": link, "source": source, "date": date, "pillar": pillar})
    return items


def load(name, default):
    p = DATA / name
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return default


def save(name, data):
    (DATA / name).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def refresh_news(status):
    feeds = json.loads((ROOT / "content/data/feeds.json").read_text(encoding="utf-8"))
    cutoff = (NOW - datetime.timedelta(days=45)).isoformat()
    items, seen = [], set()
    for feed in feeds:
        if not feed.get("url"):
            continue
        try:
            got = parse_feed(fetch(feed["url"]), feed)
        except Exception as err:  # one bad feed must not stop the run
            status["feeds"][feed["name"]] = "failed: " + type(err).__name__
            continue
        cap = 6 if feed.get("kind", "").startswith("gnews") else 10
        kept = 0
        for it in sorted(got, key=lambda x: x["date"], reverse=True):
            key = re.sub(r"[^a-z0-9]+", "", it["title"].lower())[:70]
            if key in seen or (it["date"] and it["date"] < cutoff) or not it["date"]:
                continue
            seen.add(key)
            items.append(it)
            kept += 1
            if kept >= cap:
                break
        status["feeds"][feed["name"]] = "ok: %d" % kept
        if not kept:        # leave a clue for debugging: how many items came back and how the first one is dated
            status["feeds"][feed["name"]] += " (parsed %d; first date %r)" % (len(got), got[0]["date"] if got else None)
    items.sort(key=lambda x: x["date"], reverse=True)
    old = load("news.json", {"items": []})
    if not items:
        return False
    items = items[:90]
    if [i["url"] for i in items] == [i["url"] for i in old.get("items", [])]:
        return False
    save("news.json", {"updated": NOW.isoformat(), "items": items})
    return True


def channel_id(channel):
    """Use the stored id, or read it from the channel's public page."""
    if channel.get("id"):
        return channel["id"]
    page = fetch("https://www.youtube.com/" + channel["handle"]).decode("utf-8", "ignore")
    for pattern in (r'channel_id=(UC[\w-]{22})', r'"externalId":"(UC[\w-]{22})"', r'youtube\.com/channel/(UC[\w-]{22})'):
        m = re.search(pattern, page)
        if m:
            return m.group(1)
    raise ValueError("channel id not found")


def refresh_videos(status):
    path = ROOT / "content/data/channels.json"
    channels = json.loads(path.read_text(encoding="utf-8"))
    cutoff = (NOW - datetime.timedelta(days=240)).isoformat()
    items, resolved = [], False
    for ch in channels:
        try:
            cid = channel_id(ch)
            if cid != ch.get("id"):
                ch["id"] = cid
                resolved = True
            root = ET.fromstring(fetch("https://www.youtube.com/feeds/videos.xml?channel_id=" + cid))
        except Exception as err:
            status["channels"][ch["name"]] = "failed: " + type(err).__name__
            continue
        kept = 0
        for entry in root.iter(ATOM + "entry"):
            vid = entry.findtext(YT + "videoId")
            title = clean(entry.findtext(ATOM + "title"))
            date = to_iso(entry.findtext(ATOM + "published"))
            if not vid or not title or date < cutoff or BLOCK.search(title) or "#shorts" in title.lower():
                continue
            # broad channels are sorted video by video; off-topic uploads are skipped
            pillar = pillar_for(title, None) if ch.get("byTitle") else ch["pillar"]
            if not pillar:
                continue
            items.append({"id": vid, "title": title[:120], "channel": ch["name"], "date": date, "pillar": pillar})
            kept += 1
            if kept >= 3:
                break
        status["channels"][ch["name"]] = "ok: %d" % kept
    if resolved:
        path.write_text(json.dumps(channels, ensure_ascii=False, indent=1), encoding="utf-8")
    if not items:
        return resolved
    items.sort(key=lambda x: x["date"], reverse=True)
    old = load("videos.json", {"items": []})
    if [i["id"] for i in items] == [i["id"] for i in old.get("items", [])]:
        return resolved
    save("videos.json", {"updated": NOW.isoformat(), "items": items[:60]})
    return True


def refresh_recalls(status):
    try:
        raw = fetch("https://api.fda.gov/food/enforcement.json?sort=report_date:desc&limit=15")
        rows = json.loads(raw).get("results", [])
    except Exception as err:
        status["recalls"] = "failed: " + type(err).__name__
        return False
    items = []
    for r in rows:
        d = r.get("report_date", "")
        if len(d) != 8:
            continue
        items.append({"product": clean(r.get("product_description", ""))[:160],
                      "reason": clean(r.get("reason_for_recall", ""))[:220],
                      "firm": clean(r.get("recalling_firm", "")).title()[:80], "state": r.get("state", ""),
                      "class": r.get("classification", ""), "date": "%s-%s-%s" % (d[:4], d[4:6], d[6:])})
    status["recalls"] = "ok: %d" % len(items)
    old = load("recalls.json", {"items": []})
    if not items or items == old.get("items"):
        return False
    save("recalls.json", {"updated": NOW.isoformat(), "items": items})
    return True


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    status = {"ran": NOW.isoformat(), "feeds": {}, "channels": {}, "recalls": ""}
    changed = [refresh_news(status), refresh_videos(status), refresh_recalls(status)]
    save("status.json", status)
    ok_f = sum(1 for v in status["feeds"].values() if v.startswith("ok"))
    ok_c = sum(1 for v in status["channels"].values() if v.startswith("ok"))
    print("feeds ok %d/%d, channels ok %d/%d, recalls %s" % (ok_f, len(status["feeds"]), ok_c, len(status["channels"]), status["recalls"]))
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as fh:
            fh.write("changed=%s\n" % ("true" if any(changed) else "false"))


if __name__ == "__main__":
    main()
