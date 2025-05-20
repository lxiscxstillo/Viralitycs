
"use client";

import type * as React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function EquationsInfo() {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl text-primary">Información del Modelo de Propagación</DialogTitle>
        <DialogDescription>
          Detalles sobre la ecuación diferencial, su solución y los métodos de cálculo utilizados en Viralitycs.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6 py-4 text-sm text-foreground">
        <section>
          <h3 className="text-xl font-semibold text-accent mb-2">1. Ecuación Diferencial Logística</h3>
          <p className="mb-2">
            El modelo de propagación de rumores implementado se basa en la ecuación diferencial logística. Esta ecuación describe cómo una cantidad (en este caso, el número de personas informadas sobre un rumor) crece con el tiempo, considerando una capacidad máxima (la población total).
          </p>
          <pre className="bg-muted p-3 rounded-md text-xs sm:text-sm overflow-x-auto mb-2">
            <code>dR/dt = k &middot; R &middot; (1 - R/N)</code>
          </pre>
          <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
            <li><code>R(t)</code>: Número de personas informadas en el tiempo <code>t</code>.</li>
            <li><code>N</code>: Población total susceptible de conocer el rumor.</li>
            <li><code>k</code>: Tasa de propagación del rumor. Este coeficiente indica la rapidez con la que se difunde el rumor.</li>
            <li><code>dR/dt</code>: La tasa de cambio del número de personas informadas con respecto al tiempo.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-accent mb-2">2. Solución Analítica</h3>
          <p className="mb-2">
            La solución analítica de esta ecuación diferencial, dado un valor inicial de personas informadas <code>R(0) = R₀</code>, es:
          </p>
          <pre className="bg-muted p-3 rounded-md text-xs sm:text-sm overflow-x-auto mb-2">
            <code>R(t) = N / (1 + A &middot; e<sup>-k&middot;t</sup>)</code>
          </pre>
          <p className="mb-2">Donde la constante <code>A</code> se calcula como:</p>
          <pre className="bg-muted p-3 rounded-md text-xs sm:text-sm overflow-x-auto mb-2">
            <code>A = (N - R₀) / R₀</code>
          </pre>
          <p className="text-muted-foreground">
            Esta solución describe la curva sigmoidea (forma de "S") que se observa en el gráfico. Representa cómo la propagación se acelera inicialmente y luego se desacelera a medida que el número de personas informadas se acerca al total de la población <code>N</code>.
          </p>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-accent mb-2">3. Solución Numérica (Método de Euler)</h3>
          <p className="mb-2">
            Para aproximar la solución de la ecuación diferencial, especialmente útil para comparación o cuando una solución analítica es compleja, se utiliza un método numérico. Esta aplicación emplea el método de Euler hacia adelante, que es un enfoque de primer orden:
          </p>
          <pre className="bg-muted p-3 rounded-md text-xs sm:text-sm overflow-x-auto mb-2">
            <code>R(t + &Delta;t) = R(t) + &Delta;t &middot; [k &middot; R(t) &middot; (1 - R(t)/N)]</code>
          </pre>
          <p className="mb-2">O, de forma más general, para el paso discreto <code>n</code>:</p>
          <pre className="bg-muted p-3 rounded-md text-xs sm:text-sm overflow-x-auto mb-2">
            <code>R<sub>n+1</sub> = R<sub>n</sub> + &Delta;t &middot; f(t<sub>n</sub>, R<sub>n</sub>)</code>
          </pre>
          <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
            <li><code>R<sub>n</sub></code>: Valor de <code>R</code> en el tiempo <code>t<sub>n</sub></code>.</li>
            <li><code>&Delta;t</code>: El paso de tiempo (un valor pequeño). Cuanto menor sea, mayor precisión, pero más cálculos.</li>
            <li><code>f(t<sub>n</sub>, R<sub>n</sub>)</code>: El valor de <code>dR/dt</code> en el tiempo <code>t<sub>n</sub></code> y con <code>R<sub>n</sub></code> personas informadas.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-accent mb-2">4. Estimación de la Tasa de Propagación (k)</h3>
          <p className="mb-2">
            La tasa <code>k</code> es un parámetro crucial que determina la velocidad de propagación.
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
            <li>
              <strong>Con Datos Observados:</strong> Si proporcionas puntos de datos observados (tiempo, personas informadas), la aplicación intenta estimar <code>k</code>. Se utiliza un método heurístico simple basado en el primer punto de datos válido <code>(t, R<sub>t</sub>)</code> que cumple <code>t > 0</code> y <code>R₀ &lt; R<sub>t</sub> &lt; N</code>. Este método invierte la solución analítica para resolver <code>k</code>:
              <pre className="bg-muted p-2 my-1 rounded-md text-xs sm:text-sm overflow-x-auto">
                <code>k = -ln( ((N / R<sub>t</sub>) - 1) / A ) / t</code>
              </pre>
              (donde <code>ln</code> es el logaritmo natural y <code>A</code> es la constante definida previamente).
              En escenarios más complejos o con múltiples datos, se emplearían técnicas de ajuste de curvas más sofisticadas (como el método de mínimos cuadrados).
            </li>
            <li>
              <strong>Sin Datos Observados:</strong> Si no se proporcionan datos observados, o si la heurística no puede calcular un valor válido (por ejemplo, si los datos no se ajustan al modelo esperado), se utiliza un valor predeterminado para <code>k</code> (actualmente 0.1 por unidad de tiempo).
            </li>
          </ul>
           <p className="mt-2 text-muted-foreground">
            La precisión de la estimación de <code>k</code> depende de la calidad y cantidad de los datos observados y de cuán bien el modelo logístico representa la propagación real del rumor.
          </p>
        </section>
      </div>
    </>
  );
}
