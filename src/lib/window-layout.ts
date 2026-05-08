/** Matches Waybar `h-9` (2.25rem) */
export const WAYBAR_HEIGHT_PX = 36;

export type SnapZone =
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "tl"
  | "tr"
  | "bl"
  | "br";

export function tiledViewport(settings: { windowGap: number }) {
  const gap = settings.windowGap;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = WAYBAR_HEIGHT_PX + gap;
  const bottomPad = gap;
  const innerH = vh - top - bottomPad;
  const halfW = Math.floor((vw - gap * 3) / 2);
  const halfH = Math.floor((innerH - gap) / 2);
  const rightX = Math.floor(vw / 2 + gap / 2);
  return {
    vw,
    vh,
    gap,
    top,
    bottomPad,
    innerH,
    halfW,
    halfH,
    rightX,
  };
}

/** Pixel bounds for tiling / quarter tiling */
export function boundsForSnap(
  zone: SnapZone,
  settings: { windowGap: number }
): { x: number; y: number; w: number; h: number } {
  const { vw, gap, top, innerH, halfW, halfH, rightX } =
    tiledViewport(settings);

  switch (zone) {
    case "left":
      return { x: gap, y: top, w: halfW, h: innerH };
    case "right":
      return { x: rightX, y: top, w: halfW, h: innerH };
    case "top":
      return { x: gap, y: top, w: vw - gap * 2, h: halfH };
    case "bottom":
      return {
        x: gap,
        y: top + halfH + gap,
        w: vw - gap * 2,
        h: innerH - halfH - gap,
      };
    case "tl":
      return { x: gap, y: top, w: halfW, h: halfH };
    case "tr":
      return { x: rightX, y: top, w: halfW, h: halfH };
    case "bl":
      return {
        x: gap,
        y: top + halfH + gap,
        w: halfW,
        h: innerH - halfH - gap,
      };
    case "br":
      return {
        x: rightX,
        y: top + halfH + gap,
        w: halfW,
        h: innerH - halfH - gap,
      };
  }
}

/** Screen-edge hit test while dragging a window title (matches keyboard tiling). */
export function snapHitFromPointer(cx: number, cy: number): SnapZone | "max" | null {
  const EDGE = 14;
  const CORNER = 44;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (cy <= CORNER && cx <= CORNER) return "tl";
  if (cy <= CORNER && cx >= vw - CORNER) return "tr";
  if (cy >= vh - CORNER && cx <= CORNER) return "bl";
  if (cy >= vh - CORNER && cx >= vw - CORNER) return "br";

  if (cy <= EDGE) return "max";

  if (cx <= EDGE && cy > CORNER && cy < vh - CORNER) return "left";
  if (cx >= vw - EDGE && cy > CORNER && cy < vh - CORNER) return "right";

  if (cy >= vh - EDGE && cx > CORNER && cx < vw - CORNER) return "bottom";

  return null;
}
