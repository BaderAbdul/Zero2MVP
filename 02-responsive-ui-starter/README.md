# 02 — Responsive UI Starter

## Purpose
This Kit provides a minimal, mobile-first responsive CSS foundation. Following the "Ship Ugly" principle, this kit prevents horizontal scrolling and ensures your application is readable on a smartphone, without introducing complex CSS frameworks or React wrapping components.

**Important:** This kit contains NO React components and NO routing. It relies entirely on standard Vanilla CSS.

## Prerequisites
- A basic React + Vite project.
- Phase 1 (Vercel Deployment) should be complete, though this kit can be used independently locally.

## Installation Steps

1. **Copy the CSS File**
   Copy `responsive.css` from the `code/` folder of this Starter Kit into your project's `src/` folder (e.g., `src/responsive.css`).

2. **Import the CSS**
   Open your `src/main.tsx` (or `src/App.tsx`) and add the import statement at the top:
   ```tsx
   import './responsive.css'
   ```

3. **Apply the Container Class**
   In your `src/App.tsx`, wrap your main content in the responsive container class:
   ```tsx
   function App() {
     return (
       <div className="responsive-container">
         {/* Your app content goes here */}
         <h1>My MVP</h1>
       </div>
     )
   }
   ```

4. **Verify Mobile View**
   Open your browser's Developer Tools (F12), toggle the Device Toolbar, set the width to 320px (e.g., iPhone SE), and verify the page does not scroll horizontally.

## Customization
You can modify `responsive.css` to change the `max-width` (default `1200px`) or adjust the padding to fit your design.
