export interface ContainedVideoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getContainedVideoRect(
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number,
): ContainedVideoRect {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (videoWidth <= 0 || videoHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const containerAspect = containerWidth / containerHeight;
  const videoAspect = videoWidth / videoHeight;

  if (videoAspect > containerAspect) {
    const width = containerWidth;
    const height = width / videoAspect;
    return {
      x: 0,
      y: (containerHeight - height) / 2,
      width,
      height,
    };
  }

  const height = containerHeight;
  const width = height * videoAspect;
  return {
    x: (containerWidth - width) / 2,
    y: 0,
    width,
    height,
  };
}

/**
 * Computes the video rect when using CSS `object-fit: cover`.
 * The video scales to FILL the container (no letterboxing), with overflow cropped.
 * Returned bounds may extend beyond (0,0)-(containerWidth,containerHeight).
 */
export function getCoveredVideoRect(
  containerWidth: number,
  containerHeight: number,
  videoWidth: number,
  videoHeight: number,
): ContainedVideoRect {
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (videoWidth <= 0 || videoHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }

  const containerAspect = containerWidth / containerHeight;
  const videoAspect = videoWidth / videoHeight;

  if (videoAspect > containerAspect) {
    // Video is wider — height fills, width overflows
    const height = containerHeight;
    const width = height * videoAspect;
    return {
      x: (containerWidth - width) / 2,
      y: 0,
      width,
      height,
    };
  }

  // Video is taller — width fills, height overflows
  const width = containerWidth;
  const height = width / videoAspect;
  return {
    x: 0,
    y: (containerHeight - height) / 2,
    width,
    height,
  };
}
