# MENTOR_NOTES.md

## Expected Failure Modes & Rescue Procedures

### 1. Horizontal Scrolling on Mobile (The Layout is still broken)
- **Symptom:** In the 320px test, the page still scrolls horizontally.
- **Cause:** Another CSS file (usually the default Vite `App.css` or `index.css`) has a hardcoded `width: 100vw`, fixed `width` on an element (e.g., `width: 500px`), or `white-space: nowrap`.
- **Rescue Lane Procedure:**
  1. Open DevTools and select the overflowing element.
  2. Identify which CSS rule is forcing the width.
  3. Delete or comment out the conflicting rule in the default Vite CSS files.
  4. Ensure `box-sizing: border-box` is applied globally (included in `responsive.css`).

### 2. The CSS File Fails to Load
- **Symptom:** React compiler throws an error: `Failed to resolve import "./responsive.css"`.
- **Cause:** The file was copied to the wrong directory (e.g., `/public` or the root folder) instead of `/src`, or there is a typo in the import path.
- **Rescue Lane Procedure:**
  Move the file into `src/` and verify the import path precisely matches the filename.

### 3. "Can I just use Tailwind?"
- **Symptom:** A participant wants to install Tailwind instead of using this CSS file.
- **Cause:** Familiarity with Tailwind, or AI agents eagerly suggesting it.
- **Rescue Lane Procedure:**
  - Remind them of the "Ship Ugly" principle. Tailwind requires build-step configuration (PostCSS, tailwind.config.js) which introduces high failure risk for beginners. 
  - Firmly recommend sticking to pure CSS for the MVP. If they insist and know what they are doing, they may proceed, but they assume the risk of configuration bugs.
