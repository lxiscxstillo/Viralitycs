
"use client";

import type * as React from 'react';
import { useState } from 'react';
import { RumorSimForm } from '@/components/rumor-sim/RumorSimForm';
import { ResultsDisplay } from '@/components/rumor-sim/ResultsDisplay';
import { RumorChart } from '@/components/rumor-sim/RumorChart';
import type { RumorSimFormValues, CalculatedDataPoint } from '@/components/rumor-sim/types';
import { estimateKFlow } from '@/ai/flows/estimateK';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EquationsInfo } from '@/components/rumor-sim/EquationsInfo';
import { Info } from 'lucide-react';

export default function HomePage() {
  const [kValue, setKValue] = useState<number | null>(null);
  const [chartData, setChartData] = useState<CalculatedDataPoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [currentN, setCurrentN] = useState<number | null>(null);
  const [currentTimeUnit, setCurrentTimeUnit] = useState<string>('días');
  const { toast } = useToast();

  const handleCalculate = async (formData: RumorSimFormValues) => {
    setIsCalculating(true);
    setKValue(null);
    setChartData([]);
    setCurrentN(formData.N);
    setCurrentTimeUnit(formData.timeUnit);

    try {
      const { k } = await estimateKFlow({
        N: formData.N,
        R0: formData.R0,
        observedData: formData.observedData,
      });
      setKValue(k);

      let maxTime = 50;
      if (formData.observedData.length > 0) {
        maxTime = Math.max(...formData.observedData.map(p => p.time), 0) * 1.5;
      }
      maxTime = Math.max(maxTime, 10);

      const timeStep = Math.max(0.01, maxTime / 500);

      const analyticalSolution: CalculatedDataPoint[] = [];
      const numericalSolutionPoints: { time: number, value: number }[] = [];

      const A = (formData.N - formData.R0) / formData.R0;
      if (formData.R0 <= 0 || A <= 0 || formData.N <= 0) {
         toast({
          title: "Error de Entrada",
          description: "R0 debe ser positivo y menor que N. N debe ser positivo.",
          variant: "destructive",
        });
      } else {
        for (let t = 0; t <= maxTime; t += timeStep) {
          const R_t = formData.N / (1 + A * Math.exp(-k * t));
          analyticalSolution.push({ time: t, analytical: R_t });
        }
      }

      let R_n = formData.R0;
      if (formData.R0 > 0 && formData.N > 0) {
        numericalSolutionPoints.push({ time: 0, value: R_n });
        for (let t = 0; t < maxTime; t += timeStep) {
          const dR_dt = k * R_n * (1 - R_n / formData.N);
          R_n = R_n + timeStep * dR_dt;
          R_n = Math.max(0, Math.min(R_n, formData.N));
          numericalSolutionPoints.push({ time: t + timeStep, value: R_n });
        }
      }
      
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
        const observedPoint = formData.observedData.find(p => Math.abs(p.time - t) < timeStep / 2);

        combinedData.push({
          time: t,
          analytical: analyticalPoint?.analytical,
          numerical: numericalPoint?.value,
          observed: observedPoint?.value,
        });
      });
      
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
      if ( (formData.R0 > 0 && A > 0 && formData.N > 0) || numericalSolutionPoints.length > 0 ) {
        toast({
          title: "Cálculo Completo",
          description: `Tasa de propagación k estimada: ${k.toFixed(4)} (por ${formData.timeUnit === 'días' ? 'día' : formData.timeUnit.slice(0,-1)})`,
        });
      }


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
        <div className="mt-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Info className="mr-2 h-4 w-4" />
                Ecuaciones del Modelo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <EquationsInfo />
               <DialogFooter className="sm:justify-start mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cerrar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <RumorSimForm onSubmit={handleCalculate} isCalculating={isCalculating} />
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            {kValue !== null && <ResultsDisplay kValue={kValue} timeUnit={currentTimeUnit} />}
            <RumorChart data={chartData} N_population={currentN} timeUnit={currentTimeUnit} />
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
