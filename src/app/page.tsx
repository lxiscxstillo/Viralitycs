
"use client";

import type * as React from 'react';
import { useState, useEffect } from 'react';
import { RumorSimForm } from '@/components/rumor-sim/RumorSimForm';
import { ResultsDisplay } from '@/components/rumor-sim/ResultsDisplay';
import { RumorChart } from '@/components/rumor-sim/RumorChart';
import type { RumorSimFormValues, CalculatedDataPoint, ObservedDataPoint } from '@/components/rumor-sim/types';
import { estimateKFlow } from '@/ai/flows/estimateK'; // Assuming this path is correct for AI flow
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  const [kValue, setKValue] = useState<number | null>(null);
  const [chartData, setChartData] = useState<CalculatedDataPoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentN, setCurrentN] = useState<number | null>(null);
  const { toast } = useToast();

  const handleCalculate = async (formData: RumorSimFormValues) => {
    setIsCalculating(true);
    setKValue(null);
    setChartData([]);
    setCurrentN(formData.N);

    try {
      const { k } = await estimateKFlow({
        N: formData.N,
        R0: formData.R0,
        observedData: formData.observedData,
      });
      setKValue(k);

      // Determine time range for simulation
      let maxTime = 50; // Default max time
      if (formData.observedData.length > 0) {
        maxTime = Math.max(...formData.observedData.map(p => p.time), 0) * 1.5;
      }
      maxTime = Math.max(maxTime, 10); // Ensure a minimum simulation time
      
      const timeStep = Math.max(0.01, maxTime / 500); // Dynamic time step, at least 500 points

      const analyticalSolution: CalculatedDataPoint[] = [];
      const numericalSolutionPoints: { time: number, value: number }[] = [];

      // Analytical Solution
      const A = (formData.N - formData.R0) / formData.R0;
      if (formData.R0 <= 0 || A <= 0) { // R0 must be > 0 and < N
         toast({
          title: "Error de Entrada",
          description: "R0 debe ser positivo y menor que N para la solución analítica.",
          variant: "destructive",
        });
      } else {
        for (let t = 0; t <= maxTime; t += timeStep) {
          const R_t = formData.N / (1 + A * Math.exp(-k * t));
          analyticalSolution.push({ time: t, analytical: R_t });
        }
      }
      

      // Numerical Solution (Euler's Method)
      let R_n = formData.R0;
      numericalSolutionPoints.push({ time: 0, value: R_n });
      for (let t = 0; t < maxTime; t += timeStep) {
        const dR_dt = k * R_n * (1 - R_n / formData.N);
        R_n = R_n + timeStep * dR_dt;
        R_n = Math.max(0, Math.min(R_n, formData.N)); // Clamp R_n
        numericalSolutionPoints.push({ time: t + timeStep, value: R_n });
      }
      
      // Combine data for chart
      const combinedData: CalculatedDataPoint[] = [];
      const allTimes = new Set<number>([
        ...analyticalSolution.map(p => p.time),
        ...numericalSolutionPoints.map(p => p.time),
        ...formData.observedData.map(p => p.time)
      ]);
      
      const sortedTimes = Array.from(allTimes).sort((a,b) => a - b);

      sortedTimes.forEach(t => {
        const analyticalPoint = analyticalSolution.find(p => Math.abs(p.time - t) < timeStep / 2);
        const numericalPoint = numericalSolutionPoints.find(p => Math.abs(p.time - t) < timeStep / 2);
        const observedPoint = formData.observedData.find(p => Math.abs(p.time - t) < timeStep / 2); // Find closest, might need better matching

        combinedData.push({
          time: t,
          analytical: analyticalPoint?.analytical,
          numerical: numericalPoint?.value,
          observed: observedPoint?.value,
        });
      });
      
      // Ensure observed points are distinctly added if their times don't align perfectly with simulation steps
      formData.observedData.forEach(obs => {
        if (!combinedData.some(cd => cd.time === obs.time && cd.observed === obs.value)) {
          const existingEntry = combinedData.find(cd => cd.time === obs.time);
          if (existingEntry) {
            existingEntry.observed = obs.value;
          } else {
            combinedData.push({ time: obs.time, observed: obs.value });
          }
        }
      });
      combinedData.sort((a,b) => a.time - b.time);


      setChartData(combinedData);
      toast({
        title: "Cálculo Completo",
        description: `Tasa de propagación k estimada: ${k.toFixed(4)}`,
      });

    } catch (error) {
      console.error("Error de cálculo:", error);
      toast({
        title: "Error",
        description: "No se pudieron realizar los cálculos. Revisa la consola para más detalles.",
        variant: "destructive",
      });
      setKValue(null);
      setChartData([]);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight"
            style={{
              background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--secondary)))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
        >
          Viralitycs
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Modela y Visualiza la Dinámica de Propagación de Rumores
        </p>
      </header>

      <main className="container mx-auto max-w-7xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <RumorSimForm onSubmit={handleCalculate} isCalculating={isCalculating} />
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            {kValue !== null && <ResultsDisplay kValue={kValue} />}
            <RumorChart data={chartData} N_population={currentN} />
          </div>
        </div>
      </main>

      <footer className="mt-12 pt-8 border-t border-border text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Viralitycs. Creado con Next.js y Tailwind CSS.</p>
        <p className="mt-1">Explora la dinámica de la propagación de información.</p>
      </footer>
    </div>
  );
}
