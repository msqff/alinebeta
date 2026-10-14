# A-LINE AI: Atelier Dark & Modern Architectural Studio Revamp

## Executive Overview
A-LINE AI is transforming from its current gaming-influenced, voxel-grid and purple-gradient interface into a high-end, luxury fashion design operating system: **Atelier Dark**. Built with **Modern Architectural** typography (`Plus Jakarta Sans`) and a **Streamlined Top Studio Bar**, this revamp elevates the visual fidelity to rival premier creative tools (like Figma, CLO 3D, and luxury atelier digital suites) while preserving 100% of the underlying functionality, state machines, and AI workflows.

---

## Design System & Theme Specifications

### 1. Atmosphere: Atelier Dark
- **Base Surfaces**:
  - Root canvas: Deep graphite `#0a0b0e` (pure luxury darkroom tone).
  - Elevated surfaces: Graphite slate `#121418` to `#181b20`.
  - Micro-borders: Precision 1px hairline borders (`border-white/[0.07]` and `border-zinc-800/80`).
  - Studio Lighting: Soft ambient vignette radial gradients replacing the legacy isometric voxel pattern.
- **Accents & Highlights**:
  - Primary Accent: Electric Platinum / Satin White (`#f4f4f5` text, subtle titanium glows) paired with refined Studio Indigo (`#6366f1` / `#4f46e5`) for active selection states.
  - Secondary Accents: Emerald for verified/approved stages (`#10b981`), Amber for audits/warnings (`#f59e0b`), Rose for risk/delete actions (`#f43f5e`).
- **Surface Elevation & Glassmorphism**:
  - Backdrop blur: `backdrop-blur-xl` with dark noise-reduced diffusion.
  - Soft inner hairline glows (`inset 0 1px 0 rgba(255, 255, 255, 0.08)`) to give hardware-like precision.

### 2. Typography: Modern Architectural
- **Font Family**:
  - Primary UI & Headings: `Plus Jakarta Sans` (weights 300, 400, 500, 600, 700, 800) imported from Google Fonts.
  - Technical & Data Specs: `JetBrains Mono` / `ui-monospace` for BOM codes, pantone values, RGB/HEX codes, measurement specs, and dimensions.
- **Hierarchy & Tracking**:
  - Overline labels & badges: `text-[10px] tracking-[0.2em] uppercase font-semibold text-zinc-400`.
  - Studio Section Titles: `text-2xl md:text-3xl font-semibold tracking-tight text-white`.
  - Body & Descriptions: `text-sm text-zinc-300 leading-relaxed font-normal`.

### 3. Streamlined Top Studio Bar & Navigation
- **Workspace Header**:
  - Sleek geometric A-LINE monogram badge.
  - Interactive breadcrumb trail: `Collection > Item Slot > Active Studio Tool`.
  - Seamless color palette swatch bar reflecting the active collection's style DNA.
  - Quick utility actions (Data Viewer, Prompt Library, Profile) in compact, high-precision icon controls.
- **Contextual Tool Switcher (Top Studio Ribbon)**:
  - When working inside an item slot, replace screen-filling tool cards with a sleek, compact horizontal studio ribbon docked right below the header.
  - One-click instant switching between all 8 tools:
    1. Mood Board Analyst
    2. Sketch Generator
    3. Product Visualiser
    4. Multi-View Generator
    5. Model Placement
    6. Tech Pack Generator
    7. Basic Audit
    8. Shopper Pulse
  - Preserves maximum vertical screen height for generative canvas, inpainting tools, and technical specifications.
  - Provides a quick "All Tools Grid" toggle if the user prefers the full catalog overview.

---

## Detailed Implementation Breakdown

### Phase 1: Global Foundations (`index.html` & Theme Config)
1. **Google Fonts Import**:
   - Replace standard Inter with `Plus Jakarta Sans` (`weights: 300;400;500;600;700;800`) and `JetBrains Mono`.
2. **Tailwind Config Extension**:
   - Add `font-sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif']` and `font-mono: ['"JetBrains Mono"', 'monospace']`.
   - Add luxury atelier color tokens (`atelier-950: #0a0b0e`, `atelier-900: #121418`, `atelier-800: #1a1d24`, `atelier-700: #252932`).
3. **Studio Ambient Backdrop**:
   - Remove `.voxel-pattern` CSS rules.
   - Replace with a refined architectural dark vignette: smooth ambient radial falloffs that feel like a calibrated photo studio screen.
   - Refine custom scrollbars to ultra-thin minimalist charcoal tracks.

### Phase 2: Navigation & Studio Bar (`Header.tsx` & `ToolSelector.tsx`)
1. **Header Modernization**:
   - Update branding with a crisp architectural geometric icon and typography.
   - Render the active collection and item slot in a clean breadcrumb structure with smooth click-to-navigate affordances.
   - Present collection color swatches as refined circular chips with subtle titanium rings.
2. **Top Studio Navigation Ribbon**:
   - Implement an inline Studio Ribbon component that can be displayed persistently when an item workspace is active.
   - Each tool represented by a crisp SVG icon, active indicator glow, and clear typography.
   - Redesign the full-page `ToolSelector.tsx` grid to match the Atelier Dark aesthetic: compact, high-contrast cards with subtle hover highlights and zero clutter.

### Phase 3: Collection & Line Sheet Experience (`ItemManager.tsx` & `CollectionSelector.tsx`)
1. **Line Sheet Grid (Item Slots)**:
   - Modernize the item slot cards: sleek dark slate containers with 1px border lines, high-contrast thumbnail previews, and clean status tags (e.g. `Sketch Ready`, `Visualized`, `Tech Pack Generated`).
   - Reorder and action controls (duplicate, rename, delete) styled as refined floating micro-action bars.
2. **AI Range Copilot & Suggestion Chips**:
   - Upgrade the design assistant panel and suggestion chips with architectural tag styling.
   - Smooth loading states with sleek pulsating titanium bars instead of standard spinners.
3. **Collection Selector**:
   - Clean, gallery-style collection cards with extracted color palette chips and style DNA preview cards.

### Phase 4: Creative Tools & Studio Canvas
1. **Sketch & Visualizer Panels (`SketchGenerator.tsx`, `ProductVisualizer.tsx`)**:
   - Dual-pane layout: sleek control sidebar on the left, expansive canvas on the right.
   - Canvas background with subtle neutral grey backdrop (ensuring garment colors appear true-to-life).
   - Solid neutral background default preview.
   - Polished parameter sliders, style tags, and prompt input boxes with subtle titanium outline focus rings.
2. **Multi-View & Model Placement (`MultiViewGenerator.tsx`, `ModelPlacement.tsx`)**:
   - Clean side-by-side viewports with unified camera angle badges (Front, Back, Side, Detail).
3. **Inpainting & Image Editor (`InpaintingCanvas.tsx`, `ImageEditor.tsx`)**:
   - Precision cursor indicators, sleek brush size sliders, and refined mask overlay contrast.

### Phase 5: Technical Specification & Auditing (`TechPackGenerator.tsx`, `TechPackModal.tsx`, etc.)
1. **Tech Pack Document & Tables**:
   - High-contrast, tabular data styling with monospaced specifications.
   - Sizing chart, BOM (Bill of Materials), and Costing tables with clean zebra-free, subtle hairline row dividers.
   - Sleek callout pins and measurement annotation overlays.
2. **Basic Audit & Shopper Pulse**:
   - Modernized score meters, risk level indicators (Low / Medium / High) with clean status badges and structured recommendation cards.

### Phase 6: Dual Gallery & Modals (`DualGallery.tsx`, Lightbox, etc.)
1. **Dual Gallery (Ideation vs Final Line)**:
   - Clean segmented tab control with item counts.
   - Polished asset cards with quick-action hover pills (Promote, Demote, Traceability, Tech Pack, Lightbox).
2. **Lightbox & Traceability Modal**:
   - True-to-scale full-resolution inspection modal with zoom controls and parent-child lineage tree visualization.

---

## Verification & Non-Regression Checklist
1. **Zero Functionality Detraction**:
   - Confirm all props, event handlers, and data contracts remain identical.
   - Firebase authentication, session saving, image storage, and Gemini API calls must operate seamlessly.
2. **Build & Quality Check**:
   - Run `compile_applet` to ensure zero compilation or TypeScript errors.
   - Verify layout responsiveness across desktop and tablet viewports.
