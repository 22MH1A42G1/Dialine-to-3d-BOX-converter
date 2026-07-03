/**
 * Analyze a cross-layout dieline image and infer box dimensions (w, h, d).
 *
 * Expected layout (4 cols × 3 rows):
 *
 *   .    top    .     .
 *   left front  right back
 *   .    bottom .     .
 *
 * Column widths across the middle row: [d, w, d, w]  → total = 2w + 2d
 * Row heights top-to-bottom:            [d, h, d]    → total = h + 2d
 *
 * We detect drawn pixels (anything darker than the background), project them
 * onto the X and Y axes to find row/column bands, then read off panel sizes.
 */
export interface DielineDims {
  w: number;
  h: number;
  d: number;
}

const MAX_DIM = 4;
const MIN_DIM = 1;

export async function analyzeDieline(dataUrl: string): Promise<DielineDims | null> {
  const img = await loadImage(dataUrl);

  // Rasterize to a manageable size for pixel analysis.
  const scale = Math.min(1, 400 / Math.max(img.width, img.height));
  const W = Math.max(1, Math.round(img.width * scale));
  const H = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, W, H);

  const { data } = ctx.getImageData(0, 0, W, H);

  // Detect background luminance from the four corners.
  const bg = sampleBackground(data, W, H);

  // Build binary map of "drawn" pixels.
  const drawn = new Uint8Array(W * H);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const a = data[i + 3];
    if (a < 32) continue; // transparent → background
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (Math.abs(lum - bg) > 24) drawn[p] = 1;
  }

  // Row / column projections.
  const rowSum = new Int32Array(H);
  const colSum = new Int32Array(W);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (drawn[y * W + x]) {
        rowSum[y]++;
        colSum[x]++;
      }
    }
  }

  const rowBands = findBands(rowSum, Math.max(2, Math.round(W * 0.01)));
  const colBands = findBands(colSum, Math.max(2, Math.round(H * 0.01)));

  if (rowBands.length === 0 || colBands.length === 0) return null;

  // Merge into overall drawn bounding box.
  const y0 = rowBands[0].start;
  const y1 = rowBands[rowBands.length - 1].end;
  const x0 = colBands[0].start;
  const x1 = colBands[colBands.length - 1].end;

  const totalW = x1 - x0;
  const totalH = y1 - y0;
  if (totalW <= 0 || totalH <= 0) return null;

  // Look at a horizontal strip through the vertical center to find the
  // middle-row panels. Then look at a vertical strip through the horizontal
  // center for the top/middle/bottom split.
  const midY = Math.round((y0 + y1) / 2);
  const midX = Math.round((x0 + x1) / 2);

  const centerRowCols = new Int32Array(W);
  const bandY = Math.max(2, Math.round(totalH * 0.05));
  for (let y = midY - bandY; y <= midY + bandY; y++) {
    if (y < 0 || y >= H) continue;
    for (let x = 0; x < W; x++) if (drawn[y * W + x]) centerRowCols[x]++;
  }
  const centerColBands = findBands(centerRowCols, 2);

  const centerColRows = new Int32Array(H);
  const bandX = Math.max(2, Math.round(totalW * 0.05));
  for (let x = midX - bandX; x <= midX + bandX; x++) {
    if (x < 0 || x >= W) continue;
    for (let y = 0; y < H; y++) if (drawn[y * W + x]) centerColRows[y]++;
  }
  const centerRowBands = findBands(centerColRows, 2);

  // Prefer detailed bands from center strips; fall back to gross projection.
  const cols = centerColBands.length >= 3 ? centerColBands : colBands;
  const rows = centerRowBands.length >= 3 ? centerRowBands : rowBands;

  // Estimate panel widths.
  //   4 cols → widths = [d, w, d, w]  (take avg of the two d's, two w's)
  //   3 cols → widths = [d, w, d]
  //   else   → fall back to assuming w == d == centerBand
  let wPx: number;
  let dPx: number;
  if (cols.length >= 4) {
    dPx = (cols[0].width + cols[2].width) / 2;
    wPx = (cols[1].width + cols[3].width) / 2;
  } else if (cols.length === 3) {
    dPx = (cols[0].width + cols[2].width) / 2;
    wPx = cols[1].width;
  } else {
    wPx = totalW / 2;
    dPx = totalW / 4;
  }

  //   3 rows → heights = [d, h, d]
  let hPx: number;
  let dPxV: number;
  if (rows.length >= 3) {
    dPxV = (rows[0].width + rows[2].width) / 2;
    hPx = rows[1].width;
  } else if (rows.length === 2) {
    dPxV = rows[0].width;
    hPx = rows[1].width;
  } else {
    dPxV = totalH / 3;
    hPx = totalH / 3;
  }

  // Reconcile the two depth estimates (horizontal + vertical).
  const dPxFinal = (dPx + dPxV) / 2;

  // Normalize so that the largest dimension = MAX_DIM.
  const maxPx = Math.max(wPx, hPx, dPxFinal);
  if (maxPx <= 0) return null;
  const scaleOut = MAX_DIM / maxPx;

  const clamp = (v: number) => Math.min(MAX_DIM, Math.max(MIN_DIM, v));
  return {
    w: round1(clamp(wPx * scaleOut)),
    h: round1(clamp(hPx * scaleOut)),
    d: round1(clamp(dPxFinal * scaleOut)),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function sampleBackground(data: Uint8ClampedArray, W: number, H: number): number {
  const corners = [
    [0, 0],
    [W - 1, 0],
    [0, H - 1],
    [W - 1, H - 1],
  ];
  let sum = 0;
  for (const [x, y] of corners) {
    const i = (y * W + x) * 4;
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / corners.length;
}

interface Band {
  start: number;
  end: number;
  width: number;
}

/**
 * Group consecutive indices where projection > 0 into bands, then merge
 * bands separated by gaps smaller than `minGap` (thin outlines/crease lines
 * can create false splits).
 */
function findBands(proj: Int32Array, minGap: number): Band[] {
  const raw: Band[] = [];
  let start = -1;
  for (let i = 0; i < proj.length; i++) {
    if (proj[i] > 0) {
      if (start === -1) start = i;
    } else if (start !== -1) {
      raw.push({ start, end: i, width: i - start });
      start = -1;
    }
  }
  if (start !== -1) raw.push({ start, end: proj.length, width: proj.length - start });

  // Merge close bands (thin fold lines create false gaps).
  const merged: Band[] = [];
  for (const b of raw) {
    const prev = merged[merged.length - 1];
    if (prev && b.start - prev.end <= minGap) {
      prev.end = b.end;
      prev.width = prev.end - prev.start;
    } else {
      merged.push({ ...b });
    }
  }
  // Keep only "significant" bands (> 3% of total length).
  const minWidth = Math.max(3, Math.round(proj.length * 0.03));
  return merged.filter((b) => b.width >= minWidth);
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}
