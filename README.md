# AI Models Intelligence Dashboard

A production-ready **Next.js 14 (App Router)** dashboard to **compare, analyze and choose** the
top commercial AI models — pricing, context windows, multimodality, benchmarks, compliance and
lifecycle — plus a **Gemini-powered recommendation engine** that suggests the best-fit model for a
plain-language requirement, **with reasoning**.

> **Live target:** https://aimodelsdashboard.vercel.app/ · **Repo:** https://github.com/itsmeirshad2006/AIDashboard

---

## ✨ Features

**Answers these questions at a glance:**

1. Which model has the **lowest cost** per 1M tokens (and lowest blended input+output cost)?
2. Which models support a **1M+ context** window?
3. Which models are available on **Azure**?
4. Which models are **open source**?
5. Which models are **deprecating within 90 days** (auto-computed from each retirement date)?
6. Which models are **best for coding** (ranked by coding benchmark)?
7. Which models support **multimodal inputs** (image / audio / video)?
8. Which vendor has the **most active frontier models**?
9. What is the **price of each model**?
10. **Which model best fits my requirement** — and *why* (Gemini-powered)?

**Sections**

- **Overview** — KPI cards + at-a-glance answers, with a 90-day deprecation warning banner.
- **AI Recommender** — describe your needs in natural language; Gemini ranks the best-fit models with specific, always-visible reasoning.
- **Master Comparison Table** — search, multi-column sort, filter by every attribute, **CSV export**.
- **Side-by-Side** — compare 2–4 models across every attribute (best value per row highlighted).
- **Cost Calculator** — enter monthly token volumes → estimated monthly cost per model, cheapest first.
- **Capability Matrix** — yes/no grid (function calling, JSON, streaming, vision, audio, video, fine-tuning, reasoning).
- **Benchmarks** — per-dimension leaderboards + head-to-head **radar charts**.
- **Value for Money** — capability score vs. blended cost (log-scale scatter).
- **Lifecycle** — release → retirement timeline with countdowns for anything retiring in 90 days.
- **Category Browser** — models grouped by category with their best use cases.
- **Compliance & Governance** — SOC 2 / ISO 27001 / HIPAA / GDPR / data residency / data-retention policy.
- **Certifications** — per-model attestations, filterable.
- **Performance** — latency, throughput and rate-limit comparison.

**Design** — restrained, enterprise-grade MoroHub aesthetic (deep-slate base + a single refined green
accent and cool neutrals — no bright/jazzy colours), light/dark mode, fully responsive, WCAG-AA-minded
contrast, loading/empty/error states.

**Data source** — the model catalog is **generated live by the Gemini API** on the server
(`/api/models`), normalized to a strict TypeScript schema, and cached. If live generation is
unavailable (missing key / quota / error) the app falls back to a curated reference snapshot and
labels it. The header shows a **Live · Gemini** / **Reference data** indicator you can click to refresh.

---

## 🧱 Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) (CSS-variable theming)
- [Recharts](https://recharts.org/) for charts
- [lucide-react](https://lucide.dev/) for icons
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Gemini) — **server-side only**

---

## 🚀 Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#   then edit .env.local and set GEMINI_API_KEY=...   (see below)

# 3. Run the dev server
npm run dev
# open http://localhost:3000
```

### Environment variables

| Variable         | Required | Default            | Purpose                                                        |
| ---------------- | :------: | ------------------ | -------------------------------------------------------------- |
| `GEMINI_API_KEY` |   Yes\*  | —                  | Server-side key powering the live catalog and recommendations. |
| `GEMINI_MODEL`   |    No    | `gemini-2.5-flash` | Override the Gemini model used for generation.                 |

\* All model data is generated **live by the Gemini API** (server-side). Without a valid key the
dashboard automatically falls back to a curated reference snapshot and clearly labels it, so the
app always renders. The AI Recommender requires the key.

Get a key at **https://aistudio.google.com/app/apikey** (use a key with quota for `gemini-2.5-flash`).

> 🔒 **Security:** The key is read from `process.env.GEMINI_API_KEY` **only**, used exclusively inside
> the server route `app/api/recommend/route.ts`, and is **never** sent to the browser. `.env.local` is
> gitignored — never commit secrets.

---

## 🛠️ Build & run (production)

```bash
npm run build   # type-checked production build
npm run start   # serve the production build (http://localhost:3000)
npm run lint    # ESLint
```

---

## ▲ Deploy to Vercel

1. **Push to GitHub** (this repo): https://github.com/itsmeirshad2006/AIDashboard
   ```bash
   git push -u origin main
   ```
2. Go to **https://vercel.com/new** and **Import** the `itsmeirshad2006/AIDashboard` repository.
   Vercel auto-detects Next.js — no build configuration needed.
3. In the import screen (or later under **Project → Settings → Environment Variables**), add:
   - `GEMINI_API_KEY` = *your Gemini API key*  (Environments: Production, Preview, Development)
   - *(optional)* `GEMINI_MODEL` = `gemini-2.0-flash`
4. Click **Deploy**. Vercel runs `npm run build` and hosts the app.
5. *(Optional)* Under **Settings → Domains**, attach `aimodelsdashboard.vercel.app`.

> After changing environment variables, **redeploy** so the server route picks them up.

---

## 📁 Project structure

```
app/
  layout.tsx              Root layout, theme boot script, metadata
  page.tsx                Renders the dashboard
  globals.css             Theme tokens (light/dark) + base styles
  api/models/route.ts     Serves the catalog (Gemini-generated, cached)
  api/recommend/route.ts  Server-side Gemini recommendation route (key never leaves the server)
components/
  Dashboard.tsx           App shell: sidebar nav, header, section router
  DeprecationBanner.tsx   90-day retirement warning
  ThemeToggle.tsx
  ModelMultiSelect.tsx
  providers/ThemeProvider.tsx
  ui/primitives.tsx       Card, Badge, BoolCell, ScoreBar, SectionHeading
  sections/               One component per dashboard view
data/
  models.ts               Typed fallback dataset (used only if live generation fails)
lib/
  catalog.ts              Server-side: Gemini catalog generation, validation, caching, fallback
  types.ts                The AIModel interface and sub-types
  utils.ts                Formatting, cost math, aggregations, CSV export
  constants.ts            MoroHub palette (green → slate)
  sections.ts             Navigation config
```

Every view is just a **filter / sort / visualization** over the live catalog returned by
`/api/models` (with `data/models.ts` as the typed fallback).

---

## ⚠️ Data disclaimer

The model catalog is **generated by the Gemini API and is therefore AI-generated**. Specifications,
pricing, lifecycle dates and the **normalized 0–100 benchmark scores** are for at-a-glance comparison
only and **may be inaccurate or out of date** — they are not authoritative. The app shows a
**Live · Gemini** / **Reference data** indicator and a "Generated &lt;date&gt;" timestamp.
**Always verify against each vendor's official documentation before making production or contractual
decisions.** The curated fallback lives in `data/models.ts`; catalog generation is in `lib/catalog.ts`.

---

## 📄 License

MIT — see the dataset disclaimer above regarding the accuracy of model specifications.
