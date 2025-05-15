import type { ObservedDataPoint } from '@/components/rumor-sim/types';

interface EstimateKParams {
  N: number;
  R0: number;
  observedData: ObservedDataPoint[];
}

interface EstimateKResult {
  k: number;
}

/**
 * Mock function to estimate the spread rate 'k'.
 * In a real application, this would involve a curve fitting algorithm
 * (e.g., least squares) to fit the logistic model to observed data.
 */
export async function estimateKFlow(params: EstimateKParams): Promise<EstimateKResult> {
  const { N, R0, observedData } = params;

  // Ensure R0 is less than N and positive for meaningful calculations
  if (R0 <= 0 || R0 >= N) {
    // Return a default or indicate an error if R0 is invalid relative to N
    // For simplicity, returning a default k. Proper error handling would be better.
    console.warn("R0 must be positive and less than N. Using default k.");
    return { k: 0.1 };
  }
  
  // If there's observed data, try a very basic heuristic to estimate k.
  // This is a placeholder for a proper curve fitting algorithm.
  if (observedData && observedData.length > 0) {
    // Try to use the first data point (t > 0, R0 < R_t < N) to estimate k
    const validPoint = observedData.find(p => p.time > 0 && p.value > R0 && p.value < N);

    if (validPoint) {
      const t = validPoint.time;
      const R_t = validPoint.value;

      // From R(t) = N / (1 + A * exp(-k*t)), where A = (N - R0) / R0
      // N / R_t = 1 + A * exp(-k*t)
      // (N / R_t) - 1 = A * exp(-k*t)
      // ((N / R_t) - 1) / A = exp(-k*t)
      // log(((N / R_t) - 1) / A) = -k*t
      // k = -log(((N / R_t) - 1) / A) / t

      const A = (N - R0) / R0;
      if (A <= 0) return { k: 0.1 }; // A must be positive

      const term = ((N / R_t) - 1) / A;
      if (term > 0) { // Argument of log must be positive
        const calculatedK = -Math.log(term) / t;
        // Return a k within a plausible range, avoid NaN or Infinity
        if (isFinite(calculatedK) && calculatedK > 0) {
          return { k: Math.min(Math.max(calculatedK, 0.001), 5) }; // Clamp k
        }
      }
    }
  }

  // Fallback to a default k if no data or heuristic fails
  return { k: 0.1 };
}
