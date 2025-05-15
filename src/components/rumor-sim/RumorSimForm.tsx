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
  time: z.coerce.number().min(0, "Time must be non-negative"),
  value: z.coerce.number().min(0, "Value must be non-negative"),
});

const formSchema = z.object({
  N: z.coerce.number().int().positive("Population (N) must be a positive integer"),
  R0: z.coerce.number().int().positive("Initial spread (R0) must be a positive integer"),
  observedData: z.array(observedDataPointSchema).min(0)
    .refine(
      (data, ctx) => {
        const { N } = ctx.parent;
        if (N === undefined) return true; // N might not be parsed yet
        return data.every(p => p.value <= N);
      },
      {
        message: "Observed spread values cannot exceed Total Population (N)",
        // No specific path here, as it's an array-level validation.
        // Individual field errors for value > N can also be added if needed.
      }
    ),
}).refine(data => data.R0 < data.N, {
  message: "Initial spread (R0) must be less than Total Population (N)",
  path: ["R0"],
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
    // Additional check for observed values against N, as refine context might be tricky
    const N = values.N;
    let valid = true;
    values.observedData.forEach((point, index) => {
      if (point.value > N) {
        form.setError(`observedData.${index}.value`, {
          type: 'manual',
          message: `Cannot exceed N (${N})`
        });
        valid = false;
      }
    });
    if (valid) {
      onSubmit(values);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Input Parameters</CardTitle>
            <CardDescription>Set the initial conditions and observed data for the simulation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="N"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="N" className="text-lg">Total Population (N)</FormLabel>
                    <FormControl>
                      <Input id="N" type="number" placeholder="e.g., 1000" {...field} className="text-base"/>
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
                    <FormLabel htmlFor="R0" className="text-lg">Initial Spread (R₀)</FormLabel>
                    <FormControl>
                      <Input id="R0" type="number" placeholder="e.g., 1" {...field} className="text-base"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-primary-foreground">Observed Data Points (t, R)</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 rounded-md border border-input p-4 bg-background/50">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md shadow-sm">
                    <FormField
                      control={form.control}
                      name={`observedData.${index}.time`}
                      render={({ field: timeField }) => (
                        <FormItem className="flex-1">
                          <FormLabel htmlFor={`observedData.${index}.time`} className="sr-only">Time (t)</FormLabel>
                           <FormControl>
                            <Input
                              id={`observedData.${index}.time`}
                              type="number"
                              placeholder="Time"
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
                          <FormLabel htmlFor={`observedData.${index}.value`} className="sr-only">Rumor Spread (R)</FormLabel>
                          <FormControl>
                            <Input
                              id={`observedData.${index}.value`}
                              type="number"
                              placeholder="Spread"
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
                      aria-label="Remove data point"
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
                <PlusCircle className="mr-2 h-4 w-4" /> Add Data Point
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isCalculating} className="w-full text-lg py-6 bg-primary hover:bg-primary/90 text-primary-foreground">
              {isCalculating ? 'Calculating...' : 'Calculate & Simulate'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
