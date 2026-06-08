# Vettic Globals — Landing Page Plan

## 1. Goal & Priorities

A single, fast, static landing page for **Vettic Globals**, deployed free on GitHub Pages.

- **Priority 1 — Win clients.** Grab attention immediately, communicate the value, and make it
  frictionless to contact us / book a call. Conversion is the job of this page.
- **Priority 2 — Tease the product.** Give a small, credible glimpse of the AI matchmaking
  software we're building (matching candidate profiles to roles) so prospects see we're more
  than a service shop — we're building IP.

**Strategy:** Right now we deliver matchmaking with real human recruiters. Every engagement is a
learning loop that trains and validates the AI we're building. The page should frame the human
service as the offering *today* and the AI as where we're heading.

## 2. Tech Stack (keep it dead simple)

- Plain **HTML + CSS + vanilla JS**. No framework, no build step — GitHub Pages serves it as-is.
- Single `index.html` + `styles.css` + optional `main.js`. Mobile-first, responsive.
- No backend. All actions are outbound links (Calendly, mailto, tel, LinkedIn).
- Assets (logo, icons) committed directly. Use inline SVG or a CDN icon set to avoid bloat.
- Target: loads in < 1s, scores well on Lighthouse, works without JS for core content.

## 3. Information We Need (placeholders to fill in)

| Item            | Use on page                          | Value (TODO) |
|-----------------|--------------------------------------|--------------|
| Calendly link   | Primary CTA — "Book a call"          | `TODO`       |
| LinkedIn URL    | Credibility + contact                | `TODO`       |
| Gmail address   | `mailto:` contact button             | `TODO`       |
| Phone number    | `tel:` link + display                | `TODO`       |
| Company tagline | Hero headline                        | draft below  |
| Logo            | Header + favicon                     | `TODO`       |

> Until real values arrive, use clearly-marked placeholders so nothing ships broken.

## 4. Page Structure (single scroll)

1. **Header / Nav**
   - Logo "Vettic Globals" (left), nav anchors (How it works · Product · Contact),
     and a sticky **"Book a call"** button (right) linking to Calendly.

2. **Hero (Priority 1 — attention + CTA)**
   - Bold headline, e.g. *"The right people, vetted and matched — faster."*
   - One-line subhead explaining what we do (matchmaking talent to roles).
   - Two CTAs: **Book a call** (Calendly, primary) and **Email us** (mailto, secondary).
   - Clean background, lots of whitespace, one strong visual.

3. **Value / Why Vettic** (3 cards)
   - Speed · Precision-vetting · Human + AI. Short benefit-led copy, not jargon.

4. **How It Works** (3–4 steps)
   - Share your role → We source & vet → You get matched shortlists → Hire.
   - Reinforces that real experts run the process today.

5. **Product Glimpse (Priority 2 — the AI tease)**
   - Section titled e.g. *"What we're building: AI matchmaking."*
   - A simple, *static* mockup of the product: a "profile match" card UI showing a candidate
     with a match score, skills tags, and a fit summary. Make it look like a real screen.
   - Caption: "In active development — powered by every match we make today."
   - Optional small JS touch: an animated match-score bar to make it feel alive. Non-essential.

6. **Contact / CTA repeat**
   - All four contact methods as buttons: Book a call · Email · Call · LinkedIn.
   - Restate the primary CTA so users never have to scroll back up.

7. **Footer**
   - Copyright, company name, minimal links. © 2026 Vettic Globals.

## 5. Design Direction

- Professional, trustworthy, modern-B2B. Think clean SaaS landing page.
- Palette: one strong brand/accent color + neutral grays + white. (Pick brand color — TODO.)
- System font stack or one Google Font (e.g. Inter) for speed.
- Generous spacing, clear hierarchy, large tappable buttons on mobile.
- Subtle: hover states, smooth scroll for nav anchors. No heavy animation.

## 6. Build Steps

1. Scaffold `index.html` with semantic sections from §4.
2. Write `styles.css` — mobile-first, then desktop breakpoints.
3. Wire CTAs: Calendly link, `mailto:`, `tel:`, LinkedIn (use placeholders first).
4. Build the static product-glimpse mockup (the match card).
5. Add favicon + basic SEO meta (title, description, Open Graph tags for link previews).
6. Test responsive layout (mobile/tablet/desktop) and check all links.
7. Run a quick Lighthouse / accessibility pass.

## 7. Deploy to GitHub Pages

1. Commit `index.html` etc. to the `main` branch of `vetticglobals/home`.
2. Repo → Settings → Pages → Source: `main` branch, `/ (root)` folder → Save.
3. Site goes live at `https://vetticglobals.github.io/home/`.
4. (Optional) Add a custom domain later via a `CNAME` file + DNS.

## 8. Out of Scope (for now)

- No backend, forms-to-database, or analytics dashboard. (Could add a simple form via Formspree
  or Google Forms later if needed.)
- No CMS — copy is edited directly in HTML.
- The actual AI product — this page only *shows a glimpse*, it doesn't run anything.

## 9. Open Questions / TODO before building

- [ ] Calendly, LinkedIn, Gmail, phone number — real values.
- [ ] Logo file + brand color.
- [ ] Final hero headline & tagline wording.
- [ ] Do we want a basic contact form (Formspree) or just direct links? (Default: direct links.)
- [ ] Revoke the GitHub token currently in `project_management.txt` and rotate it.
