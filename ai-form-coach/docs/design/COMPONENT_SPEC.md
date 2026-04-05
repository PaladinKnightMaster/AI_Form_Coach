# Component Visual Spec

> Maps to components in `src/ui/DS.tsx`. Each component's allowed variants and their visual treatment.

## Button

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `primary` | `emerald-600 → teal-600` gradient | white | none | `emerald-500 → teal-500` |
| `secondary` | white (light) / slate-800 (dark) | slate-700 / slate-200 | slate-200 / slate-700 | slate-50 / slate-700 |
| `ghost` | transparent | slate-600 / slate-300 | none | slate-100 / slate-800 |
| `outline` | transparent | slate-700 / slate-200 | slate-200 / slate-700 | slate-50 / slate-800 |
| `destructive` | red-600 | white | none | red-500 |

**Sizes:** sm (h-9), md (h-11), lg (h-12), xl (h-14)
**Radius:** `rounded-xl` (all sizes)
**Min touch target:** 44px effective height

## Badge

| Tone | Background | Text |
|------|-----------|------|
| `success` | emerald-50 / emerald-900 | emerald-700 / emerald-200 |
| `warning` | amber-50 / amber-900 | amber-700 / amber-200 |
| `error` | red-50 / red-900 | red-700 / red-200 |
| `info` | sky-50 / sky-900 | sky-700 / sky-200 |
| `neutral` | slate-100 / slate-800 | slate-600 / slate-300 |

**Sizes:** sm (text-[11px] px-2 py-0.5), md (text-xs px-2.5 py-1)
**Radius:** `rounded-full`

## Card

**Padding variants:** sm (p-4), default (p-5), lg (p-6)
**Radius:** `rounded-2xl`
**Background:** white / slate-900
**Border:** slate-200 / white/10
**Shadow:** `shadow-sm` (resting)

## Input

**Height:** h-11
**Radius:** `rounded-xl`
**Border:** slate-300 / slate-700
**Focus:** `ring-2 ring-accent/30 border-accent`
**Padding:** px-4

## Stage Shell (Coach Camera Container)

**Radius:** `rounded-2xl` outer, `rounded-xl` inner
**Background:** white/80 (light) / slate-950/72 (dark)
**Border:** white/60 (light) / white/10 (dark)
**Backdrop:** blur
**Shadow:** `shadow-xl`

## Skeleton Overlay (Canvas)

Rendered via `PoseOverlay.tsx` using Canvas 2D API. Not Tailwind-styled.

**Edge rendering:** 3-layer (dark underlay → soft glow → main stroke)
**Joint rendering:** 5-layer (outer glow → dark shadow → colored ring → white inner dot → confidence ring)
**Colors:** `SKELETON_COLORS` constant in PoseOverlay.tsx (teal-400 brand palette)
**Line width:** 3px normal, 4px highlighted
**Joint radius:** 7px normal, 5px head, +3px highlighted
