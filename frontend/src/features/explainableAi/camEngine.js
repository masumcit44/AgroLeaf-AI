// F11 Explainable AI - CAM (Class Activation Mapping) Engine
// Exact analytical Grad-CAM formulation for EfficientNet-B0 architecture.
// Extracts class-specific spatial attribution, applies ReLU and normalizes to [0, 1].

export const CLASS_KEYS = [
  'healthy',
  'blast',
  'brown_spot',
  'leaf_smut',
  'tungro',
  'sheath_blight',
  'other_rice',
  'not_rice',
];

export const CLASS_INDEX_MAP = Object.fromEntries(
  CLASS_KEYS.map((k, idx) => [k, idx])
);

/**
 * Extracts normalized 2D CAM array for a target class.
 *
 * @param {Object|Array|Float32Array} camMaps - Output tensor from ONNX [1, 8, 10, 10] or flat array
 * @param {string|number} targetClass - Disease class key (e.g. 'blast') or class index (0-7)
 * @returns {{
 *   grid: Float32Array,
 *   width: number,
 *   height: number,
 *   classKey: string,
 *   classIndex: number,
 *   minVal: number,
 *   maxVal: number,
 *   maxPos: { x: number, y: number },
 *   isDegraded: boolean
 * }|null}
 */
export function extractClassCam(camMaps, targetClass = 'blast') {
  if (!camMaps) return null;

  const rawData = camMaps.data || camMaps;
  if (!rawData || !rawData.length) return null;

  // Resolve target class index
  let classIndex = typeof targetClass === 'number' ? targetClass : CLASS_INDEX_MAP[targetClass];
  if (classIndex == null || classIndex < 0 || classIndex >= CLASS_KEYS.length) {
    classIndex = 1; // Default to blast if unspecified
  }
  const resolvedClassKey = CLASS_KEYS[classIndex];

  const width = 10;
  const height = 10;
  const spatialSize = width * height; // 100
  const expectedTotal = CLASS_KEYS.length * spatialSize; // 800

  if (rawData.length < expectedTotal) {
    return null;
  }

  const offset = classIndex * spatialSize;
  const grid = new Float32Array(spatialSize);

  let minVal = Infinity;
  let maxVal = -Infinity;
  let maxIdx = 0;

  // 1. Extract slice and apply ReLU (discard negative attributions)
  for (let i = 0; i < spatialSize; i++) {
    const rawVal = rawData[offset + i];
    const val = rawVal > 0 ? rawVal : 0; // ReLU
    grid[i] = val;
    if (val < minVal) minVal = val;
    if (val > maxVal) {
      maxVal = val;
      maxIdx = i;
    }
  }

  // 2. Spatial min-max normalization into [0.0, 1.0]
  const range = maxVal - minVal;
  const isDegraded = range < 1e-6;

  if (!isDegraded) {
    for (let i = 0; i < spatialSize; i++) {
      grid[i] = (grid[i] - minVal) / range;
    }
  } else {
    // Zero-fill if all values are identical
    grid.fill(0);
  }

  const maxY = Math.floor(maxIdx / width);
  const maxX = maxIdx % width;

  return {
    grid,
    width,
    height,
    classKey: resolvedClassKey,
    classIndex,
    minVal,
    maxVal,
    maxPos: { x: maxX, y: maxY },
    isDegraded,
  };
}

/**
 * Returns peak intensity coordinates and spread statistics from a normalized CAM grid.
 */
export function analyzeCamMetrics(cam) {
  if (!cam || !cam.grid) return null;

  const { grid } = cam;
  let sum = 0;
  let peakCount = 0;

  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    sum += v;
    if (v >= 0.70) peakCount++;
  }

  const meanIntensity = Math.round((sum / grid.length) * 100) / 100;
  const focusPercentage = Math.round((peakCount / grid.length) * 100);

  return {
    meanIntensity,
    focusPercentage,
    maxPos: cam.maxPos,
    isDiffuse: focusPercentage > 40,
  };
}
