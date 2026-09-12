/**
 * poseCoordinates.ts
 *
 * Coordinate Mapping Engine for Real-Time Climbing Pose Overlay.
 *
 * Camera sensors output frames in their native aspect ratio (commonly 9:16 or 3:4).
 * When a camera preview is displayed with `resizeMode="cover"`, React Native scales
 * the frame to fill the view, cropping the sides or top/bottom.
 *
 * `mapLandmarkToScreen` performs the coordinate transformation:
 *   1. Accounts for cover-scale cropping (frame vs. view aspect ratio).
 *   2. Mirrors X for the front-facing camera.
 *   3. Returns exact pixel (x, y) coordinates ready to render in SVG/Skia.
 */

export interface NormalizedPoint {
  x: number; // [0.0, 1.0] left -> right in frame space
  y: number; // [0.0, 1.0] top -> bottom in frame space
}

export interface ScreenPoint {
  x: number; // pixels from left of view
  y: number; // pixels from top of view
}

/**
 * Maps a normalized landmark point [0, 1] from camera frame into screen pixel
 * coordinates within the given view dimensions, accounting for cover cropping
 * and front camera mirroring.
 *
 * @param point         Normalized landmark { x, y }
 * @param viewWidth     Width of the camera preview view
 * @param viewHeight    Height of the camera preview view
 * @param isFrontCamera Whether the active camera is front-facing (mirrors X)
 * @param frameWidth    Native frame width in pixels (default: 720)
 * @param frameHeight   Native frame height in pixels (default: 1280)
 */
export function mapLandmarkToScreen(
  point: { x: number; y: number },
  viewWidth: number,
  viewHeight: number,
  isFrontCamera: boolean = false,
  frameWidth: number = 720,
  frameHeight: number = 1280
): ScreenPoint {
  // If frame dimensions are identical or non-positive, fallback to simple scale
  if (!frameWidth || !frameHeight || frameWidth <= 0 || frameHeight <= 0) {
    const x = isFrontCamera ? (1 - point.x) * viewWidth : point.x * viewWidth;
    const y = point.y * viewHeight;
    return { x, y };
  }

  // Account for cover cropping and rotation
  const frameAspect = frameWidth / frameHeight;
  const viewAspect = viewWidth / viewHeight;

  let scaledFrameW = viewWidth;
  let scaledFrameH = viewHeight;

  if (frameAspect > viewAspect) {
    // Frame is wider than view -> scale height to fill, crop sides
    scaledFrameH = viewHeight;
    scaledFrameW = viewHeight * frameAspect;
  } else {
    // Frame is taller than view -> scale width to fill, crop top/bottom
    scaledFrameW = viewWidth;
    scaledFrameH = viewWidth / frameAspect;
  }

  const cropX = (scaledFrameW - viewWidth) / 2;
  const cropY = (scaledFrameH - viewHeight) / 2;

  let x = point.x * scaledFrameW - cropX;
  const y = point.y * scaledFrameH - cropY;

  // Mirror X if front camera
  if (isFrontCamera) {
    x = viewWidth - x;
  }

  return { x, y };
}

/**
 * Maps an entire record of normalized landmarks to screen-space pixel coordinates.
 */
export function mapAllLandmarksToScreen(
  landmarks: Record<string, NormalizedPoint>,
  viewWidth: number,
  viewHeight: number,
  isFrontCamera: boolean = false,
  frameWidth?: number,
  frameHeight?: number
): Record<string, ScreenPoint> {
  const out: Record<string, ScreenPoint> = {};
  for (const [key, pt] of Object.entries(landmarks)) {
    if (pt) {
      out[key] = mapLandmarkToScreen(
        pt,
        viewWidth,
        viewHeight,
        isFrontCamera,
        frameWidth,
        frameHeight
      );
    }
  }
  return out;
}
