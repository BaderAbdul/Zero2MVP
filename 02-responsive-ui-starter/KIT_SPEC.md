# KIT_SPEC.md (Agent Integration Contract)

## Agent Overview
This specification provides technical context for Antigravity (or any AI agent) integrating the `02-responsive-ui-starter` kit.

## Kit Boundary
- **Responsibility:** Provide a generic, pure-CSS responsive container (`responsive-container`) to prevent layout breakages on mobile viewports.
- **Exclusions:** This kit MUST NOT introduce React UI component libraries (like MUI or Chakra), CSS frameworks (like Tailwind), or React layout wrapping components. It must be pure CSS.

## Integration Point
- Target file: `src/responsive.css` (copy the file here).
- Import point: Import `./responsive.css` in `src/main.tsx` or `src/App.tsx`.
- DOM usage: Apply `className="responsive-container"` to the top-level `div` inside `App.tsx`.

## Agent Workflow
1. Copy `code/responsive.css` into the participant's `src/` directory.
2. Inject the CSS import into the participant's root React entry point.
3. Modify the primary layout element in `App.tsx` to include `className="responsive-container"`.
4. Ensure standard Vite styling (`index.css` or `App.css`) does not aggressively override the `box-sizing` or margin rules established by `responsive.css`.
