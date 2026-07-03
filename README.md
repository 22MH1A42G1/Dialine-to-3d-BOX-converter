# Dieline → 3D Box Folder

Upload a 2D box **dieline** (PNG or PDF) and watch it fold into an interactive 3D box in the browser. Built with **React + Vite (TanStack Start)**, **Three.js** via **React Three Fiber**, and **OrbitControls** from **@react-three/drei**.

## Features

- Upload a **PNG** or **PDF** dieline (the first PDF page is rasterized with pdf.js).
- Renders the uploaded artwork as a flat preview.
- Identifies six box panels + fold lines from a standard **cross layout**.
- Each panel is a separate mesh, connected by **hinge groups** (parent/child pivots) — real transforms, no scaling tricks.
- Smooth **fold / reset** animation between 0° (flat) and 90° (folded).
- **OrbitControls**: drag to rotate, scroll to zoom, right-click to pan.
- Adjustable box **width / height / depth**.
- Fully **responsive** (sidebar on desktop, stacked on mobile).

## Expected dieline layout

The parser assumes a **4 × 3 grid** in the uploaded image:

```
   .      top     .       .
   left   front   right   back
   .      bottom  .       .
```

Each panel's texture is sampled from its cell so the artwork wraps correctly after folding.

## Project structure

```
src/
├─ components/
│  ├─ Box3D.tsx        # Hinge-parented 6-panel box + fold animation
│  ├─ Panel.tsx        # Single textured plane with per-panel UV remap
│  ├─ Scene.tsx        # R3F Canvas, lighting, OrbitControls
│  └─ Uploader.tsx     # PNG / PDF file picker
├─ hooks/
│  └─ useImageTexture.ts
├─ pages/
│  └─ BoxFolder.tsx    # Main UI page
├─ utils/
│  ├─ dielineLayout.ts # Cross-layout panel/UV mapping
│  └─ pdfToImage.ts    # PDF → PNG (pdf.js)
└─ routes/index.tsx    # Route entry
```

## Install & run

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:8080).

## Sample Output

- Dieline → 3D Box Home page before uploading

<img width="1366" height="686" alt="image" src="https://github.com/user-attachments/assets/f06deef2-d05d-448b-b58f-2b83c3daba00" />

- Upload a PNG or PDF cross dieline, then fold it into a 3D box. 

<img width="1352" height="685" alt="image" src="https://github.com/user-attachments/assets/547195b7-978e-4e42-8055-27b842483cc2" />

- clicking Fold

<img width="1366" height="684" alt="image" src="https://github.com/user-attachments/assets/7e425949-3247-44cc-b3ae-73373b879502" />

## How the folding works

- The **front** panel is the base and stays in the XY plane.
- Every other panel is wrapped in a `THREE.Group` whose **position is the hinge line**.
- Rotating that group rotates the child panel around the hinge — exactly like a real crease.
- The **back** panel is nested inside the **right** panel's hinge group, so folding is compositional (`right → back`).
- A `useFrame` loop eases the current fold amount toward the target every frame for smooth animation.
