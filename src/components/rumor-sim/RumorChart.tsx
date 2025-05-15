
"use client";

import type * as React from 'react';
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

interface RumorChartProps {
  data: CalculatedDataPoint[];
  N_population: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-background/80 border border-border rounded-md shadow-lg text-foreground text-sm">
        <p className="label font-semibold">{`Tiempo: ${label}`}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value?.toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


export function RumorChart({ data, N_population }: RumorChartProps) {
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
  
  // Determine Y-axis domain
  const yDomainMax = N_population ? N_population * 1.1 : 'auto';


  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Gráfico de Propagación</CardTitle>
        <CardDescription>Comparación de la propagación de rumores analítica, numérica y observada.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              label={{ value: "Tiempo (t)", position: "insideBottomRight", offset: -5, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              domain={[0, yDomainMax]}
              label={{ value: "Personas Informadas (R)", angle: -90, position: "insideLeft", fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
            
            <Line
              type="monotone"
              dataKey="analytical"
              name="Solución Analítica"
              stroke="hsl(var(--chart-1))" // Neon Green
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(var(--chart-1))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="numerical"
              name="Numérica (Euler)"
              stroke="hsl(var(--chart-2))" // Neon Blue
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(var(--chart-2))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              strokeDasharray="5 5"
            />
            <Scatter
              name="Datos Observados"
              dataKey="observed"
              fill="hsl(var(--chart-3))" // Neon Cyan
              shape="circle"
              // The Scatter component needs data where 'observed' is a value, not an array.
              // The `data` prop should be formatted so each point has an `observed` value if it's an observed point.
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
