# TARA Website — tarahome.ai

Astro 6 + Tailwind CSS v4 marketing site for TARA, a privacy-first smart home intelligence system.

## Quick Start

```bash
npm install
npm run dev       # localhost:4321
npm run build     # static output → ./dist/
npm run preview   # preview built site
```

## Structure

```
src/
├── layouts/        BaseLayout, BlogLayout
├── components/     Nav, Hero, SocialProofBar, ProblemSection,
│                   SolutionSection, HowItWorks, FeaturesBento,
│                   DeveloperSection, Testimonials, FAQ,
│                   FinalCTA, WaitlistForm, Footer
├── pages/          index, privacy, 404, blog/
├── content/blog/   9 markdown articles (content collection)
├── styles/         global.css
└── scripts/        scroll-animations.js (Intersection Observer)
```

## Brand Colors

### Core

| Name | Hex | Role |
|------|-----|------|
| Midnight Black | `#0A0A0B` | Background |
| Graphite | `#1F1F23` | Surface |
| Soft Charcoal | `#2D2D2D` | Cards |
| Electric Purple | `#A100FF` | Primary accent |
| Prosperity Gold | `#C9A227` | Premium accent |

### Supporting Neutrals

| Name | Hex |
|------|-----|
| Cloud White | `#F5F5F7` |
| Soft Gold Highlight | `#E0C36E` |
| Cool Gray | `#C9CBD1` |

### Functional UI

| Name | Hex |
|------|-----|
| Primary CTA | `#A100FF` |
| CTA Hover | `#8A00DB` |
| Success / Online | `#6BBF59` |
| Warning | `#FFB800` |
| Error | `#FF4D6D` |
| Info / Connected | `#4DA3FF` |

### Usage Ratio

- **60–70%** neutrals: `#F5F5F7`, `#1F1F23`, `#2D2D2D`
- **15–20%** purple: `#A100FF`
- **10–15%** gold: `#C9A227`, `#E0C36E`
- **5–10%** green: `#6BBF59`

## Tech Stack

- **Framework:** Astro 6.1.5 (static, zero client JS)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/vite`
- **Typography:** Inter (all weights)
- **Animations:** Intersection Observer scroll reveals
- **Forms:** Formspree (waitlist)
- **Analytics:** GA4
