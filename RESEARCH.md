# Healthy.Life — Research, Concept and Benchmark

Prepared 19 November 2026. Every site below was opened and read directly (page fetched, contents recorded). Sites that refused the fetch are listed separately and were **not** counted.

---

## 1. The concept in one line

**Healthy.Life = "Know your numbers. Build your healthy life."**
One free profile runs 25 health calculators at once, rolls them into a single **Healthy Life Score (0–100)** across six pillars, and turns the result into a **free 30-day plan**. The plan wizard is the lead engine; tools, guides, challenges, a self-updating health-news pulse and a video hub feed it and carry AdSense.

### Why this, and not a health magazine

| Option | Verdict | Reason |
| --- | --- | --- |
| Health news/content magazine (Healthline model) | Rejected | YMYL content needs medical-review staff and years of authority. A static site cannot out-rank Healthline, WebMD or Mayo on articles. |
| Pure calculator site (calculator.net model) | Half the answer | Evergreen search demand and long dwell time, but the benchmark shows calculator sites capture **zero leads**: no profile, no follow-through, ads only. |
| Single-product funnel (Ro, Hims, WW, Noom model) | Rejected | Needs a product, licences and paid acquisition. But it proves the mechanic: a free calculator result is the highest-intent moment to ask for the next step. |
| **Score + toolkit + plan (chosen)** | **Build** | Combines the calculator sites' traffic model with the funnels' conversion mechanic, and stays inside AdSense's health-content rules because every number is tied to a published guideline. |

The gap nobody fills: **enter your details once, see every number, get one plan.** Calculator sites make you retype everything per tool; publishers have articles but thin tools (Healthline's "macro calculator" page had no working calculator when read); funnels only want to sell one thing.

### The six pillars (site architecture and score model)

Move · Nourish · Sleep · Mind · Connect · Prevent

---

## 2. Revenue model (assumptions stated, not promises)

| Stream | Mechanic | Assumption | At 100k sessions/mo |
| --- | --- | --- | --- |
| **Lead marketplace (primary engine)** | Plan wizard collects goal, pillar scores, budget, format preference and consent to be matched with up to 3 vetted pros (coach, dietitian, trainer, programme). Corporate-wellness and pro-network forms run alongside. | 2.5% of sessions finish the wizard; 25% opt in to matching; US$20 per consumer lead, US$150 per team lead | 625 matched leads ≈ **US$12,500** + team leads |
| Google AdSense | Auto ads site-wide; manual units on tools, guides, pulse, videos | 3.2 pages/session, page RPM US$6–14 (health tools, tier-1 traffic) | **US$1,900–4,500** |
| Tool and section sponsorship | "Sleep calculator presented by …", newsletter, category exclusives | 2–4 sponsors at US$500–2,000 | US$1,000–8,000 |
| Affiliate | Apps, meal kits, sleep products, home BP monitors on result pages | 0.4% of sessions convert, US$18 average payout | ≈ US$7,200 |
| Donations | Support page, pledge form, payment links | 0.1% of visitors, US$8 average | ≈ US$800 |
| Domain equity | A developed, indexed, earning site on a one-word-pair `.life` domain | Not sized here | Upside on exit |

**Safe path:** AdSense + affiliate on tools and guides; no partner network to manage. Ceiling is traffic-bound.
**Bold path:** sign 10–20 coaches/dietitians and 2–3 corporate-wellness vendors before scaling traffic, and sell exclusive lead territories. Same traffic, roughly 3–5× the revenue, but it needs sales effort and lead-quality discipline.
The site is built for the bold path and earns on the safe path from day one.

**Hard constraint:** AdSense cannot approve a `github.io` address. The site must be served on `healthy.life` (custom domain on GitHub Pages) before applying.

---

## 3. Trademark position

- **Healthylife** (one word) is an Australian health retailer, pharmacy and telehealth brand owned by Woolworths Group; its footer reads "© Healthylife Company Pty Ltd". IP Australia records show marks assigned from Woolworths Group Limited to HealthyLife Company Pty Limited (2021).
- A US word mark **HEALTHY LIFE** (Reg. No. 2043907) is registered and renewed in International Class 30 (staple foods).
- "Healthy life" is also an ordinary descriptive phrase used by thousands of publishers.

**Rules applied on this site**

1. The brand is always written **Healthy.Life** (with the dot, as the domain name). Never "Healthylife", "HealthyLife" or "Healthy Life" as a brand.
2. No retail, pharmacy, telehealth, supplements or food products are sold under the name.
3. Own visual identity (pulse-ring mark, coral and deep-green palette); nothing borrowed from any similarly named business.
4. A Trademark & Copyright disclosure is linked from every footer (`legal.html`) and summarised in the footer itself.
5. All text, code, illustrations and calculators are original. News items are headline + source + link only. Videos are official embeds that stay the property of their creators.

---

## 4. Benchmark: 46 sites read directly

| # | Site (page read) | What it actually does | What Healthy.Life takes from it |
| --- | --- | --- | --- |
| 1 | CDC (Adult BMI Calculator) | US/metric toggle, BMI + category, obesity classes 1–3, review date, embed code, no ads, no-JS formula fallback | Category table, validation messages, "screening not diagnosis" wording |
| 2 | WebMD (BMI calculator) | BMI first, then optional waist/hip and a "Healthy Weight Plan" (age, activity, goal); medical reviewer; ads | Progressive disclosure: number first, plan second |
| 3 | Healthline (macro calculator page; Noom partner page) | Article about calculators with no working tool; reviewer, sources, TOC. Partner page labelled "sponsored" with repeated quiz CTAs | Trust block layout; clearly labelled partner placements |
| 4 | Omni Calculator (water intake) | Age/sex inputs, total vs beverage water, creators + reviewers, sources, "was this helpful" | Show the source of every formula; helpfulness prompt |
| 5 | Calculator.net (macro) | Mifflin-St Jeor or Katch-McArdle, unit tabs, food macro table, sidebar of 10 health calculators, no lead capture | Formula choice; related-tools rail |
| 6 | Sleep Foundation (sleep calculator) | Age + wake/bed time → cycles; "trouble sleeping?" quiz; email guidebook; ads + mattress affiliate; reviewer | Quiz after result; email lead magnet |
| 7 | Ro (TDEE calculator) | Free calculator, 1,200/1,500 kcal floor, then GLP-1 programme CTAs, LegitScript seal | Safety floors; result page as conversion point |
| 8 | Hims (water calculator) | Cups-per-day range, then weight-loss consultation CTAs; disclaimers only | What to avoid: no reviewer, no sources |
| 9 | Precision Nutrition (macro calculator) | Rich inputs, hand-portion output, summary free, full guide for email | Free summary, optional email for the full plan |
| 10 | AASM Sleep Education (bedtime calculator) | Age + wake time; sleep-need table by age; printable PDFs; no ads | Sleep-need ranges by age |
| 11 | Bupa UK (BMI) | BMI + limitations (age, muscle, pregnancy, ethnicity); promotes paid health assessments; PIF TICK | Limitations box on every tool |
| 12 | WeightWatchers UK (BMI) | BMI bands with one-line advice, then membership plans | One-line "what next" per result band |
| 13 | MedicineNet (BMI) | Dial inputs, chart position, quiz + slideshow cross-links, reviewer and date | Visual gauge for results |
| 14 | Active.com (BMI) | "We don't store your data"; 8 sibling calculators; newsletter; event registration | Privacy line beside every form |
| 15 | World Cancer Research Fund (BMI) | Calculator + health check + calorie tools; free Activ8 email plan; donate, legacy, lottery | Email programme as lead magnet; donation options |
| 16 | familydoctor.org / AAFP (healthy living) | Physician-reviewed plain-language article, "questions to ask your doctor" | "Questions to ask" block in guides |
| 17 | UnitedHealthcare (6 habits) | Short habit article with 10 cited sources | Source list discipline |
| 18 | HealthPartners (9 tips) | Tips grouped by pillar with soft links to dietitians, coaching, clinics | Pillar structure with soft service links |
| 19 | National Breast Cancer Foundation (weekly tips) | Weekly healthy-living email series, dozens of free guides, donate, charity badges | Weekly tip series as newsletter promise |
| 20 | Blue Zones Project (RealAge Test) | 15-minute test behind a free account, retake yearly, tied to community events | Retake prompt; progress over time |
| 21 | Nourish Move Love (30-day plan) | 30-day calendar, daily video, PDF, affiliate gear, email for some extras | Calendar-style challenges with daily cells |
| 22 | 101 Planners (water calculator) | Output in cups/oz/L/bottles + drinking schedule, print/copy, tracker and challenge links | Schedule output; print and copy buttons |
| 23 | Calm (sleep calculator article) | Clinically reviewed article funnelling to a 14-day app trial | Content-to-product funnel shape |
| 24 | Sleep.com / Mattress Firm | Static cycle chart, newsletter, shop links | Why interactive beats a static chart |
| 25 | Barbell Medicine (TDEE) | Activity-level mini-quiz, six sibling calculators, programmes and app | Activity quiz to fix the most-misjudged input |
| 26 | GIGAcalculator (BMI) | BMI Prime, share + embed code, cite-this-page formats | Share and cite blocks |
| 27 | Mayo Clinic (Healthy Lifestyle) | Life stages + six topics; newsletter + free book; ads support mission; books; giving | Hub page pattern; honest "how we're funded" line |
| 28 | NHS (Live Well, Exercise) | 14 plain-language topic cards, BMI tool, guidelines by age, no ads | Card grid; plain-language tone |
| 29 | American Heart Association (Life's Essential 8, My Life Check) | Eight-factor checklist, heart-health score tool, fact sheets, donate once/monthly | Score built from named factors; monthly-giving option |
| 30 | MyPlate.gov (MyPlate Plan) | Calorie-level food plan from age/sex/height/weight/activity; site widget | Plate-based eating guidance |
| 31 | Healthylife.com.au | Retail, pharmacy, telehealth, food tracker, rewards (Woolworths Group) | Trademark boundary: what this site must not resemble |
| 32 | mindbodygreen (article) | Read/Learn/Listen/Shop; "Advertisement" labels; own supplements; affiliate | Clear ad labelling |
| 33 | Medical News Today (article) | Tools menu, reviewer, sources, affiliate disclosure line | One-line monetisation disclosure |
| 34 | The Sleep Charity (sleep calculator) | Embedded third-party calculator, helpline, newsletter form, donate | Newsletter form fields |
| 35 | ZAVA (TDEE) | Calculator + sample outputs + doctor consult CTA, six dated sources | Worked examples under each tool |
| 36 | WeCovr (water calculator) | Calculator → "Get My Free Protection Score" three-step check → cover request | Score-then-help funnel; regulatory details in footer |
| 37 | Trusted Choice | "Get matched with an agent" after a few questions | Matching language for the pro network |
| 38 | Inch Calculator (BMI) | Weight-range table by category, DO author + RDN reviewer, 11 references, dark mode, embed | Healthy-range table; dark mode |
| 39 | FatCalc (TDEE) | Four activity results at once, 35 calculators, 2023 National Academies equations | Show all activity levels side by side |
| 40 | RunBundle (heart-rate zones) | Max-HR or heart-rate-reserve method, 5 zones | Two-method zone calculator |
| 41 | Gym Geek (maintenance calories) | Multi-step form, kcal/kJ, floors, excludes pregnancy/under-18/eating disorders | Exclusion notes on energy tools |
| 42 | Marathon Handbook (TDEE) | Calculator + daily newsletter + affiliate disclosure | Daily/weekly email hook |
| 43 | Green Chef (10 tips) | Tips article wrapped in a first-box discount | Content marketing shape (not copied) |
| 44 | HubFit (heart-rate zones) | Tanaka formula, Karvonen toggle, "start for free" SaaS CTAs | B2B lead via free tool |
| 45 | CalculatorSoup (BMI) | Adult + child modes, formulas with worked examples, widget offer | Worked-example formulas |
| 46 | UF Health (Healthy Living) | Reviewed overview, named reviewers, review date, find-a-doctor | Reviewed-on date display |

**Read as supporting evidence (not counted):** a teardown of Noom's sign-up quiz (10 minutes, education screens between questions, email asked before the projected-date reveal); two "best health sites" lists used to find candidates.

**Refused or failed the direct fetch (not counted):** Harvard Health (redirect), MyHealthfinder (redirect), Aditya Birla Health (redirect), Justia trademark record, Men's Health UK, and the home pages of Mayo Clinic, heart.org, NIH, Psychology Today, Well+Good, MyFitnessPal, Verywell Health, Greatist, Everyday Health, Prevention, Self, Women's Health and Men's Health. Deep pages of Mayo, heart.org, Healthline and mindbodygreen were read instead.

---

## 5. Patterns that repeat across the benchmark

**Tools**
- Unit toggle (US/metric), inline validation, reset, instant result, visual gauge.
- Result → one-line meaning → "what next" → related tools.
- Formula shown with a worked example and its source; reviewer/"last reviewed" date.
- Safety floors on calorie tools (1,200/1,500 kcal) and exclusion notes (pregnancy, under 18, eating disorders).
- Share, print, copy, embed and cite blocks.
- A privacy line: nothing leaves the browser.

**Lead capture**
- Newsletter on nearly every site; the stronger sites trade a specific asset for the email (guide, weekly series, plan, score).
- Assessments convert best when the first result is free and the *plan* is the ask (WebMD, Precision Nutrition, WeCovr, Blue Zones/RealAge).
- Commercial funnels place the CTA directly under the calculator result.

**Trust (YMYL)**
- Named sources, review dates, editorial policy, "not medical advice", how the site is funded.

**Monetisation**
- Display ads with "Advertisement" labels; affiliate with a one-line disclosure; clearly labelled sponsor pages; donations with one-off and monthly options; memberships and own products at the top end.

**What nobody does** → Healthy.Life's wedge
- One profile shared by every tool.
- One score that combines the tools with lifestyle answers.
- A plan generated on the spot, with optional human follow-up.
- All of it without an account.

---

## 6. Guideline figures verified for the tools (November 2026)

| Topic | Figure used | Source read |
| --- | --- | --- |
| Adult BMI categories | <18.5 underweight · 18.5–24.9 healthy · 25–29.9 overweight · ≥30 obesity (classes 1–3) | CDC |
| Physical activity, adults | 150–300 min moderate or 75–150 min vigorous per week + muscle strengthening on 2+ days | WHO |
| Sleep need | Adults 7+ h; teens 8–10 h; ages 6–12 9–12 h | AASM |
| Blood pressure categories | Normal <120 and <80 · Elevated 120–129 and <80 · Stage 1 130–139 or 80–89 · Stage 2 ≥140 or ≥90 · Crisis >180 and/or >120 | American Heart Association |
| Total water (adequate intake) | ≈3.7 L/day men, ≈2.7 L/day women, all drinks and food | National Academies (via Omni Calculator citation) |
| US Dietary Guidelines 2025–2030 (released 7 Jan 2026) | Protein 1.2–1.6 g/kg/day; limit highly processed foods; sodium <2,300 mg; saturated fat <10% of calories; added sugars discouraged | USDA/HHS coverage (AAFP, OSU Extension, CSPI, Stanford) |
| Calorie floors | No targets under 1,200 kcal (women) / 1,500 kcal (men) | Common practice across Ro, Gym Geek |
