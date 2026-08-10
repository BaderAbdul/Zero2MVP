# TEST_CHECKLIST.md

Before considering the Responsive UI Kit integrated, verify the following:

- [ ] **Import Success:** The project compiles and runs locally (`npm run dev`) without CSS import errors.
- [ ] **DOM Application:** The `responsive-container` class is actively applied to the main wrapping `div` in the DOM (verify via Elements tab in DevTools).
- [ ] **Mobile Viewport Test (320px):** Open Chrome DevTools, toggle Device Mode, and set the width to 320px. Confirm that:
  - There is NO horizontal scrollbar.
  - Text does not overflow the screen boundaries.
  - Images resize automatically and do not break the layout.
- [ ] **Desktop Viewport Test:** Expand the browser window past 1200px. Confirm the content is horizontally centered and does not stretch infinitely.
