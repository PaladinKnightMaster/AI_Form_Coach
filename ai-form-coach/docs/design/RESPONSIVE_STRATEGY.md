# Responsive Layout Strategy

> Defines how the app adapts across device classes.
> All decisions trace back to one principle: **the camera viewport is the hero.**

## Device Classes & Breakpoints

| Class | Tailwind | Viewport | Primary Use Case |
|-------|----------|----------|-----------------|
| **Phone portrait** | default (< 640px) | 320-639px | Primary coaching device. Full-screen camera. |
| **Phone landscape / small tablet** | `sm:` (640px+) | 640-767px | Landscape coaching. Wider camera. |
| **Tablet** | `md:` (768px+) | 768-1023px | Camera switches to landscape aspect ratio. |
| **Desktop** | `lg:` (1024px+) | 1024-1279px | Side panels visible. Rich footer shows. |
| **Wide desktop** | `xl:` (1280px+) | 1280px+ | Wider stage, lower aspect ratio. |

## Layout Principles

### 1. Camera Stage Sizing

The camera stage aspect ratio adapts per viewport to maximize body visibility:

| Viewport | Aspect Ratio | Rationale |
|----------|-------------|-----------|
| Phone (active session) | `9:15` | Tall portrait — maximize body visibility |
| Phone (idle) | `9:14.2` | Slightly shorter to leave room for controls |
| Tablet (sm) | `10:16` | Still portrait-dominant |
| Tablet/Desktop (md+) | `16:10` | Landscape — natural desktop webcam ratio |
| Wide desktop (xl+) | `16:8.8` | Cinematic — less vertical space wasted |

### 2. Content Visibility by Viewport

| Element | Phone | Tablet (md) | Desktop (lg) | Wide (xl) |
|---------|-------|------------|--------------|-----------|
| Camera stage | Full width | Full width | Full width | Full width |
| Top badges | 1 badge | 1 badge | 2 badges | 3 badges |
| Stage alert | Hidden during active | Hidden during active | Visible | Visible |
| Live cue pill | Compact 1-line | Compact 1-line | Rich footer panel | Rich footer panel |
| Mobile tray (bottom) | Visible during active | Visible during active | Hidden (use footer) | Hidden (use footer) |
| Support rails (3 cards) | Hidden during session | Hidden during session | Grid 3-col | Grid 3-col |
| Hero header | Hidden during session | Hidden during session | Visible | Visible |
| Rich stage footer | Hidden | Hidden | Visible | Visible |

### 3. Progressive Disclosure

Phone shows **minimum viable coaching UI**:
- Camera + skeleton overlay
- 1 quality badge (top-left)
- Mirror/mute toggles (top-right)
- Live cue + reps/elapsed (compact pill, top)
- Pause/End buttons (bottom tray)

Each larger breakpoint **adds** information, never rearranges the core layout:
- `sm:` → Wider camera aspect
- `md:` → Landscape aspect ratio
- `lg:` → Rich footer with cue text + summary chips, support rail cards, hero header, second badge
- `xl:` → Wider cinematic stage, third badge

### 4. Safe Areas

- iOS notch/Dynamic Island: `env(safe-area-inset-top)` on page shell padding
- iOS home indicator: `env(safe-area-inset-bottom)` on bottom padding and mobile tray
- `viewport-fit=cover` in HTML head
- Android navigation bar: handled by `100dvh` viewport height

### 5. Touch Targets

- All interactive elements: minimum 44px effective height (iOS HIG)
- Buttons: explicit min-height via Tailwind size classes (h-9/h-11/h-12/h-14)
- Badge toggles: `py-2 px-3` ensures 44px+ with text
- Sufficient gap between adjacent targets: minimum 8px (`gap-2`)

## Out-of-Session Pages

| Page | Phone | Tablet (md) | Desktop (lg+) |
|------|-------|-------------|---------------|
| History | Single column, full width cards | Single column, centered | 2-3 column grid |
| Session detail | Stacked sections | Side-by-side stats + timeline | Same |
| Settings | Full width form | Centered max-w-lg | Centered max-w-lg |
| Sign in / Sign up | Full width | Centered max-w-md | Centered max-w-md |
| Pricing | Single column | 2-column plan cards | 3-column plan cards |
| Landing page | Mobile-first hero | Wider hero, side content | Full desktop layout |

## Anti-Patterns to Avoid

- **Never** use `absolute inset-0` for overlays that contain content (blocks camera)
- **Never** show more than 1 badge on mobile during active session
- **Never** use opaque backgrounds on in-session overlays (use `bg-slate-950/50` max)
- **Never** place interactive elements in the center body area during active session
- **Never** use `overflow-hidden` on containers that hold absolutely-positioned content on mobile
