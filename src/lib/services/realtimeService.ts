// src/lib/services/realtimeService.ts
import type { Dataset, RealtimeData } from "$lib/types";
import { findClosestTimeIndex } from "$lib/utils/searchValues";
import { formatToActualDate, msToNextStep } from "$lib/utils/time";
import { toCelsius, mwStrToKWh } from "$lib/utils/converter";
import { buildPrefixes } from "$lib/utils/converter";

/**
 * Generador asíncrono de lecturas en “tiempo real” a partir de un dataset histórico.
 * Calcula prefijos (suma/conteo/kWh) para promedios y acumulados, busca el índice
 * más cercano a la hora actual truncada al step y emite una lectura en cada tick.
 * - Si falta un valor de temperatura en el índice, mantiene el último válido.
 * - La energía (kWh) se integra a partir de la potencia instantánea (MW) y el step.
 *
 * @param dataset     Dataset histórico con series de temperatura y potencia.
 * @param stepMs      Periodo del “tick” en milisegundos (por defecto 5000ms).
 * @param stepSeconds Paso temporal en segundos usado para convertir MW→kWh (por defecto 5s).
 * @yields            Objetos RealtimeData con temperatura actual, kWh del tick,
 *                    promedio acumulado de temperatura y kWh total acumulado.
 */
export async function* getRealtimeData(
  dataset: Dataset,
  stepMs = 5000,
  stepSeconds = 5
): AsyncGenerator<RealtimeData> {
  const temps = dataset.temperature ?? [];
  const powers = dataset.power ?? [];
  if (temps.length === 0) return;

  const { times, tempSum, tempCnt, kwhSum } = buildPrefixes(dataset, stepSeconds);

  const target = formatToActualDate(5);
  let i = findClosestTimeIndex(times, target);

  let sumTemp = tempSum[i];
  let countTemp = tempCnt[i];
  let totalKWh = kwhSum[i];

  let lastTempC: number | null = null;
  if (countTemp > 0) {
    for (let j = i; j >= 0; j--) {
      const dk = temps[j]?.value;
      if (typeof dk === "number" && Number.isFinite(dk)) {
        lastTempC = toCelsius(dk);
        break;
      }
    }
  }

  const build = (idx: number): RealtimeData => {
    const t = times[idx];

    const dk = temps[idx]?.value;
    let tempC: number;
    if (typeof dk === "number" && Number.isFinite(dk)) {
      tempC = toCelsius(dk);
      lastTempC = tempC;
      if (idx > i) { sumTemp += tempC; countTemp += 1; }
    } else {
      tempC = lastTempC ?? 0;
    }

    const kWh = mwStrToKWh(powers[idx]?.value ?? "0", stepSeconds);
    if (idx > i) totalKWh += kWh; 

    return {
      time: t,
      temperature: tempC,
      power: kWh,
      avgTemperature: countTemp ? (sumTemp / countTemp) : (lastTempC ?? 0),
      totalPower: totalKWh
    };
  };

  yield build(i);

  await new Promise(r => setTimeout(r, msToNextStep(stepMs)));
  while (++i < times.length) {
    yield build(i);
    await new Promise(r => setTimeout(r, stepMs));
  }
}
