#!/usr/bin/env python3
"""Healthy.Life static site generator.

Reads content/ and assets/data/, writes plain HTML to the repo root.
Standard library only, so it runs anywhere Python 3.9+ exists.

    python3 scripts/build.py
"""
import datetime
import hashlib
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://healthy.life"
NAME = "Healthy.Life"
ADS_CLIENT = "ca-pub-6620975821265271"
ADS_TAG = ('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
           '?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>')
OWNER_URL = "https://web.works/contact"
OWNER_TEXT = ("Contact, if you are interested in this website / domain name / "
              "Sponsorship / Advertisement / Partnership")
LAUNCH = "2026-11-19"
TODAY = datetime.datetime.now(datetime.timezone.utc).date()

PILLARS = {
    "move": ("Move", "Activity, strength and sitting less"),
    "nourish": ("Nourish", "Eating and drinking well"),
    "sleep": ("Sleep", "Rest, rhythm and recovery"),
    "mind": ("Mind", "Stress, focus and habits"),
    "connect": ("Connect", "People, purpose and belonging"),
    "prevent": ("Prevent", "Checkups, numbers and risks"),
}
MONTHS = ["January", "February", "March", "April", "May", "June", "July",
          "August", "September", "October", "November", "December"]

NAV = [
    ("Tools", "/tools.html"),
    ("Score", "/score.html"),
    ("Plan", "/plan.html"),
    ("Guides", "/guides.html"),
    ("Challenges", "/challenges.html"),
    ("Pulse", "/pulse.html"),
    ("Videos", "/videos.html"),
]


# ---------------------------------------------------------------- utilities

def esc(text):
    return html.escape(str(text), quote=True)


def read(path):
    return (ROOT / path).read_text(encoding="utf-8")


def load_json(path, default=None):
    p = ROOT / path
    if not p.exists():
        return default
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except ValueError:
        return default


_ASSET_HASH = {}


def asset(path):
    """Root-absolute asset URL with a content hash, so caches refresh only on change."""
    if path not in _ASSET_HASH:
        p = ROOT / path.lstrip("/")
        digest = hashlib.sha1(p.read_bytes()).hexdigest()[:8] if p.exists() else "0"
        _ASSET_HASH[path] = digest
    return f"{path}?v={_ASSET_HASH[path]}"


def nice_date(iso):
    try:
        d = datetime.date.fromisoformat(iso[:10])
    except (ValueError, TypeError):
        return ""
    return f"{d.day} {MONTHS[d.month - 1]} {d.year}"


def split_front(text):
    """A content file starts with one JSON object, a line of ---, then the body."""
    head, _, body = text.partition("\n---\n")
    return json.loads(head), body.strip()


# ------------------------------------------------------------- mini markdown

def inline(text):
    text = esc(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![*\w])\*([^*]+)\*(?![*\w])", r"<em>\1</em>", text)

    def link(m):
        label, url = m.group(1), m.group(2)
        ext = ' target="_blank" rel="noopener"' if url.startswith("http") else ""
        return f'<a href="{url}"{ext}>{label}</a>'
    return re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, text)


def markdown(src):
    out, para, lines, i = [], [], src.split("\n"), 0

    def flush():
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
            para.clear()

    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            flush()
        elif line.startswith("<"):
            flush()
            out.append(line)
        elif line.startswith("### "):
            flush()
            out.append(f"<h3>{inline(line[4:])}</h3>")
        elif line.startswith("## "):
            flush()
            text = line[3:]
            slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
            out.append(f'<h2 id="{slug}">{inline(text)}</h2>')
        elif line.startswith("> "):
            flush()
            block = []
            while i < len(lines) and lines[i].startswith("> "):
                block.append(lines[i][2:])
                i += 1
            out.append('<aside class="note"><p>' + inline(" ".join(block)) + "</p></aside>")
            continue
        elif re.match(r"^(- |\d+\. )", line):
            flush()
            ordered = not line.startswith("- ")
            items = []
            while i < len(lines) and re.match(r"^(- |\d+\. )", lines[i]):
                items.append(re.sub(r"^(- |\d+\. )", "", lines[i].rstrip()))
                i += 1
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>")
            continue
        elif line.startswith("|"):
            flush()
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.match(r"^:?-+:?$", c) for c in cells):
                    rows.append(cells)
                i += 1
            head = "".join(f"<th>{inline(c)}</th>" for c in rows[0])
            body = "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in rows[1:])
            out.append(f'<div class="table-wrap"><table><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table></div>')
            continue
        else:
            para.append(line.strip())
        i += 1
    flush()
    return "\n".join(out)


# ------------------------------------------------------------------- layout

LOGO = ('<svg class="logo-mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">'
        '<circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" stroke-width="4" '
        'stroke-dasharray="52 17.1" stroke-linecap="round" transform="rotate(-90 16 16)"/>'
        '<circle class="logo-dot" cx="16" cy="16" r="3.4"/></svg>')

FOOT_COLS = [
    ("Use it", [("All tools", "/tools.html"), ("My numbers", "/my-numbers.html"),
                ("Healthy Life Score", "/score.html"), ("Free 30-day plan", "/plan.html"),
                ("Challenges", "/challenges.html"), ("Search", "/search.html")]),
    ("Learn", [("Guides", "/guides.html"), ("Health Pulse", "/pulse.html"), ("Videos", "/videos.html"),
               ("Awareness calendar", "/calendar.html"), ("Glossary", "/glossary.html")]),
    ("Take part", [("Support Healthy.Life", "/support.html"), ("Contests and prizes", "/contests.html"),
                   ("For teams", "/teams.html"), ("For health pros", "/pros.html"),
                   ("Work with us", "/careers.html"), ("Advertise", "/advertise.html")]),
    ("About", [("About", "/about.html"), ("Contact", "/contact.html"),
               ("Editorial policy", "/editorial-policy.html"), ("Medical disclaimer", "/disclaimer.html"),
               ("Privacy and cookies", "/privacy.html"), ("Terms", "/terms.html"),
               ("Trademark and copyright", "/legal.html"), ("Accessibility", "/accessibility.html"),
               ("Site map", "/sitemap.html")]),
]


def jsonld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + "</script>"


def breadcrumbs(crumbs):
    """crumbs: list of (label, url-or-None). Returns (html, json-ld)."""
    if not crumbs:
        return "", ""
    parts, items = [], []
    trail = [("Home", "/index.html")] + crumbs
    for n, (label, url) in enumerate(trail, 1):
        if url and n < len(trail):
            parts.append(f'<li><a href="{url}">{esc(label)}</a></li>')
        else:
            parts.append(f'<li aria-current="page">{esc(label)}</li>')
        item = {"@type": "ListItem", "position": n, "name": label}
        if url:
            item["item"] = SITE + url.replace("/index.html", "/")
        items.append(item)
    nav = '<nav class="crumbs" aria-label="Breadcrumb"><ol>' + "".join(parts) + "</ol></nav>"
    return nav, jsonld({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items})


def faq_block(faq):
    if not faq:
        return "", ""
    rows = "".join(f"<details><summary>{esc(q)}</summary><p>{inline(a)}</p></details>" for q, a in faq)
    data = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"[*`\[\]]|\([^)]*\)", "", a)}}
        for q, a in faq]}
    return f'<section class="faq"><h2 id="questions">Questions people ask</h2>{rows}</section>', jsonld(data)


def sources_block(sources, updated):
    if not sources:
        return ""
    items = "".join(f'<li><a href="{esc(u)}" target="_blank" rel="noopener">{esc(t)}</a></li>' for t, u in sources)
    checked = f"<p class=\"muted\">Checked against these sources on {nice_date(updated)}.</p>" if updated else ""
    return f'<section class="sources"><h2 id="sources">Sources</h2><ul>{items}</ul>{checked}</section>'


def ad(slot):
    return f'<div class="ad" data-ad="{slot}"></div>'


def plan_cta(context="page"):
    return (f'<section class="plan-cta"><div><h2>Turn this into a plan</h2>'
            f'<p>Answer five short questions and get a free 30-day plan built around your numbers. '
            f'No account needed.</p></div>'
            f'<a class="btn btn-accent" href="/plan.html?from={context}">Build my free plan</a></section>')


def layout(path, meta, body, extra_ld=""):
    """Wrap a page body in the shared shell. path is the output path, e.g. tools/bmi-calculator.html."""
    depth = path.count("/")
    root = "../" * depth
    title = meta["title"]
    full_title = title if NAME in title else f"{title} | {NAME}"
    desc = meta.get("description", "")
    canonical = SITE + "/" + ("" if path == "index.html" else path)
    noads = meta.get("noads", False)
    robots = "noindex,follow" if meta.get("noindex") else "index,follow,max-image-preview:large"
    current = meta.get("nav", "")

    nav_links = "".join(
        '<a href="%s"%s>%s</a>' % (url, ' aria-current="page"' if label.lower() == current else "", label)
        for label, url in NAV)
    foot = "".join(
        f"<div><h2>{head}</h2><ul>" + "".join(f'<li><a href="{u}">{t}</a></li>' for t, u in links) + "</ul></div>"
        for head, links in FOOT_COLS)
    org = jsonld({"@context": "https://schema.org", "@graph": [
        {"@type": "Organization", "@id": SITE + "/#org", "name": NAME, "url": SITE + "/",
         "logo": SITE + "/assets/img/icon-512.png"},
        {"@type": "WebSite", "@id": SITE + "/#site", "name": NAME, "url": SITE + "/",
         "publisher": {"@id": SITE + "/#org"},
         "potentialAction": {"@type": "SearchAction", "target": SITE + "/search.html?q={search_term_string}",
                             "query-input": "required name=search_term_string"}}]})
    scripts = "".join(f'<script src="{asset("/assets/js/" + s)}" defer></script>' for s in meta.get("scripts", []))
    # The 404 page is served at any depth, so it sets its own base address (domain root, or the project folder on github.io).
    base = ""
    if meta.get("base404"):
        base = ("\n<script>document.write('<base href=\"'+(/github\\.io$/.test(location.hostname)?'/'+location.pathname.split('/')[1]+'/':'/')+'\">')</script>")

    page = f"""<!doctype html>
<html lang="en" data-root="{root}">
<head>
<meta charset="utf-8">{base}
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(full_title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canonical}">
<meta name="robots" content="{robots}">
<meta name="google-adsense-account" content="{ADS_CLIENT}">
<meta property="og:site_name" content="{NAME}">
<meta property="og:type" content="{meta.get('og_type', 'website')}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE}/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0f4c45">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/icon-48.png" sizes="48x48" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/atkinson-hyperlegible-next.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>
<script>try{{var t=localStorage.getItem('hl.theme');if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
<link rel="stylesheet" href="{asset('/assets/css/site.css')}">
{'' if noads else ADS_TAG}
{org}{extra_ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="ownerbar"><a href="{OWNER_URL}" target="_blank" rel="noopener">{OWNER_TEXT}</a></div>
<header class="site-header">
<div class="wrap header-row">
<a class="logo" href="/index.html" aria-label="{NAME} home">{LOGO}<span>Healthy<i>.</i>Life</span></a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
<nav id="site-nav" class="site-nav" aria-label="Main">{nav_links}
<a class="nav-extra" href="/my-numbers.html">My numbers</a>
<a class="nav-extra" href="/support.html">Support us</a>
</nav>
<div class="header-tools">
<a class="icon-btn" href="/search.html" aria-label="Search"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5 21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></a>
<button class="icon-btn" type="button" data-theme-toggle aria-label="Switch between light and dark">
<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" fill="currentColor"/></svg></button>
<a class="btn btn-accent btn-small" href="/plan.html">Get my free plan</a>
</div>
</div>
</header>
<main id="main">
{body}
</main>
<footer class="site-footer">
<div class="wrap">
<div class="foot-grid">{foot}</div>
<div class="foot-note">
<p><strong>Healthy.Life is for general education.</strong> It does not give medical advice, diagnosis or treatment, and its tools are estimates. Talk to a qualified health professional about your own situation. In an emergency, call your local emergency number.</p>
<p>Healthy.Life is an independent website. It is not affiliated with, endorsed by or connected to Healthylife (Woolworths Group, Australia) or any other business, product or publication with a similar name. All trademarks belong to their owners. <a href="/legal.html">Trademark and copyright disclosure</a>.</p>
<p>This site is funded by advertising, sponsorship and reader support. <a href="/editorial-policy.html#funding">How we make money</a>.</p>
<p>Website, domain name, sponsorship, advertising and partnership enquiries: <a href="{OWNER_URL}" target="_blank" rel="noopener">contact the owner</a>.</p>
<p>&copy; <span data-year>{TODAY.year}</span> Healthy.Life. Original text, tools and illustrations. All rights reserved.</p>
</div>
</div>
</footer>
<div class="cta-bar" data-cta-bar hidden><span>What's your Healthy Life Score?</span><a class="btn btn-accent btn-small" href="/score.html">Take the 3-minute check</a><button type="button" aria-label="Hide this bar" data-cta-close>&times;</button></div>
<div class="cookie" data-cookie hidden><p>Healthy.Life keeps your numbers in your own browser. Our advertising partner, Google, uses cookies to show and measure ads. <a href="/privacy.html">Privacy and cookies</a></p><button class="btn btn-small" type="button" data-cookie-ok>OK</button></div>
<script src="{asset('/assets/js/config.js')}"></script>
<script src="{asset('/assets/js/site.js')}" defer></script>
{scripts}
</body>
</html>
"""
    # Root-absolute links become relative, so the site works at a domain root or in a sub-folder.
    page = re.sub(r'(href|src|action)="/(?!/)', lambda m: m.group(1) + '="' + root, page)
    page = page.replace('href="' + root + 'index.html"', 'href="' + (root or "./") + '"')
    out = ROOT / path
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding="utf-8")


# ------------------------------------------------------------------ content

def load_collection(folder):
    items = []
    for p in sorted((ROOT / "content" / folder).glob("*.md")):
        meta, body = split_front(p.read_text(encoding="utf-8"))
        meta["slug"] = p.stem
        meta["body"] = body
        items.append(meta)
    items.sort(key=lambda m: (m.get("order", 99), m["title"]))
    return items


TOOLS = load_collection("tools")
GUIDES = load_collection("guides")
CHALLENGES = load_json("content/data/challenges.json", [])
OBS = load_json("content/data/observances.json", [])
GLOSSARY = load_json("content/data/glossary.json", [])
NEWS = load_json("assets/data/news.json", {"items": []}) or {"items": []}
VIDEOS = load_json("assets/data/videos.json", {"items": []}) or {"items": []}
RECALLS = load_json("assets/data/recalls.json", {"items": []}) or {"items": []}
CHANNELS = load_json("content/data/channels.json", [])
FEEDS = load_json("content/data/feeds.json", [])

TOOL_BY = {t["slug"]: t for t in TOOLS}
GUIDE_BY = {g["slug"]: g for g in GUIDES}


def tool_links(slugs):
    out = []
    for s in slugs:
        t = TOOL_BY.get(s)
        if t:
            out.append(f'<li><a href="/tools/{s}.html">{esc(t["name"])}</a><span>{esc(t["blurb"])}</span></li>')
    return '<ul class="link-list">' + "".join(out) + "</ul>" if out else ""


def guide_links(slugs):
    out = []
    for s in slugs:
        g = GUIDE_BY.get(s)
        if g:
            out.append(f'<li><a href="/guides/{s}.html">{esc(g["title"])}</a><span>{esc(g["description"])}</span></li>')
    return '<ul class="link-list">' + "".join(out) + "</ul>" if out else ""


def tools_index():
    blocks = []
    for key, (label, tagline) in PILLARS.items():
        rows = "".join(
            f'<li><a href="/tools/{t["slug"]}.html">{esc(t["name"])}</a><span>{esc(t["blurb"])}</span></li>'
            for t in TOOLS if t["pillar"] == key)
        if rows:
            blocks.append(f'<section class="index-group" data-pillar="{key}"><h2 id="{key}">{label}</h2>'
                          f'<p class="muted">{tagline}</p><ul class="link-list">{rows}</ul></section>')
    return '<div class="index-grid">' + "".join(blocks) + "</div>"


def guides_index():
    blocks = []
    for key, (label, tagline) in PILLARS.items():
        rows = "".join(
            f'<li><a href="/guides/{g["slug"]}.html">{esc(g["title"])}</a>'
            f'<span>{esc(g["description"])}</span></li>'
            for g in GUIDES if g["pillar"] == key)
        if rows:
            blocks.append(f'<section class="index-group" data-pillar="{key}"><h2 id="{key}">{label}</h2>'
                          f'<p class="muted">{tagline}</p><ul class="link-list">{rows}</ul></section>')
    return '<div class="index-grid">' + "".join(blocks) + "</div>"


def challenges_list():
    rows = []
    for c in CHALLENGES:
        strip = "".join("<i></i>" for _ in range(min(c["days"], 30)))
        rows.append(
            f'<a class="challenge-row" href="/challenges/{c["slug"]}.html" data-pillar="{c["pillar"]}">'
            f'<span class="challenge-days"><b>{c["days"]}</b> days</span>'
            f'<span class="challenge-text"><strong>{esc(c["title"])}</strong>{esc(c["summary"])}</span>'
            f'<span class="day-strip" aria-hidden="true">{strip}</span></a>')
    return '<div class="challenge-list">' + "".join(rows) + "</div>"


def news_list(limit, pillar=None):
    items = [n for n in NEWS.get("items", []) if not pillar or n.get("pillar") == pillar][:limit]
    if not items:
        return ('<p class="empty">Fresh headlines load here after the next automatic refresh. '
                'Meanwhile, the official sources below are always current.</p>')
    rows = "".join(
        f'<li data-pillar="{esc(n.get("pillar", "prevent"))}"><a href="{esc(n["url"])}" target="_blank" rel="noopener nofollow">{esc(n["title"])}</a>'
        f'<span>{esc(n["source"])}, {nice_date(n.get("date", ""))}</span></li>' for n in items)
    return f'<ul class="news-list">{rows}</ul>'


def recalls_list(limit):
    items = RECALLS.get("items", [])[:limit]
    if not items:
        return '<p class="empty">No recall data yet. It loads after the next automatic refresh.</p>'
    rows = "".join(
        f'<li><strong>{esc(r["product"])}</strong><span>{esc(r["reason"])}</span>'
        f'<span class="muted">{esc(r["firm"])}, {esc(r.get("state", ""))} &middot; {esc(r["class"])} &middot; reported {nice_date(r["date"])}</span></li>'
        for r in items)
    return f'<ul class="recall-list">{rows}</ul>'


def video_cards(limit, pillar=None):
    items = [v for v in VIDEOS.get("items", []) if not pillar or v.get("pillar") == pillar][:limit]
    if not items:
        return ('<p class="empty">New videos load here after the next automatic refresh. '
                'The channels we follow are listed on the <a href="/videos.html#channels">videos page</a>.</p>')
    cards = "".join(
        f'<article class="video" data-pillar="{esc(v.get("pillar", "move"))}">'
        f'<button type="button" class="video-play" data-video="{esc(v["id"])}" aria-label="Play: {esc(v["title"])}">'
        f'<img src="https://i.ytimg.com/vi/{esc(v["id"])}/mqdefault.jpg" alt="" loading="lazy" width="320" height="180"></button>'
        f'<h3>{esc(v["title"])}</h3><p class="muted">{esc(v["channel"])}, {nice_date(v.get("date", ""))}</p></article>'
        for v in items)
    return f'<div class="video-grid">{cards}</div>'


def channel_list():
    rows = "".join(
        f'<li data-pillar="{esc(c["pillar"])}"><a href="https://www.youtube.com/{esc(c["handle"])}" target="_blank" rel="noopener">{esc(c["name"])}</a>'
        f'<span>{esc(c["about"])}</span></li>' for c in CHANNELS)
    return f'<ul class="link-list cols">{rows}</ul>'


def feed_sources():
    rows = "".join(
        f'<li><a href="{esc(f["home"])}" target="_blank" rel="noopener">{esc(f["name"])}</a><span>{esc(f["about"])}</span></li>'
        for f in FEEDS if f.get("home"))
    return f'<ul class="link-list cols">{rows}</ul>'


def observances_month(month):
    rows = [o for o in OBS if o["m"] == month]
    rows.sort(key=lambda o: o.get("d", 0))
    out = []
    for o in rows:
        when = f'{o["d"]} {MONTHS[month - 1]}' if o.get("d") else "All month"
        if o.get("to"):
            when = f'{o["d"]}–{o["to"]} {MONTHS[month - 1]}'
        link = f' <a href="{o["link"]}">{esc(o["cta"])}</a>' if o.get("link") else ""
        name = o["name"][0].upper() + o["name"][1:]
        out.append(f'<li><span class="when">{when}</span><span><strong>{esc(name)}</strong>{link}</span></li>')
    return '<ul class="obs-list">' + "".join(out) + "</ul>"


def calendar_full():
    return "".join(f'<section class="obs-month" id="{MONTHS[m - 1].lower()}"><h2>{MONTHS[m - 1]}</h2>{observances_month(m)}</section>'
                   for m in range(1, 13))


def glossary_html():
    terms = sorted(GLOSSARY, key=lambda t: t["term"].lower())
    letters = sorted({t["term"][0].upper() for t in terms})
    jump = "".join(f'<a href="#letter-{letter}">{letter}</a>' for letter in letters)
    out = [f'<nav class="az" aria-label="Jump to letter">{jump}</nav>']
    for letter in letters:
        rows = ""
        for t in terms:
            if t["term"][0].upper() != letter:
                continue
            more = f' <a href="{t["link"]}">{esc(t["cta"])}</a>' if t.get("link") else ""
            rows += f'<dt id="{re.sub(r"[^a-z0-9]+", "-", t["term"].lower()).strip("-")}">{esc(t["term"])}</dt><dd>{inline(t["def"])}{more}</dd>'
        out.append(f'<section><h2 id="letter-{letter}">{letter}</h2><dl class="glossary">{rows}</dl></section>')
    return "".join(out)


def sitemap_html(pages):
    groups = [("Start here", [p for p in pages if p["kind"] == "core"]),
              ("Tools", [p for p in pages if p["kind"] == "tool"]),
              ("Guides", [p for p in pages if p["kind"] == "guide"]),
              ("Challenges", [p for p in pages if p["kind"] == "challenge"]),
              ("About and policies", [p for p in pages if p["kind"] == "info"])]
    out = ""
    for head, items in groups:
        rows = "".join(f'<li><a href="/{p["path"]}">{esc(p["title"])}</a></li>' for p in items)
        out += f"<section><h2>{head}</h2><ul class=\"plain-cols\">{rows}</ul></section>"
    return out


# -------------------------------------------------------------------- pages

PAGES = []   # registry for sitemap, search index and the HTML site map


def register(path, title, desc, kind, updated=LAUNCH, keywords="", index=True):
    PAGES.append({"path": path, "title": title, "desc": desc, "kind": kind,
                  "updated": updated, "keywords": keywords, "index": index})


def build_tools():
    for t in TOOLS:
        path = f'tools/{t["slug"]}.html'
        crumbs, crumbs_ld = breadcrumbs([("Tools", "/tools.html"), (t["name"], None)])
        faq_html, faq_ld = faq_block(t.get("faq"))
        related = tool_links(t.get("related", []))
        guides = guide_links(t.get("guides", []))
        app_ld = jsonld({"@context": "https://schema.org", "@type": "WebApplication", "name": t["name"],
                         "url": f"{SITE}/{path}", "applicationCategory": "HealthApplication",
                         "operatingSystem": "Any", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                         "description": t["description"]})
        limits = ""
        if t.get("limits"):
            limits = ('<aside class="limits"><h2>Before you rely on this number</h2><ul>'
                      + "".join(f"<li>{inline(x)}</li>" for x in t["limits"]) + "</ul></aside>")
        body = f"""<div class="wrap page tool-page" data-pillar="{t['pillar']}">
{crumbs}
<header class="page-head">
<h1>{esc(t['name'])}</h1>
<p class="lead">{esc(t['lead'])}</p>
</header>
<div class="tool-layout">
<section class="tool" data-tool="{t['slug']}" aria-label="{esc(t['name'])}">
<noscript><p class="empty">This calculator needs JavaScript. The formula is explained below, so you can also work it out by hand.</p></noscript>
</section>
<aside class="tool-side">
<p class="privacy-line">Your entries stay in this browser. Nothing is sent to us.</p>
{ad('tool')}
</aside>
</div>
<article class="prose">
{markdown(t['body'])}
{limits}
</article>
{ad('in-content')}
{faq_html}
{sources_block(t.get('sources'), t.get('updated', LAUNCH))}
<section class="related"><h2>Related tools</h2>{related}</section>
{'<section class="related"><h2>Read next</h2>' + guides + '</section>' if guides else ''}
{plan_cta(t['slug'])}
<p class="disclaimer">This tool gives general information, not medical advice. It cannot account for your full health picture. Check any decision about your health with a qualified professional.</p>
</div>"""
        layout(path, {"title": t["title"], "description": t["description"], "nav": "tools",
                      "scripts": ["tools.js"]}, body, crumbs_ld + faq_ld + app_ld)
        register(path, t["name"], t["description"], "tool", t.get("updated", LAUNCH), t.get("keywords", ""))


def build_guides():
    for g in GUIDES:
        path = f'guides/{g["slug"]}.html'
        label = PILLARS[g["pillar"]][0]
        crumbs, crumbs_ld = breadcrumbs([("Guides", "/guides.html"), (g["title"], None)])
        faq_html, faq_ld = faq_block(g.get("faq"))
        updated = g.get("updated", LAUNCH)
        art_ld = jsonld({"@context": "https://schema.org", "@type": "Article", "headline": g["title"],
                         "description": g["description"], "datePublished": g.get("published", LAUNCH),
                         "dateModified": updated, "mainEntityOfPage": f"{SITE}/{path}",
                         "author": {"@type": "Organization", "name": "Healthy.Life editorial team", "url": SITE + "/about.html"},
                         "publisher": {"@id": SITE + "/#org"}, "image": SITE + "/assets/img/og.png"})
        tldr = ""
        if g.get("tldr"):
            tldr = '<aside class="tldr"><h2>The short version</h2><ul>' + "".join(f"<li>{inline(x)}</li>" for x in g["tldr"]) + "</ul></aside>"
        html_body = markdown(g["body"])
        # one ad after the second section, where a reader pauses
        cut = [m.start() for m in re.finditer(r"<h2 ", html_body)]
        if len(cut) >= 3:
            html_body = html_body[:cut[2]] + ad("in-content") + html_body[cut[2]:]
        same = [x["slug"] for x in GUIDES if x["pillar"] == g["pillar"] and x["slug"] != g["slug"]][:3]
        body = f"""<div class="wrap page guide-page" data-pillar="{g['pillar']}">
{crumbs}
<header class="page-head">
<p class="pillar-tag"><a href="/guides.html#{g['pillar']}">{label}</a></p>
<h1>{esc(g['title'])}</h1>
<p class="lead">{esc(g['description'])}</p>
<p class="muted">By the Healthy.Life editorial team. {g.get('read', 4)} minute read. Last reviewed {nice_date(updated)}.</p>
</header>
<article class="prose">
{tldr}
{html_body}
</article>
{'<section class="related"><h2>Tools for this</h2>' + tool_links(g.get('tools', [])) + '</section>' if g.get('tools') else ''}
{faq_html}
{sources_block(g.get('sources'), updated)}
<section class="related"><h2>More on {label.lower()}</h2>{guide_links(same)}</section>
{plan_cta(g['slug'])}
<p class="disclaimer">This guide is general education, not medical advice. It may not fit your circumstances. Talk to a qualified health professional before changing treatment, medication, diet or exercise if you have a health condition.</p>
</div>"""
        layout(path, {"title": g["title"], "description": g["description"], "nav": "guides",
                      "og_type": "article"}, body, crumbs_ld + faq_ld + art_ld)
        register(path, g["title"], g["description"], "guide", updated, g.get("keywords", ""))


def build_challenges():
    for c in CHALLENGES:
        path = f'challenges/{c["slug"]}.html'
        crumbs, crumbs_ld = breadcrumbs([("Challenges", "/challenges.html"), (c["title"], None)])
        faq_html, faq_ld = faq_block(c.get("faq"))
        days = "".join(f"<li><b>Day {n}</b> {esc(task)}</li>" for n, task in enumerate(c["tasks"], 1))
        rules = "".join(f"<li>{inline(r)}</li>" for r in c.get("rules", []))
        body = f"""<div class="wrap page challenge-page" data-pillar="{c['pillar']}">
{crumbs}
<header class="page-head">
<p class="pillar-tag"><a href="/challenges.html">{PILLARS[c['pillar']][0]} challenge</a></p>
<h1>{esc(c['title'])}</h1>
<p class="lead">{esc(c['lead'])}</p>
</header>
<section class="tracker" data-challenge="{c['slug']}" data-days="{c['days']}" data-title="{esc(c['title'])}">
<noscript><p class="empty">The tracker needs JavaScript. You can still follow the day-by-day list below.</p></noscript>
</section>
<p class="privacy-line">Your progress is saved in this browser only.</p>
{ad('in-content')}
<article class="prose">
<h2 id="how">How it works</h2>
<ul>{rules}</ul>
<h2 id="days">Day by day</h2>
<ol class="day-list">{days}</ol>
{markdown(c.get('body', ''))}
</article>
<section class="related"><h2>Tools that help</h2>{tool_links(c.get('tools', []))}</section>
{faq_html}
<section class="plan-cta"><div><h2>Finished it? Enter this month's contest</h2><p>Tell us what changed. A short, honest story is all it takes.</p></div><a class="btn btn-accent" href="/contests.html">See the contest</a></section>
<p class="disclaimer">Challenges are general wellbeing activities. If you have a health condition, are pregnant or have not been active for a while, check with a health professional first, and stop if anything hurts.</p>
</div>"""
        layout(path, {"title": f'{c["title"]}: free {c["days"]}-day tracker', "description": c["summary"],
                      "nav": "challenges", "scripts": ["challenge.js"]}, body, crumbs_ld + faq_ld)
        register(path, c["title"], c["summary"], "challenge", c.get("updated", LAUNCH), c.get("keywords", ""))


def build_pages():
    month = TODAY.month
    for p in sorted((ROOT / "content" / "pages").glob("*.html")):
        meta, body = split_front(p.read_text(encoding="utf-8"))
        path = meta.get("path", p.name)
        tokens = {
            "{{tools_index}}": tools_index,
            "{{guides_index}}": guides_index,
            "{{challenges_list}}": challenges_list,
            "{{news_home}}": lambda: news_list(6),
            "{{news_all}}": lambda: news_list(60),
            "{{recalls}}": lambda: recalls_list(12),
            "{{videos_home}}": lambda: video_cards(3),
            "{{videos_all}}": lambda: video_cards(36),
            "{{channels}}": channel_list,
            "{{feed_sources}}": feed_sources,
            "{{obs_month}}": lambda: observances_month(month),
            "{{month_name}}": lambda: MONTHS[month - 1],
            "{{calendar}}": calendar_full,
            "{{glossary}}": glossary_html,
            "{{tool_count}}": lambda: str(len(TOOLS)),
            "{{guide_count}}": lambda: str(len(GUIDES)),
            "{{news_updated}}": lambda: nice_date(NEWS.get("updated", "")) or "pending first refresh",
            "{{videos_updated}}": lambda: nice_date(VIDEOS.get("updated", "")) or "pending first refresh",
            "{{ad_content}}": lambda: ad("in-content"),
            "{{ad_home}}": lambda: ad("home"),
            "{{plan_cta}}": lambda: plan_cta(p.stem),
            "{{owner_url}}": lambda: OWNER_URL,
        }
        for token, fn in tokens.items():
            if token in body:
                body = body.replace(token, fn())
        crumbs_html, crumbs_ld = ("", "")
        if meta.get("crumb"):
            crumbs_html, crumbs_ld = breadcrumbs([(meta["crumb"], None)])
        body = body.replace("{{crumbs}}", crumbs_html)
        faq_html, faq_ld = faq_block(meta.get("faq"))
        body = body.replace("{{faq}}", faq_html)
        meta["_body"] = body
        meta["_path"] = path
        meta["_ld"] = crumbs_ld + faq_ld
        yield meta


def write_static(pages):
    urls = []
    for p in pages:
        if not p["index"]:
            continue
        loc = SITE + "/" + ("" if p["path"] == "index.html" else p["path"])
        urls.append(f"<url><loc>{loc}</loc><lastmod>{p['updated']}</lastmod></url>")
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8")
    search = [{"t": p["title"], "d": p["desc"], "u": p["path"], "k": p["kind"], "x": p["keywords"]}
              for p in pages if p["index"]]
    for g in GLOSSARY:
        anchor = re.sub(r"[^a-z0-9]+", "-", g["term"].lower()).strip("-")
        search.append({"t": g["term"], "d": re.sub(r"[*`]", "", g["def"]), "u": f"glossary.html#{anchor}", "k": "term", "x": ""})
    (ROOT / "assets/data/search.json").write_text(json.dumps(search, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        "User-agent: *\nAllow: /\nDisallow: /content/\nDisallow: /scripts/\nDisallow: /thank-you.html\n\n"
        f"Sitemap: {SITE}/sitemap.xml\n", encoding="utf-8")
    (ROOT / "ads.txt").write_text("google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0\n", encoding="utf-8")
    # data the browser needs, copied next to the other assets
    for name in ("challenges.json", "observances.json", "tips.json", "actions.json"):
        src = ROOT / "content/data" / name
        if src.exists():
            data = json.loads(src.read_text(encoding="utf-8"))
            (ROOT / "assets/data" / name).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tools_meta = [{"slug": t["slug"], "name": t["name"], "blurb": t["blurb"], "pillar": t["pillar"]} for t in TOOLS]
    guides_meta = [{"slug": g["slug"], "title": g["title"], "pillar": g["pillar"]} for g in GUIDES]
    (ROOT / "assets/data/catalog.json").write_text(
        json.dumps({"tools": tools_meta, "guides": guides_meta,
                    "challenges": [{"slug": c["slug"], "title": c["title"], "pillar": c["pillar"], "days": c["days"]} for c in CHALLENGES]},
                   ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main():
    (ROOT / "assets/data").mkdir(parents=True, exist_ok=True)
    build_tools()
    build_guides()
    build_challenges()
    metas = list(build_pages())
    dynamic = {"index.html", "pulse.html", "videos.html"}
    for m in metas:
        path = m["_path"]
        kind = m.get("kind", "info")
        updated = TODAY.isoformat() if path in dynamic else m.get("updated", LAUNCH)
        if path != "sitemap.html":
            register(path, m.get("h1", m["title"]), m.get("description", ""), kind, updated,
                     m.get("keywords", ""), index=not m.get("noindex"))
    order = {"index.html": 0, "tools.html": 1, "my-numbers.html": 2, "score.html": 3, "plan.html": 4}
    PAGES.sort(key=lambda p: (order.get(p["path"], 50), p["kind"], p["title"]))
    write_static(PAGES)   # catalog and search index exist before pages that hash them
    for m in metas:
        body = m["_body"].replace("{{sitemap_html}}", sitemap_html(PAGES))
        layout(m["_path"], m, body, m["_ld"])
    print(f"Built {len(PAGES)} pages: {len(TOOLS)} tools, {len(GUIDES)} guides, {len(CHALLENGES)} challenges.")


if __name__ == "__main__":
    main()
