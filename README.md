# Healthy.Life

**Know your numbers. Build your healthy life.**
A free healthy-living toolkit: 25 calculators that share one profile, the 18-question **Healthy Life Score**, a **free 30-day plan** wizard that turns visitors into graded leads, 25 guides, 7 challenges with trackers, and a Health Pulse and video hub that refresh themselves.

Static site, no runtime dependencies, hosted free on GitHub Pages.

- `RESEARCH.md`: concept, revenue model, trademark position and the 46-site benchmark
- `PROMPTS.md`: phase-by-phase prompts to rebuild or extend the site

## How it is built

`scripts/build.py` (Python standard library only) wraps every page body in one shared layout (owner bar, header, AdSense tag, structured data, footer) and writes plain HTML to the repository root. GitHub Pages serves those files as they are.

| Path | What it holds |
| --- | --- |
| `content/pages/*.html` | Page bodies with a JSON header (title, description, scripts, FAQ) |
| `content/tools/*.md` | One file per calculator page: JSON header + Markdown body. The maths lives in `assets/js/tools.js` |
| `content/guides/*.md` | Guides: JSON header + Markdown body. Add a file to add a guide |
| `content/data/*.json` | Challenges, plan actions, tips, observances, glossary, news feeds, video channels |
| `scripts/build.py` | Generator: layout, navigation, sitemap, search index |
| `scripts/update.py` | Refresh of headlines, videos and food recalls from public feeds |
| `.github/workflows/refresh.yml` | Runs the refresh every 6 hours and rebuilds on content changes |
| `assets/js/config.js` | Encoded form inbox, AdSense slot IDs, payment links, contest details |
| `assets/js/*.js` | `site.js` (shared), `tools.js` (25 tools), `numbers.js`, `score.js`, `plan.js`, `challenge.js`, `search.js` |
| `assets/data/*.json` | Generated data: news, videos, recalls, search index, refresh status |
| `*.html`, `tools/`, `guides/`, `challenges/`, `sitemap.xml` | Generated output. Edit `content/` and rebuild instead |

Edit a page: change the file in `content/`, commit, and the workflow rebuilds and commits the HTML. Locally: `python3 scripts/build.py`.

Add a tool: add a definition to `T` in `assets/js/tools.js` and a matching `content/tools/<slug>.md`.

## Self-updating parts

- **Every 6 hours (GitHub Actions):** headlines from WHO, NIH, CDC, FDA and health desks; newest videos from the followed channels; FDA food recalls; this month's observances; sitemap dates. `assets/data/status.json` reports which sources answered.
- **On every content push:** pages rebuild.
- **In the browser, every visit:** tip of the day, today's observance, contest countdown, copyright year.

## One-time setup checklist

1. **Publish from `main`:** Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `(root)` → Save. (If a `gh-pages` branch exists it was only used to switch Pages on; the workflow keeps it identical to `main`, and it can be deleted once `main` is selected.)
2. **Custom domain (required for AdSense):** Settings → Pages → Custom domain `healthy.life` → Save. At the registrar: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`; `www` CNAME → `webworksa1.github.io`. Tick *Enforce HTTPS* once the certificate is issued.
3. **Forms:** submit any form once. The form service sends a one-time activation email to the site inbox; click *Activate*. The address is stored encoded in `assets/js/config.js` and never appears in page source.
4. **AdSense:** add `healthy.life` as a site, keep `ads.txt` at the root, turn on Auto ads, and enable Google's consent message for the EEA, UK and Switzerland. After approval, paste display-unit slot IDs into `adSlots` in `config.js`.
5. **Contest:** confirm or change the prize and closing date in `contest` in `config.js` before promoting the page. It is a public promise.
6. **Payments:** paste PayPal, Stripe or Buy Me a Coffee links into `donate` in `config.js`. Until then the Support page collects pledges.

## Trademark and copyright

Original content © Healthy.Life. The brand is always written **Healthy.Life**, as the domain name. Not affiliated with Healthylife (Woolworths Group, Australia), any HEALTHY LIFE food trademark, or any other similarly named business. Third-party names are used for identification only. News headlines link to their publishers; embedded videos remain the property of their creators. Fonts are under the SIL Open Font License. Full disclosure: `legal.html`.

Website, domain, sponsorship, advertising and partnership enquiries: https://web.works/contact
