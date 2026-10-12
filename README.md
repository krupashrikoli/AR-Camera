# GHD Hotels — WebAR Image Scanner

Browser-based augmented reality scanner for **GHD Hotels / Samrāya**. Visitors open the page on their phone, grant camera access, point at the registered billboard artwork, and watch a video (or optional 3D model) anchored to the physical image.

**Stack:** React · Vite · TypeScript · MindAR.js 1.2.5 · Three.js 0.160 · Tailwind CSS · Lucide React

**Production path:** `https://ghdhotels.com/scanner`

---

## Requirements

- Node.js 20+ (Node 22 tested during development)
- npm 10+
- A phone with a rear camera (iOS Safari or Android Chrome) for real AR testing
- HTTPS in production (or `localhost` during development)

---

## Quick start

```bash
npm install
npm run compile:target   # generates public/targets/samraya.mind from the billboard PNG
npm run dev
```

Open `http://localhost:5173` on your computer.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run dev:host` | Dev server reachable on your LAN (for phones) |
| `npm run build` | Production TypeScript check + Vite build |
| `npm run preview` | Preview the production build |
| `npm test` | Run unit tests |
| `npm run compile:target` | Compile the billboard PNG into `samraya.mind` |

---

## Project structure

```
src/
  components/          # Welcome, scanner UI, media controls, errors
  config/experience.ts # Central experience registry & settings
  hooks/useARScanner.ts# MindAR + Three.js lifecycle
  pages/               # Target compiler tool
  utils/               # Device, media, compiler helpers
public/
  targets/samraya.mind # Compiled MindAR image target (required)
  videos/samraya.mp4   # AR video content
  images/              # Source billboard artwork
  models/              # Optional GLB models
scripts/compile-target.mjs
```

---

## How image tracking works

1. The billboard artwork is **pre-compiled** into a `.mind` feature file (not used as a raw PNG at runtime).
2. MindAR opens the rear camera and searches each frame for that target.
3. When found, Three.js content (video plane or GLB) is attached to the target anchor.
4. As the phone moves, MindAR updates the anchor transform so the content stays aligned.
5. When the artwork leaves the view, tracking is lost; content hides / video pauses; detection resumes automatically.

This app does **not** use QR codes, and the native phone camera app cannot launch the webpage by itself. The visitor must open the scanner URL first.

---

## Assets already included

| Asset | Path |
| --- | --- |
| Billboard artwork | `public/images/samraya-billboard.png` |
| Experience video | `public/videos/samraya.mp4` |
| Compiled target | `public/targets/samraya.mind` (via `npm run compile:target`) |

Optional 3D mode expects:

`public/models/samraya.glb`

If the `.mind` file, video, or model is missing, the UI shows a clear setup message instead of faking tracking.

---

## Compile a custom image target

### Option A — CLI (recommended)

```bash
npm run compile:target
# or custom paths:
npm run compile:target -- ./path/to/art.png ./public/targets/samraya.mind
```

### Option B — In-app browser compiler

1. `npm run dev`
2. Open `http://localhost:5173/tools/compile`
3. Upload the billboard PNG/JPG
4. Download `samraya.mind`
5. Place it in `public/targets/`

### Option C — Official MindAR tool

[MindAR Image Targets Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/)

### Image quality guidance

- Prefer sharp PNG/JPG of the **exact printed artwork**
- Shortest side ideally **1000px+** (current asset is 1280×524)
- High contrast and unique detail track best
- Avoid large flat empty regions
- Do **not** pass a raw PNG/JPG to MindAR as `imageTargetSrc`

Then confirm configuration:

```ts
// src/config/experience.ts
targetSrc: '/targets/samraya.mind',
targetIndex: 0,
```

---

## Configure the experience

Edit `src/config/experience.ts`.

Important fields:

| Field | Default | Notes |
| --- | --- | --- |
| `contentType` | `"video"` | `"video"` or `"3d"` |
| `videoSrc` | `/videos/samraya.mp4` | Anchored video texture |
| `modelSrc` | `/models/samraya.glb` | Used when `contentType` is `"3d"` |
| `videoSize` | `{ width: 1, height: 0.409 }` | Relative to target width (= 1) |
| `overlayFullArtwork` | `true` | Full cover vs smaller floating panel |
| `position` / `scale` / `rotation` | identity-ish | Relative to target anchor |
| `videoAutoplay` | `true` | May still require a tap on iOS |
| `muteByDefault` | `true` | Needed for mobile autoplay |
| `pauseOnTrackingLost` | `true` | Pauses video when target is lost |

To register another billboard later, add another entry to the `experiences` registry with its own `.mind` file and media.

---

## Replace / add media

### Video

1. Encode an H.264 MP4 (keep it mobile-friendly; aim under ~5–10 MB when possible).
2. Save as `public/videos/samraya.mp4` (or update `videoSrc`).
3. Adjust `videoSize.height` to match artwork aspect: `height = imageHeight / imageWidth` when width is `1`.

### 3D model

1. Export a compressed `.glb`.
2. Place at `public/models/samraya.glb`.
3. Set `contentType: "3d"` and tune `scale` / `position` / `rotation`.
4. Clips inside the GLB play automatically when `playModelAnimations` is `true`.

---

## Test on a phone

Camera access requires a **secure context**: `https://` or `http://localhost`.
A raw LAN IP (`http://192.168.x.x`) often blocks camera on modern mobile browsers.

### Recommended local workflow

1. Start the LAN-visible server:

```bash
npm run dev:host
```

2. Expose HTTPS to your phone using one of:

```bash
# Option 1: Cloudflare Tunnel (no account required for quick try)
npx cloudflared tunnel --url http://localhost:5173

# Option 2: ngrok
npx ngrok http 5173
```

3. Open the HTTPS URL on your iPhone/Android.
4. Tap **Start AR Experience** → allow camera.
5. Point at the printed (or on-screen) Samrāya billboard artwork.
6. Confirm the video appears locked to the artwork and follows as you move.

### Desktop debugging

Desktop Chrome is useful for UI and error states. Real tracking quality should be judged on a physical phone with a printed target.

### Debug panel

In development, a small AR debug panel is shown (camera/target/detection/media status + restart).  
Force it in any build with `?debug=1` or `VITE_DEBUG_AR=true`.

---

## Manual testing checklist

1. First-time camera permission prompt appears only after Start
2. Returning visit with permission already granted starts cleanly
3. Valid target detection shows “Experience found.” and plays video
4. Cover/remove artwork → tracking lost → video pauses → recover on re-detect
5. Rename/remove `samraya.mind` → clear “target missing” message
6. Rename/remove `samraya.mp4` → clear “video missing” message
7. iOS autoplay block → visible **Play experience** button works
8. Switch `contentType` to `"3d"` without GLB → clear model setup message
9. Start → Exit → Start repeatedly without duplicate camera sessions
10. Exit stops camera indicator / releases the camera
11. Real iPhone Safari test
12. Real Android Chrome test

---

## Production build & deployment

```bash
# Default site root
npm run build

# Deploy under https://ghdhotels.com/scanner
VITE_BASE_PATH=/scanner/ npm run build
```

Output is written to `dist/` as static files.

### Serving at `/scanner` on ghdhotels.com

1. Build with `VITE_BASE_PATH=/scanner/`.
2. Upload the contents of `dist/` to the web root path `/scanner/` (so `index.html` is at `/scanner/index.html`).
3. Ensure the host:
   - serves over **HTTPS**
   - supports SPA fallback (`/scanner` and `/scanner/tools/compile` → `index.html`)
   - does not block `.mind`, `.mp4`, or `.glb` MIME types  
     (`.mind` can be `application/octet-stream`)

Example nginx location sketch:

```nginx
location /scanner/ {
  alias /var/www/ghdhotels/scanner/;
  try_files $uri $uri/ /scanner/index.html;
}
```

---

## Architecture notes

- `useARScanner` owns MindARThree creation, anchor callbacks, video texture / GLTF attachment, animation loop, and teardown.
- MindAR built-in loading/scanning chrome is disabled (`uiLoading/uiScanning/uiError = "no"`) so the GHD UI owns all visitor messaging.
- Video is an HTML `<video>` element sampled by a Three.js `VideoTexture` on a plane parented to the MindAR anchor — not a fixed DOM overlay.
- Resources (camera tracks, WebGL renderer, textures, video elements, listeners) are disposed on stop/unmount.

Compatible package versions used:

- `mind-ar@1.2.5`
- `three@0.160.0` (matches MindAR’s documented Three import surface, including `sRGBEncoding`)

---

## Troubleshooting

| Symptom | Likely fix |
| --- | --- |
| Camera permission never appears | Must click Start first; also require HTTPS/localhost |
| “Target file missing” | Run `npm run compile:target` or use `/tools/compile` |
| Target never detects | Print larger / improve lighting / reduce glare; recompile from the final print file |
| Video doesn’t autoplay | Expected on some iOS versions — use the on-screen Play button; keep muted default |
| Black / stretched video | Adjust `videoSize.height` to artwork aspect ratio |
| Camera stays on after Exit | Hard-refresh once; confirm you’re on the latest build (cleanup is in `stop()`) |
| Build fails on MindAR types | Ensure `src/types/mind-ar.d.ts` is included (it is under `src/`) |
| `/scanner` 404s on refresh | Configure SPA fallback on the host |

---

## Tests

```bash
npm test
```

Coverage focuses on configuration validation and pure utilities. AR camera/tracking behavior is covered by the manual checklist above — it is not claimed as device-tested until you verify on real iPhone and Android hardware.
