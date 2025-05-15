
"use client";

import type * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ResultsDisplayProps {
  kValue: number | null;
}

export function ResultsDisplay({ kValue }: ResultsDisplayProps) {
  if (kValue === null) {
    return null;
  }

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Resultados de la Simulación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-foreground">Tasa de Propagación Estimada (k)</h4>
          {kValue !== null ? (
             <Badge variant="secondary" className="text-2xl font-bold bg-accent text-accent-foreground p-3 rounded-md shadow-md">
              {kValue.toFixed(4)}
            </Badge>
          ) : (
            <p className="text-muted-foreground">Aún no calculado.</p>
          )}
        </div>
        {/* Additional results can be displayed here if needed */}
      </CardContent>
    </Card>
  );
}
