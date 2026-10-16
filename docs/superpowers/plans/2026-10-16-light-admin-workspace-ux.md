# Light Admin Workspace UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AstaKraft Studio and SVG-to-model controls light, compact, and source-tab oriented while keeping a visible icon-rail admin navigation on workspace routes.

**Architecture:** Extend the existing admin shell with a desktop-only icon rail for `/admin/studio` and `/admin/svg-to-model`; keep full navigation in the existing `AdminDrawer` when opened from the header or on tablet/mobile. Add one reusable accessible tab primitive for Studio control tabs and SVG source tabs. Reuse existing page state, handlers, `AdminDrawer`, Tailwind v4 tokens, and Lucide icons; do not add a modal/form UI dependency.

**Tech Stack:** Next.js 16.3.8, React 19.2.8, TypeScript, Tailwind CSS v4, `lucide-react`, existing `AdminDrawer`, existing brand tokens.

**Spec:** User request: AstaKraft option 1 — light Studio control panel, compact source/input tabs inspired by structured input-modal UX without copying the reference, and main admin sidebar shown as an icon rail on Studio and SVG-to-model routes.

## Global Constraints

- Preserve current SVG upload, preset loading, analysis, folding, material, export, save, and Studio form/scene/artwork/canvas behavior.
- Use existing React/Tailwind/Lucide stack; do not add React Hook Form, Zod, Radix, shadcn, Motion, or another dependency for this iteration.
- Keep admin main navigation visible as a desktop icon rail on Studio and SVG-to-model routes; header drawer remains full-label navigation.
- Use `lg` (1024px) as desktop threshold; below `lg`, use the existing responsive drawer behavior and avoid horizontal page overflow.
- Use light panel tokens: `#FFFFFF`, `#EEF4F8`, `#D5E4F0`, `#1F3A5C`, `#4B6B94`, `#718BAA`, and `#4394C3`; remove GitHub-dark Studio panel styling.
- New/changed controls need accessible names, visible focus states, keyboard reachability, and 44px minimum touch targets where practical.
- Tabs must expose `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"`; keyboard arrows/Home/End must change tabs.
- Keep drawers and scroll ownership intact: header stays visible, panel content scrolls internally, body scroll locks only while an open drawer is mounted.
- Verification must run `npm run build`, `npm run lint`, `git diff --check`, and manual route checks at 1280, 1024, 900, 768, and 390px.

## Review Focus

1. Workspace desktop nav must show one icon rail, not zero sidebars or a duplicate full sidebar; verify Studio/SVG content width and active route state at 1280px.
2. Studio light conversion must remove dark GitHub palette from panel surfaces and keep every existing control readable, focused, and stateful; verify all five tabs and form controls.
3. SVG source tabs must switch upload/preset/analysis content without losing `svgString`, `analysis`, selected preset, or export state; verify upload and preset paths after switching tabs.
4. Tablet/mobile drawers must not trap focus or lock body scroll when closed or hidden at desktop; verify resize across 1023px while a drawer is open.
5. Long controls and tab labels must remain usable without page-level horizontal scroll; verify source tabs, Studio tabs, HUD, and bottom folding/material controls at 390px and 768px.

---

## Files and Responsibilities

- **Create:** `frontend/src/components/admin/WorkspaceTabs.tsx` — generic accessible horizontal tab strip with icon, label, selected state, keyboard navigation, and stable panel IDs.
- **Modify:** `frontend/src/app/admin/layout.tsx` — render workspace icon rail, preserve full navigation drawer, and keep shell width/overflow ownership correct.
- **Modify:** `frontend/src/components/admin/AdminSidebar.tsx` — add `rail` mode with icon-only links, route state, badge indicators, tooltip/title text, and compact account/logout controls.
- **Modify:** `frontend/src/app/admin/studio/page.tsx` — replace dark control panel palette with light brand surfaces and use `WorkspaceTabs` without changing form state or canvas props.
- **Modify:** `frontend/src/app/admin/svg-to-model/page.tsx` — add compact source tabs for upload/presets/analysis, keep existing inspector/drawer responsive behavior, and use `WorkspaceTabs` semantics.
- **Modify:** `frontend/src/components/admin/AdminHeader.tsx` only if rail spacing or workspace menu trigger needs alignment; preserve existing header API and behavior.

## Interfaces

`WorkspaceTabs` should expose:

```ts
export interface WorkspaceTabItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  shortLabel?: string
}

interface WorkspaceTabsProps {
  items: WorkspaceTabItem[]
  activeId: string
  onChange: (id: string) => void
  tablistLabel: string
  panelIdPrefix: string
  className?: string
}
```

The component renders only the tab strip; callers keep existing conditional content and state. Tab IDs must be stable and caller-owned, such as `studio-params`, `svg-upload`, and `svg-presets`.

`AdminSidebar` adds:

```ts
mode?: "persistent" | "drawer" | "rail"
```

`rail` is desktop presentation only; `drawer` remains full-label navigation.

---

### Task 1: Add reusable accessible workspace tabs

**Files:**
- Create: `frontend/src/components/admin/WorkspaceTabs.tsx`

**Interfaces:**
- Consumes: `WorkspaceTabItem[]`, active ID, change callback, tablist label, panel ID prefix.
- Produces: compact light tab strip reusable by Studio and SVG-to-model.

- [ ] **Step 1: Implement the tab strip with semantic roles.**

  Render a horizontally scrollable `role="tablist"` with one native button per item. Each button gets `role="tab"`, stable `id`, `aria-selected`, `aria-controls`, accessible label/title, visible focus ring, and minimum 44px height. Active state uses navy/yellow or navy/white contrast on the existing light palette; inactive state uses muted blue and ice hover.

- [ ] **Step 2: Implement keyboard navigation.**

  On ArrowRight/ArrowDown move to next tab, ArrowLeft/ArrowUp move previous, Home selects first, End selects last. Prevent default only for handled keys. Keep selected tab focused and scroll it into view when changed. Do not use hover-only behavior.

- [ ] **Step 3: Verify the primitive.**

  Run:

  ```bash
  cd frontend
  npm run build
  git diff --check
  ```

  Expected: build succeeds and no whitespace errors appear.

- [ ] **Step 4: Commit.**

  ```bash
  git add frontend/src/components/admin/WorkspaceTabs.tsx
  git commit -m "feat(admin): add accessible workspace tabs"
  ```

---

### Task 2: Add desktop workspace icon rail

**Files:**
- Modify: `frontend/src/app/admin/layout.tsx`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`
- Modify: `frontend/src/components/admin/AdminHeader.tsx` only if needed for spacing

**Interfaces:**
- Consumes: `AdminSidebar mode="rail"` from this task and existing `isWorkspace`, `isMobileLayout`, and `AdminDrawer` state.
- Produces: desktop rail plus full-label drawer navigation on workspace routes.

- [ ] **Step 1: Add `rail` mode to `AdminSidebar`.**

  Preserve existing menu item definitions and active route checks. Render a desktop-only vertical rail around 64–72px wide with logo mark, icon-only route links, active navy/yellow treatment, `aria-label`/`title` for every link, and compact badge dots/counts where existing badges do not fit. Keep logout and account controls reachable with labels/tooltips; do not remove routes.

- [ ] **Step 2: Render rail only for workspace routes.**

  In `AdminLayout`, render `AdminSidebar mode="rail"` when `isWorkspace` and `isMobileLayout` is false. Keep ordinary admin routes on `mode="persistent"`, and keep the existing full-label `AdminDrawer` for global navigation. Workspace header menu remains the trigger for full navigation.

- [ ] **Step 3: Reconcile shell sizing.**

  Keep `h-dvh min-h-0 overflow-hidden`. Ensure workspace `main` flexes beside rail with `min-w-0`, and drawer/backdrop sits above rail only when open. At widths below `lg`, hide rail and use full-label drawer; at desktop, rail remains visible even when drawer is closed.

- [ ] **Step 4: Verify navigation behavior.**

  Run build and manually verify `/admin/studio` and `/admin/svg-to-model` at 1280px and 1024px: rail visible, active icons correct, title/tooltips available, header drawer opens full labels, and canvas/control panels do not gain a second permanent sidebar.

- [ ] **Step 5: Commit.**

  ```bash
  git add frontend/src/app/admin/layout.tsx frontend/src/components/admin/AdminSidebar.tsx frontend/src/components/admin/AdminHeader.tsx
  git commit -m "feat(admin): add workspace navigation rail"
  ```

---

### Task 3: Convert Studio control panel to light mode

**Files:**
- Modify: `frontend/src/app/admin/studio/page.tsx`

**Interfaces:**
- Consumes: `WorkspaceTabs` from Task 1 and `AdminDrawer`/rail shell from Task 2.
- Produces: light, compact Studio controls with the same state and event handlers.

- [ ] **Step 1: Replace dark panel surfaces and text tokens.**

  Convert only Studio panel content from GitHub-dark values (`#0d1117`, `#161b22`, `#21262d`, `#30363d`, `#8b949e`, `#c9d1d9`, `#f0f6fc`) to existing light palette values. Use white panel background, ice inner cards, blue border, navy headings, muted blue labels, and restrained shadows. Keep the WebGL viewport/HUD behavior and all existing handlers unchanged.

- [ ] **Step 2: Restyle panel hierarchy.**

  Keep compact header, tab row, scrollable content, and footer. Use a white header/footer with `#D5E4F0` dividers, rounded 10–14px inner cards, visible field labels, and consistent 8px spacing increments. Keep Save and close controls at 44px touch targets and preserve disabled/loading states.

- [ ] **Step 3: Replace Studio tab row with `WorkspaceTabs`.**

  Keep IDs `params`, `dieline`, `artwork`, `files`, `scene`; map existing Lucide icons and labels. Add `role="tabpanel"` wrappers with stable IDs and `aria-labelledby`; conditional tab content remains existing JSX and state handlers. On tablet, tabs scroll horizontally rather than force panel width.

- [ ] **Step 4: Verify Studio controls.**

  Run:

  ```bash
  cd frontend
  npm run build
  ```

  Manually check 1280px, 1024px, 768px, and 390px: light surfaces, readable controls, all five tabs, save/export, drawer open/close, no canvas state reset, and no horizontal page scroll.

- [ ] **Step 5: Commit.**

  ```bash
  git add frontend/src/app/admin/studio/page.tsx
  git commit -m "feat(admin): restyle studio controls in light mode"
  ```

---

### Task 4: Add compact SVG source tabs

**Files:**
- Modify: `frontend/src/app/admin/svg-to-model/page.tsx`

**Interfaces:**
- Consumes: `WorkspaceTabs` from Task 1, existing `inspectorContent` handlers/state, and responsive `AdminDrawer` from the current branch.
- Produces: structured source workflow without changing SVG analysis/export behavior.

- [ ] **Step 1: Add source tab state.**

  Add `svgSourceTab` state with IDs `upload`, `presets`, and `analysis`, defaulting to `upload`. Keep `svgString`, `analysis`, `selectedPresetId`, upload handler, preset loader, and export handlers unchanged.

- [ ] **Step 2: Split inspector content into source-tab panels.**

  Preserve existing JSX and handlers but group it into three conditional panels: `upload` contains SVG dropzone and current upload status; `presets` contains sample preset selector; `analysis` contains detected specifications, CAD legend, panel tags, and 2D preview. If no analysis exists, show the existing loading/empty state inside the analysis panel. Keep shared help text below panels.

- [ ] **Step 3: Render accessible source tabs in both desktop inspector and mobile drawer.**

  Use `WorkspaceTabs` with Upload, Presets, and Analysis icons/labels. Render one tab strip per visible panel host, with unique panel ID prefixes for desktop and drawer. Do not mount an additional always-open modal; the existing mobile `AdminDrawer` remains the only overlay. Desktop keeps the bounded inspector; mobile keeps the existing Inspector trigger and drawer.

- [ ] **Step 4: Tighten source workflow styling.**

  Use white/ice cards, compact labels, dashed upload zone, clear selected preset state, and scrollable panel content. Keep source tabs horizontal-scrollable at 390px and keep all upload/preset controls keyboard reachable.

- [ ] **Step 5: Verify SVG workflow.**

  Run build and manually check 1280px, 1024px, 900px, 768px, and 390px: switch all source tabs, upload SVG, choose preset, inspect analysis, fold controls, export GLB, save template, open/close mobile inspector, and confirm state survives tab changes.

- [ ] **Step 6: Commit.**

  ```bash
  git add frontend/src/app/admin/svg-to-model/page.tsx
  git commit -m "feat(admin): add compact svg source tabs"
  ```

---

### Task 5: Final responsive/accessibility verification

**Files:**
- No planned files; fix only verified defects in owning task files.

**Interfaces:**
- Consumes: rail, tabs, light Studio panel, and SVG source workflow.
- Produces: verified responsive admin UX.

- [ ] **Step 1: Run static verification.**

  ```bash
  cd frontend
  npm run build
  npm run lint
  git diff --check
  ```

  Expected: build and diff checks pass. If lint still reports the repository's known baseline errors, record exact count and paths; do not claim lint clean.

- [ ] **Step 2: Launch real app.**

  ```bash
  npm run dev
  ```

  Check `/admin/studio` and `/admin/svg-to-model` through the running browser/server, not only source inspection.

- [ ] **Step 3: Verify desktop rail and workspace layout.**

  At 1280px and 1024px confirm rail visible, no full duplicate sidebar, header drawer opens full navigation, Studio panel is light, SVG source tabs are visible, and viewport remains usable.

- [ ] **Step 4: Verify tablet/mobile behavior.**

  At 900px, 768px, and 390px confirm rail hides, header drawer and workspace drawers open/close with Escape/backdrop, body scroll restores, focus returns, tabs scroll, controls meet touch size, and no page-level horizontal scroll appears.

- [ ] **Step 5: Verify keyboard and state preservation.**

  Use keyboard-only navigation for rail links, header menu, tabs, upload input, presets, Studio form controls, folding slider, save/export actions. Confirm Arrow/Home/End tab behavior, `aria-selected`/`aria-controls`, and that Studio/SVG state remains after panel/tab toggles.

- [ ] **Step 6: Commit only verification fixes.**

  ```bash
  git add frontend/src/app/admin frontend/src/components/admin
  git commit -m "fix(admin): polish workspace responsive accessibility"
  ```

## Self-Review

- **Spec coverage:** light Studio panel is Task 3; compact source-tab workflow is Task 4; icon-rail main sidebar is Task 2; responsive/accessibility requirements span Tasks 1–5; existing behavior preservation is explicit in every task.
- **Step scan:** each task has one responsibility, exact files, exact tab IDs, breakpoint, roles, and commands; no new dependency or unspecified backend behavior.
- **Type consistency:** `WorkspaceTabItem`, `WorkspaceTabsProps`, and `AdminSidebar mode="rail"` are defined before use; Studio and SVG callers use stable IDs and panel prefixes.
- **Review focus mapping:** rail width/active state → Task 2 Step 4; Studio palette/state → Task 3 Step 4; SVG state switching → Task 4 Step 5; breakpoint drawer focus/scroll → Task 5 Step 4; narrow overflow → Task 3 Step 4 and Task 4 Step 5.
- **Proportion:** plan limits work to one reusable tab primitive plus four existing-file updates; no full form rewrite, dependency migration, or unrelated client-editor changes.
