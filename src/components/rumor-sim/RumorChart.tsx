
"use client";

import type * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CalculatedDataPoint } from './types';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface RumorChartProps {
  data: CalculatedDataPoint[];
  N_population: number | null;
  timeUnit: string;
}

const CustomTooltip = ({ active, payload, label, timeUnit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-background/80 border border-border rounded-md shadow-lg text-foreground text-sm">
        <p className="label font-semibold">{`Tiempo: ${label} ${timeUnit || ''}`.trim()}</p>
        {payload.map((entry: any) => (
          entry.value !== undefined && entry.value !== null && (
            <p key={entry.name} style={{ color: entry.color }}>
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
            </p>
          )
        ))}
      </div>
    );
  }
  return null;
};


export function RumorChart({ data, N_population, timeUnit }: RumorChartProps) {
  const [xDomain, setXDomain] = useState<[number | 'auto', number | 'auto']>(['auto', 'auto']);
  const [originalXDomain, setOriginalXDomain] = useState<[number, number] | null>(null);

  const calculatedOriginalXDomain = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }
    const times = data.map(p => p.time).filter(t => typeof t === 'number');
    if (times.length === 0) return null;
    return [Math.min(...times), Math.max(...times)] as [number, number];
  }, [data]);

  useEffect(() => {
    if (calculatedOriginalXDomain) {
      setOriginalXDomain(calculatedOriginalXDomain);
      setXDomain(calculatedOriginalXDomain);
    } else {
      setXDomain(['auto', 'auto']);
      setOriginalXDomain(null);
    }
  }, [calculatedOriginalXDomain]);

  const handleZoom = (factor: number) => {
    if (!originalXDomain || xDomain[0] === 'auto' || xDomain[1] === 'auto') return;

    const [currentMin, currentMax] = xDomain as [number, number];
    const [originalMin, originalMax] = originalXDomain;

    const currentRange = currentMax - currentMin;
    if (currentRange <= 0 && factor < 1) {
        if (originalMax - originalMin > 0) setXDomain(originalXDomain);
        return;
    }

    let newRange = currentRange * factor;
    const minAllowedRange = Math.max(0.01, (originalMax - originalMin) * 0.001); 

    if (factor < 1) { 
      if (currentRange <= minAllowedRange && newRange < currentRange) {
        newRange = currentRange; 
         if(currentRange < minAllowedRange) newRange = minAllowedRange;
      }
      if (newRange < minAllowedRange) newRange = minAllowedRange;
    }

    if (factor > 1) {
      if (newRange > (originalMax - originalMin)) {
        newRange = originalMax - originalMin;
      }
    }
    
    if (newRange <= 0) newRange = minAllowedRange;

    let newMin = center - newRange / 2;
    let newMax = center + newRange / 2;
    const center = currentMin + currentRange / 2;


    if (newMin < originalMin) {
      newMin = originalMin;
      newMax = Math.min(originalMin + newRange, originalMax);
    }
    if (newMax > originalMax) {
      newMax = originalMax;
      newMin = Math.max(originalMax - newRange, originalMin);
    }
    
    if (newMin >= newMax) {
      if (originalMax - originalMin > minAllowedRange) {
        newMin = originalMin;
        newMax = Math.min(originalMin + minAllowedRange, originalMax);
      } else { 
        newMin = originalMin;
        newMax = originalMax;
      }
    }
     if (newMin >= newMax && originalMin < originalMax) {
        setXDomain(originalXDomain);
        return;
    } else if (newMin >= newMax) { 
        setXDomain([originalMin, originalMax]);
        return;
    }

    setXDomain([newMin, newMax]);
  };

  const handleZoomIn = () => handleZoom(0.8);
  const handleZoomOut = () => handleZoom(1.25);
  
  const handleResetZoom = () => {
    if (originalXDomain) {
      setXDomain(originalXDomain);
    } else {
      setXDomain(['auto', 'auto']);
    }
  };

  const isZoomed = useMemo(() => {
    if (!originalXDomain || xDomain[0] === 'auto' || xDomain[1] === 'auto') return false;
    const tolerance = 1e-6 * (originalXDomain[1] - originalXDomain[0]);
    return Math.abs(xDomain[0] - originalXDomain[0]) > tolerance || Math.abs(xDomain[1] - originalXDomain[1]) > tolerance;
  }, [xDomain, originalXDomain]);

  const canZoomIn = useMemo(() => {
    if (!originalXDomain || xDomain[0] === 'auto' || xDomain[1] === 'auto') return false;
    const currentRange = (xDomain[1] as number) - (xDomain[0] as number);
    const minAllowedRange = Math.max(0.01, (originalXDomain[1] - originalXDomain[0]) * 0.001);
    return currentRange > minAllowedRange;
  }, [xDomain, originalXDomain]);

  const canZoomOut = useMemo(() => {
     if (!originalXDomain || xDomain[0] === 'auto' || xDomain[1] === 'auto') return false;
     const tolerance = 1e-6 * (originalXDomain[1] - originalXDomain[0]);
     return (xDomain[0] > originalXDomain[0] + tolerance) || (xDomain[1] < originalXDomain[1] - tolerance);
  }, [xDomain, originalXDomain]);

  const yDomainMax = N_population ? N_population * 1.1 : 'auto';
  const xAxisLabel = `Tiempo (${timeUnit || 'unidades'})`;

  if (!data || data.length === 0) {
    return (
       <Card className="shadow-xl bg-card/80 backdrop-blur-sm min-h-[400px] flex items-center justify-center">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Gráfico de Propagación</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ingresa los parámetros y haz clic en "Calcular" para ver el gráfico.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-center gap-4">
          <div className="flex-grow">
            <CardTitle className="text-2xl text-primary">Gráfico de Propagación</CardTitle>
            <CardDescription>Comparación de la propagación de rumores analítica, numérica y observada.</CardDescription>
          </div>
          {originalXDomain && (originalXDomain[0] < originalXDomain[1]) && (
            <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
              <Button variant="outline" size="icon" onClick={handleZoomIn} title="Acercar" disabled={!canZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut} title="Alejar" disabled={!canZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleResetZoom} title="Restablecer Zoom" disabled={!isZoomed}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              label={{ value: xAxisLabel, position: "insideBottom", offset: -15, fill: 'hsl(var(--muted-foreground))' }}
              type="number"
              domain={xDomain}
              allowDataOverflow={true}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              domain={[0, yDomainMax]}
              label={{ value: "Personas Informadas (R)", angle: -90, position: "insideLeft", fill: 'hsl(var(--muted-foreground))' }}
              allowDataOverflow={true}
            />
            <Tooltip content={<CustomTooltip timeUnit={timeUnit} />} />
            <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
            
            <Line
              type="monotone"
              dataKey="analytical"
              name="Solución Analítica"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(var(--chart-1))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="numerical"
              name="Numérica (Euler)"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(var(--chart-2))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              strokeDasharray="5 5"
              connectNulls
            />
            <Scatter
              name="Datos Observados"
              dataKey="observed"
              fill="hsl(var(--chart-3))"
              shape="circle"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
