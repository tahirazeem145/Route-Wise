---
name: ui-ux-design-system
description: UI/UX design standards and telemetry visualization system for SmartRoute AI / Route-Wise. Use when designing, creating, or modifying frontend components, themes, Leaflet maps, and data visualization.
---

# SmartRoute AI — UI/UX Design System & Telemetry Standards

A comprehensive design system specification for building accessible, visually stunning, traffic-aware interfaces in Route-Wise.

## 1. Core Visual Foundations

- **Aesthetic**: Premium Glassmorphic Obsidian / Pitch Black.
- **Surface Elevation**:
  - Base Background: `#030305`
  - Glass Card: `rgba(14, 14, 18, 0.86)` with `backdrop-filter: blur(20px) saturate(190%)`
  - Input Surface: `rgba(8, 8, 10, 0.92)`
  - Elevated Popups: `rgba(12, 14, 22, 0.98)`
- **Border Tokens**: `rgba(255, 255, 255, 0.10)` base, with `rgba(99, 102, 241, 0.45)` active glow.

## 2. Traffic Severity & Telemetry Color Palette

Strictly adhere to these standardized traffic telemetry color tokens across polylines, charts, badges, and radar halos:
- **Free Flow / Low Congestion**: `#22c55e` (Emerald Green) | Glow: `rgba(34, 197, 94, 0.4)` | Delay: `< 15%`
- **Moderate Delay / Warning**: `#eab308` (Warm Amber Yellow) | Glow: `rgba(234, 179, 8, 0.4)` | Delay: `15% - 40%`
- **Heavy / Jammed Bottleneck**: `#ef4444` (Vivid Crimson Red) | Glow: `rgba(239, 68, 68, 0.4)` | Delay: `> 40%`
- **AI Primary Brand / Recommend**: `#6366f1` / `#38bdf8` (Electric Indigo / Cyber Cyan)

## 3. Interactive Leaflet Map Standards

- **Origin & Destination Pins**: Always use `.radar-beacon` with pulsing animated halos (`.radar-halo-origin` for Pin A, `.radar-halo-dest` for Pin B).
- **Bottlenecks**: When a route has a delay `> 4 min`, plot an animated amber radar beacon at the congested midpoint to give drivers immediate spatial awareness.
- **Click-to-Pin**: The map must listen for click events, opening an instant action popup with `[Set Origin (A)]` and `[Set Dest (B)]`.
- **Solid Polylines**: Use solid lines (`weight: 8` for selected, `weight: 5-6` for alternatives) with a soft cyan glow halo underneath the active selection.

## 4. Forms & Accessible Autocomplete (Combobox)

- **Input Attributes**: Always include `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `autoComplete="off"`.
- **Dropdown Listbox**: Container must have `role="listbox"`, items must have `role="option"`, `aria-selected`.
- **Keyboard Navigation**:
  - `ArrowDown` & `ArrowUp` cycle through suggestions.
  - `Enter` commits the highlighted match.
  - `Escape` dismisses the dropdown.
- **Length Constraint**: Allow location strings up to 500 characters to prevent cutting off full postal addresses.

## 5. Predictive ML Trend Visualization

- For time-series traffic predictions (e.g. ARIMA +0m, +15m, +30m, +45m), pair numerical values with an SVG `TrendSparkline`:
  - Clearing delay trend: Gradient fill to `#22c55e`
  - Escalating congestion: Gradient fill to `#ef4444`
  - Highlight the target departure horizon (`+15 min`) with an accented dot.
