---
name: anti-ai-slop
description: "Guidelines and heuristics to eliminate AI Slop in UI/UX design. Use when designing, building, or refactoring UI components, pages, editors, and SaaS interfaces to ensure human-crafted aesthetics, intentional visual hierarchy, and professional polish like Linear, Figma, Spline, and Raycast."
argument-hint: "[component, page, or pattern to review/refactor]"
license: MIT
metadata:
  author: astakraft
  version: "1.0.0"
---

# Anti-AI Slop Design Guide

Comprehensive principles and actionable patterns to eliminate "AI Slop" in user interfaces. Transforms generic, LLM-generated layouts into bespoke, human-crafted software experiences (comparable to Linear, Figma, Spline, Raycast, and Pacdora).

---

## What is "AI Slop" in UI?

AI models naturally gravitate towards safe, templated, and repetitive UI decisions:
1. **Container Nesting Syndrome**: Wrapping every label, input, and button in its own bordered card (`rounded-2xl border bg-slate-100/50 p-3`).
2. **Badge & Pill Overload**: Sprinkling colorful chips and pills over every noun, unit, status, and number.
3. **Patronizing Micro-copy**: Repeating prompts under every button ("Klik untuk ganti model", "Klik untuk lanjut", "Pintasan cepat untuk...").
4. **Unregulated Button Colors**: Mixing yellow, emerald, indigo, cyan, and red buttons without a disciplined semantic action hierarchy.
5. **Generic Default Inputs**: Relying on standard browser `<input type="range">` without direct numeric typing or stepper precision.
6. **Dashboard Metric Cards in Tool Contexts**: Forcing 2x2 grid cards with tiny uppercase labels (`DIMENSI`, `TOTAL CM3`) into tool inspector sidebars.
7. **Micro-font Clutter**: Abusing arbitrary sizes like `text-[8.5px]` or `text-[9px]` to squeeze verbose text into tight boxes.

---

## The Anti-AI Slop Rules

### 1. Flat Property Rhythm Over Card-in-Card
- **Anti-Pattern**: Sidebar > Card > Section Card > Button Card.
- **Rule**: Keep the outer floating island or sidebar, but make internal properties **flat rows separated by whitespace or hairline dividers** (`divide-y divide-slate-200/60` or `space-y-4`).
- Use subtle section headers: `text-[11px] font-bold uppercase tracking-wider text-slate-400`.

### 2. Strict Button & Action Hierarchy
- **Anti-Pattern**: Every button has a vibrant, saturated background (one yellow, one green, one navy, one cyan).
- **Rule**:
  - **One Primary Action per Viewport**: Solid high-contrast fill (e.g. Brand Navy `#1F3A5C`).
  - **Secondary Actions**: Frosted glass, subtle tint, or soft border (`bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80`).
  - **Ghost / Utility Actions**: Icon-only or transparent with hover reveal.
  - Never let secondary export buttons compete in visual weight with the primary save/submit action.

### 3. Studio Mode Switcher Belongs in the Top Navigation
- **Anti-Pattern**: Putting a 120px tall dashed placeholder card with fake dieline lines and an "Adjust images (2D)" badge in the middle of a parameter sidebar.
- **Rule**: Major studio mode changes (e.g. `3D Studio` vs `2D Dieline`) belong in a **Segmented Pill Switcher** in the top header or persistent floating island:
  ```tsx
  <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/80">
    <button className="px-3 py-1.5 rounded-lg bg-white shadow-xs font-bold text-xs text-slate-800">
      3D Studio
    </button>
    <button className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold">
      2D Dieline
    </button>
  </div>
  ```

### 4. Professional Numeric Inputs (CAD / Figma Quality)
- **Anti-Pattern**: Bare range slider with a separate text label.
- **Rule**: Provide direct typing inputs with integrated units.
  - Group `L`, `W`, `H` into a compact 3-column stepper or inputs:
  ```tsx
  <div className="grid grid-cols-3 gap-1.5">
    <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2.5 py-1.5 focus-within:border-brand-primary">
      <span className="text-[10px] font-bold text-slate-400 mr-1.5 select-none">P</span>
      <input type="number" value={length} className="w-full text-xs font-mono font-bold text-slate-800 outline-none" />
      <span className="text-[9px] text-slate-400 select-none">mm</span>
    </div>
  </div>
  ```

### 5. Cut the Redundant Micro-copy
- Remove prompt-like subtitles under buttons and controls.
- Instead of:
  - *"Model Kemasan"* + *"Klik untuk memilih model kemasan lain"*
  - Use:
  - Clean row with model icon/thumbnail + Name + subtle "Ganti" button or Chevron.
- Trust the user. If an element looks clickable, it does not need a caption explaining that clicking it does something.

### 6. Clean Inspector Lists Over Metric Cards
- In tool inspectors, display metadata as a key-value list:
  ```tsx
  <div className="space-y-1 text-xs">
    <div className="flex justify-between py-1 border-b border-slate-100">
      <span className="text-slate-500">Dimensi</span>
      <span className="font-mono font-bold text-slate-800">{length} × {width} × {height} mm</span>
    </div>
    <div className="flex justify-between py-1 border-b border-slate-100">
      <span className="text-slate-500">Volume</span>
      <span className="font-mono font-bold text-slate-800">{quote.effective_volume_cm3} cm³</span>
    </div>
  </div>
  ```

### 7. Disciplined Type & Spacing Scale
- Minimum body text: `11px` - `12px`.
- Monospace values: `11px` - `12px` font-mono.
- Section headers: `10.5px` - `11px` font-bold uppercase tracking-wider text-slate-400.
- Stop using random fractions like `text-[8px]` or `text-[8.5px]` unless strictly required for tiny footprint stamps.
