export interface ObservedDataPoint {
  time: number; // t
  value: number; // R (number of people who know the rumor)
}

export interface CalculatedDataPoint {
  time: number;
  analytical?: number | null; // R(t) analytical solution
  numerical?: number | null;  // R(t) numerical solution (Euler)
  observed?: number | null;   // R_i observed data
}

export interface RumorSimFormValues {
  N: number; // Total population
  R0: number; // Initial number of people who know the rumor
  timeUnit: string; // Unit of time (e.g., 'segundos', 'minutos', 'horas', 'días')
  observedData: ObservedDataPoint[];
}
