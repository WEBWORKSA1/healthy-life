# Healthy.Life — Phase-wise Build Prompts

Run these in order to rebuild or extend the site. Each phase ends with a check that must pass before the next one starts.
`[SITE INBOX]` is the private address that receives every form. It is only ever stored encoded in `assets/js/config.js` and must never be written in plain text in any file, commit message or page.

---

## Phase 0 — Research and positioning

> Research the healthy-living niche for the domain **Healthy.Life**. Open and read at least 38 leading sites directly, across: public-health bodies (CDC, NHS, WHO, MyPlate, American Heart Association), health publishers (Healthline, WebMD, Mayo Clinic, Medical News Today, mindbodygreen), calculator sites (Calculator.net, Omni Calculator, GIGAcalculator, Inch Calculator, FatCalc), sleep sites (Sleep Foundation, AASM, Calm), product funnels that use free tools (Ro, Hims, WeightWatchers, ZAVA, Precision Nutrition, WeCovr) and charities with donation flows (World Cancer Research Fund, National Breast Cancer Foundation, The Sleep Charity). For each site record what it actually does: tools and inputs, forms, lead capture, monetisation, trust signals, design. List any site that blocks the read and do not count it. Then choose the single most profitable concept for the domain, size each revenue stream with stated assumptions, name one primary revenue engine, and check trademark conflicts with "Healthylife" and "Healthy Life". Verify every guideline figure the tools will use against its source. Output `RESEARCH.md`.

**Check:** 38+ sites read directly and tabled; the concept names one primary engine (the lead marketplace), not "ads plus everything"; trademark rules are written down.

## Phase 1 — Foundation, layout and compliance

> Build a static, dependency-free site for GitHub Pages (free plan, `main` branch, served from the repository root). Use a Python standard-library generator, `scripts/build.py`, that wraps page bodies from `content/` in one shared layout and writes plain HTML. All internal links must be relative so the site works at a domain root and in a sub-folder. Every page must carry:
> - the AdSense tag `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6620975821265271" crossorigin="anonymous"></script>` in the head (except the 404, thank-you and offline pages) and `<meta name="google-adsense-account" content="ca-pub-6620975821265271">`;
> - a bar at the very top reading "Contact, if you are interested in this website / domain name / Sponsorship / Advertisement / Partnership", linked to `https://web.works/contact`, with the address never shown as text;
> - canonical URL, Open Graph tags, JSON-LD (Organization, WebSite with SearchAction, BreadcrumbList, plus Article, FAQPage or WebApplication where relevant);
> - a footer with the medical disclaimer, the no-affiliation statement, a funding line and the policy links.
>
> Design: numbers are the heroes and every number sits on a measuring tape with guideline bands. Spruce, beet and lemon brand colours; range colours appear only in data. Bricolage Grotesque for display and numbers, Atkinson Hyperlegible Next for text, both self-hosted. Light and dark themes, skip link, visible focus, reduced-motion support, responsive from 360 px.
> Pages: about, contact, editorial policy with a "how we make money" section, medical disclaimer, privacy and cookies (Google advertising cookies, opt-outs, local storage, form processor, rights), terms, trademark and copyright disclosure, accessibility, HTML site map, search, 404, thank-you, offline. Files: `ads.txt` (`google.com, pub-6620975821265271, DIRECT, f08c47fec0942fa0`), `robots.txt`, `sitemap.xml`, web manifest, service worker, SVG and PNG icons, share image, `.nojekyll`.

**Check:** every page has the owner bar and exactly one `h1`; AdSense tag on every content page; no email address in any file; zero broken internal links.

## Phase 2 — The tool engine and 25 calculators

> Build one engine in `assets/js/tools.js`. Each tool is a definition: a list of fields and a `calc` function. The engine draws the form, switches metric and US units, validates ranges inline, remembers shared fields (units, sex, age, height, weight, waist, neck, hips, resting heart rate, activity) in the browser so every tool pre-fills, renders the result as a large number with a category tag, a tape gauge, a plain-language meaning and a table of rows, and offers copy-link, print and "see all my numbers".
> Tools: BMI, waist-to-height ratio, body fat (U.S. Navy), healthy weight range, BMR (Mifflin-St Jeor), daily calories (TDEE, five activity levels side by side), macros, protein, water intake, weight goal planner, calories burned (MET table), heart-rate zones (Tanaka, 220 − age, Karvonen), steps, pace with Riegel predictions, one-rep max, weekly activity checker, sleep calculator, caffeine cut-off, breathing timer, blood pressure checker, A1C converter, alcohol units, smoke-free calculator, due date, checkup checklist.
> Guard rails: no calorie target under 1,200 kcal (women) or 1,500 kcal (men); refuse weight goals under BMI 18.5; warn above 1% of body weight a week; prompt urgent care above 180/120.
> Each tool gets its own page from `content/tools/<slug>.md`: lead, formula with a worked example, category table, limits, FAQ, sources, related tools and guides, plan call-to-action.
> Add `my-numbers.html`: one profile form that shows every profile-driven number as a tile, lists results saved from other tools, and can clear all local data. Put a three-input live demo of the engine in the home-page hero.

**Check:** run each tool in a headless browser against hand-calculated answers; no console errors; nothing overflows at 360 px.

## Phase 3 — Healthy Life Score

> Build `score.html`: 18 single-choice questions, three per pillar (Move, Nourish, Sleep, Mind, Connect, Prevent), one question per screen with a progress bar. Points per answer follow published guidelines. Pillar score is the mean of its three answers; the total is the mean of the six pillars. Result: animated dial, six pillar bars, a band (Thriving, Strong, Building, Starting), the three lowest pillars with two actions each and links to the matching tool, guide and challenge, a history sparkline, share link, downloadable score card drawn on a canvas, print and retake. Store everything in the browser only. No weight or medical questions. State clearly that it is a self-check, not a medical assessment.

**Check:** complete the quiz on a phone-width screen; the result persists on reload; the share link shows only the total.

## Phase 4 — Lead engine

> Build `plan.html`, the dedicated lead-generation page: a five-step wizard (goals, up to three; pillar ratings or the saved score; time, support style, monthly budget, start date; age group, who it is for, country; contact). Week 1 of the plan is shown before any details are asked. Name and email unlock weeks 2 to 4 on the page; phone is optional. Two consent boxes: required privacy and email consent, and optional "introduce me to up to three vetted professionals". Grade each lead HOT, WARM or COOL from support style, budget, start date, phone, team use and the introduction box, and put the grade in the subject line. Send goals, focus pillars, pillar scores, preferences and source with the lead.
> Add the supply and B2B sides: `pros.html` (professionals apply to receive introductions; credential, area, format, capacity) and `teams.html` (workplace wellbeing proposal request; size, priorities, start, budget per person).
> Send every form through one function that decodes `[SITE INBOX]` from an encoded array in `config.js` at the moment of sending, posts JSON to the FormSubmit AJAX endpoint, and falls back to an ordinary form post with a thank-you redirect. Add a honeypot field to every form. Add a plan call-to-action under every tool and guide, a dismissible sticky bar after 35% scroll, and a home-page plan band.

**Check:** intercept the request in a test: the endpoint is correct, the subject carries the grade, and the address does not appear in the DOM or any source file.

## Phase 5 — Content depth for AdSense approval

> Write 25 original guides in plain language, 450 to 700 words each, grouped by pillar: how much exercise, walking, strength basics, sitting less, heart-rate training; balanced plate, protein, added sugar, fibre, hydration, food labels; how much sleep, sleep habits, caffeine and sleep, naps; stress and breathing, habits that stick, screens; social connection; know your numbers, home blood pressure, BMI and its limits, quitting smoking, alcohol, sun safety. Each guide: a three-point short version, tables where they help, an FAQ with FAQPage schema, named sources with links, related tools, a last-reviewed date and a disclaimer. Where authorities disagree, say so. Add seven challenges with day-by-day tasks and browser-saved trackers, a glossary of 50+ terms, and an awareness calendar. No copied text, no invented testimonials, no miracle claims, no before-and-after imagery.

**Check:** 80+ indexable pages with substance; every health figure traces to a listed source.

## Phase 6 — Self-updating automation

> Add `scripts/update.py` (standard library only) and `.github/workflows/refresh.yml`, running every 6 hours, on manual dispatch and on pushes to content, scripts or assets. The script reads `content/data/feeds.json` and `channels.json`; pulls RSS and Atom feeds from WHO, NIH, CDC, FDA, Harvard Health, ScienceDaily, NPR, BBC, KFF Health News and The Conversation, plus topic searches per pillar; keeps headline, source, date and link only; classifies by pillar; filters unsuitable titles; de-duplicates. It resolves YouTube channel IDs from handles, reads each channel's public feed and keeps the three newest videos. It reads the FDA open-data food enforcement feed. It writes `news.json`, `videos.json`, `recalls.json` and a `status.json` report, and never wipes existing data when a source fails. The workflow then runs the generator so headlines and videos are baked into the HTML, commits only when something changed, and pushes to `main`. In the browser: tip of the day, today's observance, contest countdown, copyright year.

**Check:** run the workflow once; confirm a bot commit, a populated Health Pulse and a readable `status.json`.

## Phase 7 — Community and money pages

> Build `support.html` (what support pays for: operations, new tools, expert review, hiring, promotion and marketing, contest prizes; amount tiers; one-time or monthly; payment links read from `config.js`, with a pledge form when none are set), `contests.html` (round name, prize, closing date and countdown from `config.js`; entry form; judging criteria; official rules: skill contest, no purchase necessary, age of majority, void where prohibited, skill-testing question for Canada; no body photos, no weight-based judging), `careers.html` (reviewers, writers, video creators, translators, developers, partnerships, moderators; application form), `advertise.html` (placements, advertising standards, enquiry form), `pulse.html` and `videos.html` with pillar filters.

**Check:** every form reaches the same encoded inbox; payment buttons stay hidden until a link is configured.

## Phase 8 — QA and AdSense readiness

> Sweep the whole site and report every issue in one list before fixing anything: broken links and anchors; console errors on every page; layout at 360, 768 and 1280 px; calculator results against hand calculations; keyboard use and focus; owner bar and AdSense tag on every content page; no email in any file; `ads.txt` at the root; privacy policy names Google advertising cookies and opt-outs; cookie notice present; no leftover template tokens; brand always written "Healthy.Life".

**Check:** zero broken links, zero console errors, zero overflow.

## Phase 9 — Deploy

> Push to `webworksa1/healthy-life` on `main`. Enable GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root. Confirm the first workflow run commits fresh data. Add the custom domain `healthy.life` (A records 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; `www` CNAME to `webworksa1.github.io`), enforce HTTPS, then add the site in AdSense, switch on Auto ads and enable Google's consent message for the EEA, UK and Switzerland. Submit one form and click the activation link the form service sends.

**Check:** the live URL loads; `ads.txt` resolves at the domain root; a test form arrives.

## Phase 10 — Growth after launch

> Sign 10 to 20 vetted coaches and dietitians and two or three corporate-wellness providers before scaling traffic; price introductions per lead or by territory. Add a named, credentialed reviewer to the highest-traffic tools and guides. Translate the tools into French, Spanish and Hindi. Add tools one at a time from search demand (pregnancy weight gain, child BMI percentile, VO2 max estimate, fibre counter). Publish one data piece a month from the anonymous, opt-in totals people choose to share. Test wizard step order and the week-1 preview against completion rate. Paste AdSense display slot IDs into `config.js` after approval.
