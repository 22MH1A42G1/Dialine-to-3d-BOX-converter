/**
 * Dieline layout.
 *
 * We assume a standard "cross" dieline where the image is divided into a
 * 4-column x 3-row grid of equal cells. Each cell corresponds to one panel:
 *
 *   .    top    .     .
 *   left front  right back
 *   .    bottom .     .
 *
 * This lets us "identify panels and fold lines" deterministically from an
 * arbitrary uploaded image and produce clean UVs per panel so the texture
 * wraps correctly when folded.
 */

export type PanelId = "front" | "back" | "left" | "right" | "top" | "bottom";

export interface PanelUV {
  // UV rect in [0,1] image space (origin bottom-left, three.js convention).
  u: number;
  v: number;
  w: number;
  h: number;
}

const COLS = 4;
const ROWS = 3;
const CW = 1 / COLS;
const RH = 1 / ROWS;

// Grid cell (col, row) where row 0 is TOP of the image.
const CELLS: Record<PanelId, { col: number; row: number }> = {
  top: { col: 1, row: 0 },
  left: { col: 0, row: 1 },
  front: { col: 1, row: 1 },
  right: { col: 2, row: 1 },
  back: { col: 3, row: 1 },
  bottom: { col: 1, row: 2 },
};

export function getPanelUV(id: PanelId): PanelUV {
  const { col, row } = CELLS[id];
  // Flip row because three.js texture v origin is bottom-left.
  const v = 1 - (row + 1) * RH;
  return { u: col * CW, v, w: CW, h: RH };
}

export const PANEL_IDS: PanelId[] = ["front", "back", "left", "right", "top", "bottom"];
