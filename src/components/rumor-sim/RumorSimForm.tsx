
"use client";

import type * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, PlusCircle } from 'lucide-react';
import type { RumorSimFormValues, ObservedDataPoint } from './types';

const observedDataPointSchema = z.object({
  time: z.coerce.number().min(0, "El tiempo no debe ser negativo"),
  value: z.coerce.number().min(0, "El valor no debe ser negativo"),
});

const formSchema = z.object({
  N: z.coerce.number().int().positive("Población (N) debe ser un entero positivo"),
  R0: z.coerce.number().int().positive("Propagación inicial (R0) debe ser un entero positivo"),
  observedData: z.array(observedDataPointSchema).min(0),
}).superRefine((values, ctx) => {
  // Validate R0 < N
  if (values.R0 >= values.N) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La propagación inicial (R0) debe ser menor que la Población Total (N)",
      path: ["R0"],
    });
  }

  // Validate observedData points: each value must be <= N
  values.observedData.forEach((point, index) => {
    if (point.value > values.N) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El valor no puede exceder la Población Total (N: ${values.N})`,
        path: [`observedData`, index, "value"],
      });
    }
  });
});


interface RumorSimFormProps {
  onSubmit: (data: RumorSimFormValues) => void;
  isCalculating: boolean;
  defaultValues?: Partial<RumorSimFormValues>;
}

export function RumorSimForm({ onSubmit, isCalculating, defaultValues }: RumorSimFormProps) {
  const form = useForm<RumorSimFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      N: 1000,
      R0: 1,
      observedData: [{ time: 1, value: 10 }, {time: 2, value: 50}],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "observedData",
  });

  const handleFormSubmit = (values: RumorSimFormValues) => {
    onSubmit(values);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Parámetros de Entrada</CardTitle>
            <CardDescription>Establece las condiciones iniciales y los datos observados para la simulación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="N"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="N" className="text-lg">Población Total (N)</FormLabel>
                    <FormControl>
                      <Input id="N" type="number" placeholder="ej., 1000" {...field} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="R0"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="R0" className="text-lg">Propagación Inicial (R₀)</FormLabel>
                    <FormControl>
                      <Input id="R0" type="number" placeholder="ej., 1" {...field} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Puntos de Datos Observados (t, R)</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 rounded-md border border-input p-4 bg-background/50">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md shadow-sm">
                    <FormField
                      control={form.control}
                      name={`observedData.${index}.time`}
                      render={({ field: timeField }) => (
                        <FormItem className="flex-1">
                          <FormLabel htmlFor={`observedData.${index}.time`} className="sr-only">Tiempo (t)</FormLabel>
                           <FormControl>
                            <Input
                              id={`observedData.${index}.time`}
                              type="number"
                              placeholder="Tiempo"
                              step="any"
                              {...timeField}
                              className="text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`observedData.${index}.value`}
                      render={({ field: valueField }) => (
                        <FormItem className="flex-1">
                          <FormLabel htmlFor={`observedData.${index}.value`} className="sr-only">Propagación (R)</FormLabel>
                          <FormControl>
                            <Input
                              id={`observedData.${index}.value`}
                              type="number"
                              placeholder="Propagación"
                              step="any"
                              {...valueField}
                              className="text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive/80"
                      aria-label="Eliminar punto de dato"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ time: 0, value: 0 })}
                className="mt-4 border-primary text-primary hover:bg-primary/10"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Punto de Dato
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isCalculating} className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              {isCalculating ? 'Calculando...' : 'Calcular y Simular'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
