# Enroll — UI Reference (inspired by Educate.io)

> Purpose: give an AI/dev a *clear, actionable* brief to build an Enroll landing page with a similar **feel**: high-contrast, large typography, minimal layout, glossy/metallic wordmark vibe, subtle gradients, and premium spacing — without copying assets or text.

## What we’re emulating (high-level)
Educate’s public page uses:
- **Minimal top nav** (few links) and a **hero** with a bold headline and short subline. citeturn0view0  
- A **visual-heavy grid/slider of “program cards”** (image + title + creator) beneath the hero. citeturn0view0  
- A **brand-forward wordmark** (“EDUCATE”) as a large, bold graphic element. citeturn4view0  
- A **dark-to-blue gradient background layer** used as a subtle, premium backdrop. citeturn4view2  
- Later sections with **big section titles**, full-width imagery, and a simple footer with policy links. citeturn2view2turn2view3  

## Brand direction for Enroll (what Enroll should look like)
**Brand wordmark:** `ENROLL` only (no “AI” in logo).  
**Tone:** “premium, calm, confident”. Avoid “techy cybersecurity” vibes.

### Palette (tokens)
Use a limited palette like Educate’s: black base + cool blue accents.

```txt
--bg: #050608         (near-black)
--panel: rgba(255,255,255,0.04)
--border: rgba(255,255,255,0.10)
--text: #F5F7FF
--muted: rgba(245,247,255,0.70)

--accent-blue: #1E4BFF
--accent-ice:  #BFE7FF
--accent-silver: #DCE3EA
```

### Typography
- **Display/wordmark feel:** bold, all-caps, wide tracking (e.g., tracking-[0.25em]).
- **Headers:** 56–80px desktop, 34–44px mobile (tight line-height).
- **Body:** 16–18px, muted color, max-width on text.

> Key: fewer words, bigger type.

## Landing page information architecture (Enroll version)
This mirrors Educate’s “feel” (hero → visual catalog → story → footer), but with Enroll content.

### 1) Top navigation (simple)
- Left: `ENROLL` (wordmark)
- Right: `О продукте`, `Тариф`, `Войти`
- Primary button: `Создать аккаунт` (if authed, `Dashboard`)

### 2) Hero (above the fold)
- H1: large, statement-style
- 1 short subline (1–2 lines max)
- 1 primary CTA + 1 secondary CTA
- Background: subtle gradient wash (dark → deep blue)

Example structure (do not copy Educate text):
- H1: “Поступление в США — по шагам.”
- Sub: “Профиль → дедлайны → документы → черновики для подачи.”
- Disclaimer: “Не гарантия поступления. Решение принимает университет.”

### 3) “Catalog strip” (Enroll cards)
Educate shows program cards: title + person. citeturn0view0  
Enroll should show *features as cards* (or “steps”), but visually similar.

Cards (6–10, horizontally scrollable on mobile):
- “Roadmap поступления”
- “Дедлайны и напоминания”
- “Документы и версии”
- “Проверка эссе”
- “Подбор университетов”
- “Черновики для Common App (без интеграции в MVP)”

Each card:
- Background image = abstract gradient (no photos needed in MVP)
- Title (1 line)
- Subtitle (≤ 6 words)

### 4) Story block (optional)
Educate has founder/mission sections with large headings and short paragraphs. citeturn2view2  
Enroll: 1–2 blocks max:
- “Почему это нужно” (хаос → система)
- “Для кого” (СНГ → США)

### 5) FAQ (3 items max)
Tight answers.

### 6) Footer
Privacy / Terms / Contact (simple). citeturn2view3

## Layout + spacing rules (this is what makes it look expensive)
- Max width: **1200–1280px**; big vertical spacing (py-16 / py-24)
- Grid: 12 columns, but keep content centered
- Buttons: large paddings (px-6 py-4), rounded-2xl
- Use **1 accent per screen** (blue gradient or wordmark highlight)

## Motion / interactions (tasteful)
Educate feel is “polished, not flashy”. Recreate with:
- Section reveal on scroll: opacity 0 → 1 + y 8 → 0 (200–350ms)
- Cards: hover lift (translateY -4) + border brightening
- Buttons: slight scale (1.02) + glow
- Respect `prefers-reduced-motion`

## Tailwind implementation notes
### Suggested reusable classes
- Page background:
  - `bg-[#050608] text-[#F5F7FF]`
  - add gradient overlay via absolutely positioned div with `bg-gradient-to-br from-[#050608] via-[#050b20] to-[#1E4BFF]/20`
- Cards:
  - `rounded-2xl border border-white/10 bg-white/5 backdrop-blur`
- Primary button:
  - `rounded-2xl px-6 py-4 font-semibold`
  - `bg-white text-black` OR `bg-[#1E4BFF] text-white`
- Wordmark:
  - `uppercase font-black tracking-[0.25em]`

### Components (recommended)
- `LandingLayout`
- `TopNav`
- `Hero`
- `FeatureStrip` (cards)
- `StoryBlock`
- `FAQ`
- `Footer`

## AI prompt you can paste into Codex/Serena/Cursor
Use this to generate the landing quickly:

```text
Build a production-ready landing page for the web app “Enroll”. 
Match the vibe of Educate.io: premium minimal, dark background, huge typography, calm gradients, lots of whitespace, visual “catalog strip” of cards. Do not copy Educate text/assets. Use Tailwind. Use Framer Motion for tasteful animations (reveal on scroll, hover lift). 

Logo: wordmark only “ENROLL” (no AI, no icon). 
Routing: if authenticated, primary CTA goes to existing Dashboard route; otherwise to /register. Secondary CTA /login.

Sections:
1) Top nav (ENROLL + a few links + login)
2) Hero (big H1, short subline, 2 CTAs, 1 disclaimer line)
3) Feature cards strip (6–10 cards, scroll on mobile)
4) Short “Почему” story block (2–3 sentences)
5) FAQ (3)
6) Footer (privacy/terms/contact)

Keep copy short, big font, and make everything easy to tweak via a config object (strings/colors).
```

## Notes on what to avoid
- Don’t add “cybersecurity” iconography (shields, circuits).
- Don’t add too many colors.
- Don’t write long paragraphs.
- Don’t use busy gradients everywhere.

---
Source references used for this brief:
- Hero headline/subline + course list structure on Educate’s page. citeturn0view0
- Wordmark image (“EDUCATE”). citeturn4view0
- Background gradient asset. citeturn4view2
- Founder/mission + footer structure. citeturn2view2turn2view3
