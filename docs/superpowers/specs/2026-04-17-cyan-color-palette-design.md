# Color Palette Redesign — Cyan Cool-Dark

**Date:** 2026-04-17  
**Status:** Approved

## Summary

Replace the warm gold/amber accent and warm dark backgrounds with a cyan (#22d3ee) accent and cool blue-black backgrounds. The change affects `client/src/style.css` (CSS variables and utility classes) and all Vue components that reference the gold class names.

## CSS Variable Changes

| Token | Before | After |
|---|---|---|
| `--gold` / `--cyan` | `#c4973c` | `#22d3ee` |
| `--gold-bright` / `--cyan-bright` | `#d4a84a` | `#38e8ff` |
| `--gold-glow` / `--cyan-glow` | `rgba(196,151,60,0.3)` | `rgba(34,211,238,0.3)` |
| `--bg-base` | `#080706` (warm brown-black) | `#060a0e` (cool blue-black) |
| `--bg-surface` | `#0f0d0b` (warm) | `#0b1018` (cool) |
| `--bg-elevated` | `#161310` | `#111820` |
| `--bg-hover` | `#1c1914` | `#161f28` |
| `--border-subtle` | `rgba(196,151,60,0.12)` | `rgba(34,211,238,0.10)` |
| `--border-default` | `rgba(196,151,60,0.22)` | `rgba(34,211,238,0.20)` |
| `--border-accent` | `rgba(196,151,60,0.5)` | `rgba(34,211,238,0.45)` |
| `--text-primary` | `#e0d4be` (warm white) | `#d4e8f0` (cool white) |
| `--text-secondary` | `#a89478` (warm grey) | `#7a9aaa` (cool grey-blue) |
| `--text-muted` | `#5a4e3e` | `#3a5a6a` |

## CSS Utility Class Renames

These classes are defined in `style.css` and used across Vue components:

| Old name | New name |
|---|---|
| `.input-gold` | `.input-cyan` |
| `.btn-gold-active` | `.btn-cyan-active` |
| `.btn-gold-inactive` | `.btn-cyan-inactive` |
| `.divider-gold` | `.divider-cyan` |
| `.text-gold` | `.text-cyan` |
| `.accent-gold` | `.accent-cyan` |

## Files Affected

- `client/src/style.css` — all variable definitions and utility class definitions
- `client/src/views/ReportPage.vue` — uses `btn-gold-active`, `btn-gold-inactive`, `accent-gold`, inline `var(--gold)` references
- `client/src/views/MainPage.vue` — likely uses `var(--gold)`, `input-gold`
- `client/src/components/ReportInput.vue` — likely uses `input-gold`
- `client/src/components/ConsumableTable.vue` — likely uses `text-gold`, `divider-gold`
- `client/src/components/ConsumableMatrix.vue` — likely uses gold utilities
- `client/src/components/MissingConsumableBadge.vue` — likely uses gold utilities

## Approach

**Full cool-dark redesign** — replace both the accent color (gold → cyan) and the background tones (warm brown-black → cool blue-black). The warm backgrounds would clash with cyan; shifting them to neutral-cool makes the palette cohesive.

Class renames are included to keep the codebase semantically correct after the change (`.btn-gold-*` naming would be misleading with cyan colors).

## Out of Scope

- Font changes (Cinzel + JetBrains Mono stay)
- WoW class colors (Warrior red, Mage blue, etc. — these are game-defined and unchanged)
- Layout or component structure changes
- Theme toggling / multiple themes
