# Design Brief

## Direction

Liquidity Terminal — a professional DeFi liquidity pool manager dashboard that reads like a trading desk: dark, data-dense, and metric-first.

## Tone

Dark fintech terminal with a sharp emerald/cyan accent — restrained and precise, built for continuous scanning of pool metrics rather than first-load spectacle.

## Differentiation

Monospace, tabular-aligned numeric metrics (APY, TVL, volume, fees, risk) rendered in JetBrains Mono across every card — giving the whole dashboard a live terminal/trading-desk signature.

## Color Palette

| Token      | OKLCH (dark) | Role |
| ---------- | ------------ | ---- |
| background | 0.12 0.012 260 | deep neutral base |
| foreground | 0.93 0.01 260 | primary text |
| card       | 0.16 0.014 260 | elevated surface |
| primary    | 0.72 0.16 155 | emerald — positive / primary action |
| accent     | 0.72 0.12 195 | cyan — data highlights / active |
| muted      | 0.2 0.015 260 | secondary surface |
| success    | 0.68 0.17 150 | positive metric / low risk |
| warning    | 0.78 0.14 85 | medium risk / caution |
| destructive| 0.58 0.2 25 | negative metric / high risk |

## Typography

- Display: Space Grotesk — headings, page titles, hero numbers
- Body: DM Sans — UI labels, paragraphs, table text
- Mono: JetBrains Mono — all numeric metrics, APY, TVL, volume, fees, risk scores
- Scale: hero `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-xl font-semibold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, metric `text-sm font-metric`

## Elevation & Depth

Card surfaces sit one step above the near-black background with hairline borders and a soft `shadow-subtle`; interactive cards lift to `shadow-elevated` on hover. Depth comes from layered surfaces, not glows.

## Structural Zones

| Zone    | Background  | Border | Notes |
| ------- | ----------- | ------ | ----- |
| Header  | `bg-card`   | `border-b` | sticky, contains nav + account |
| Sidebar | `bg-sidebar`| `border-r` | nav, per-user private dashboards |
| Content | `bg-background` | — | metric cards alternate `bg-card` / `bg-muted/40` |
| Footer  | `bg-muted/40` | `border-t` | muted, minimal |

## Spacing & Rhythm

Compact data-dense grid: 16px card padding, 24px section gaps, 4px between label and value, 8px between metric pairs. Tight spacing supports high information density.

## Component Patterns

- Buttons: `rounded-md`, primary emerald, `bg-gradient-primary` for primary CTA, hover lifts with `shadow-elevated`
- Cards: `rounded-lg` (8px), `bg-card`, hairline `border-border`, `shadow-subtle`
- Badges: `rounded-full` pills; green for positive/low-risk, amber for medium, red for high
- Allocation bars: segmented track with `shimmer` on pending rebalance, color-coded per pool

## Motion

- Entrance: `fade-in` 0.3s ease-out on section mount
- Hover: card lift + border brighten, 0.3s `transition-smooth`
- Decorative: `pulse-soft` on live data indicators, `shimmer` on in-progress allocation bars

## Constraints

- Dark theme primary; light theme provided but secondary
- Max 3 font families; 5 core colors
- No neon/glow shadows — depth via layered surfaces
- All numeric metrics use `font-metric` tabular alignment

## Signature Detail

Monospace tabular metric typography across every pool card — APY, TVL, volume, fees, and risk rendered like a live trading terminal, reinforced by a subtle grid texture on hero surfaces.
