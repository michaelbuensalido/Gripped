/**
 * poseCoordinates.ts
 *
 * Coordinate Mapping Engine for Real-Time Climbing Pose Overlay.
 *
 * Camera sensors output frames in their native aspect ratio (commonly 9:16 or 3:4).
 * When a camera preview is displayed with `resizeMode="cover"`, React Native scales
 * the frame to fill the view, cropping the sides or top/bottom.
 *
 * Problem: Pose model landmark coordinates are normalized [0.0, 1.0] relative to the
 * raw frame dimensions. Without correcting for the cover-crop transform, joints will
 * appear at shifted positions on screen.
 *
 * Solution: `mapLandmarkToScreen` performs an affine transform that:
 *   1. Accounts for cover-scale cropping (frame vs. view aspect ratio).
 *   2. Mirrors X for the front-facing camera.
 *   3. Returns exact pixel (x, y) ready to draw in the overlay SVG.
 */

export interface NormalizedPoint {
  x: number; // [0.0, 1.0]  left → right in frame space
  y: number; // [0.0, 1.0]  top  → bottom in frame space
}

export interface ScreenPoint {
  x: number; // pixels from left of view
  y: number; // pixels from top  of view
}

/**
 * Maps a normalized landmark point [0,1] from the camera frame into screen pixel
 * coordinates within the given view dimensions, accounting for `resizeMode="cover"`
 * cropping and front-camera mirroring.
 *
 * @param point        Normalized landmark { x, y } from the pose model.
 * @param viewWidth    Width  of the camera preview view in points (pixels on screen).
 * @param viewHeight   Height of the camera preview view in points.
 * @param frameWidth   Native frame width  in pixels (e.g. 720 or 1080).
 * @param frameHeight  Native frame height in pixels (e.g. 1280 or 1920).
 * @param isFrontCamera  Whether the active camera is front-facing (mirrors X).
 *
 * @returns Screen-space pixel coordinates { x, y }.
 */
export function mapLandmarkToScreen(
  point: NormalizedPoint,
  viewWidth: number,
  viewHeight: number,
  frameWidth: number = 720,
  frameHeight: number = 1280,
  isFrontCamera: boolean = false
): ScreenPoint {
  // ── Step 1: Compute the cover-scale factor ───────────────────────────────────
  //
  // "cover" means the frame is scaled so that BOTH dimensions are ≥ the view.
  // The scale factor is: max(viewW / frameW, viewH / frameH).
  // One axis will be exactly filled; the other will overflow (get cropped).
  //
  const frameAspect = frameWidth / frameHeight;
  const viewAspect  = viewWidth  / viewHeight;

  let scaledFrameW: number;
  let scaledFrameH: number;

  if (frameAspect > viewAspect) {
    // Frame is wider than view → scale to match heights, crop sides
    scaledFrameH = viewHeight;
    scaledFrameW = viewHeight * frameAspect;
  } else {
    // Frame is taller than view (common: 9:16 frame in a shorter viewport)
    // → scale to match widths, crop top/bottom
    scaledFrameW = viewWidth;
    scaledFrameH = viewWidth / frameAspect;
  }

  // ── Step 2: Compute crop offsets ────────────────────────────────────────────
  //
  // The scaled frame is centred over the view.  The offset is how many pixels
  // of the scaled frame lie outside the view on each axis.
  //
  const cropX = (scaledFrameW - viewWidth)  / 2; // pixels cropped from each side
  const cropY = (scaledFrameH - viewHeight) / 2; // pixels cropped from top/bottom

  // ── Step 3: Convert normalized → scaled-frame pixels → view pixels ──────────
  let sx = point.x * scaledFrameW - cropX;
  const sy = point.y * scaledFrameH - cropY;

  // ── Step 4: Mirror X for front camera ───────────────────────────────────────
  //
  // The front camera preview is visually mirrored (like a mirror).
  // The pose model receives the un-mirrored frame, so its X coordinates are
  // flipped relative to what the user sees.  Invert to align the skeleton.
  //
  if (isFrontCamera) {
    sx = viewWidth - sx;
  }

  return { x: sx, y: sy };
}

/**
 * Convenience: maps an entire landmarks dict to screen space in one call.
 *
 * @returns A new record with the same keys, values replaced by ScreenPoint.
 */
export function mapAllLandmarksToScreen(
  landmarks: Record<string, NormalizedPoint>,
  viewWidth: number,
  viewHeight: number,
  frameWidth?: number,
  frameHeight?: number,
  isFrontCamera?: boolean
): Record<string, ScreenPoint> {
  const out: Record<string, ScreenPoint> = {};
  for (const [key, pt] of Object.entries(landmarks)) {
    if (pt) {
      out[key] = mapLandmarkToScreen(
        pt,
        viewWidth,
        viewHeight,
        frameWidth,
        frameHeight,
        isFrontCamera
      );
    }
  }
  return out;
}
