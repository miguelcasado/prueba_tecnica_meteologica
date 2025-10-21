import type { Dataset, Prefixes } from "$lib/types";

/** 
 * Convierte una temperatura en décikelvin a grados Celsius.
 */
export const toCelsius = (dk: number) => dk / 10 - 273.15;

/** 
 * Convierte un valor de potencia en megavatios (como string) a kilovatios-hora.
 * @param mwStr - Valor en MW como cadena, puede contener coma o punto.
 * @param stepSeconds - Paso temporal en segundos (por defecto 5s).
 * @returns Energía equivalente en kWh.
 */
export const mwStrToKWh = (mwStr: string, stepSeconds = 5) => {
  const n = Number((mwStr ?? "0").replace(",", ".").trim());
  if (!Number.isFinite(n)) return 0;
  return n * 1000 * (stepSeconds / 3600); 
};

/** 
 * Construye los acumuladores (prefijos) de suma, conteo y energía.
 * Se utiliza para cálculos rápidos de promedio o sumatorias parciales.
 * @param dataset - Conjunto de datos de temperatura y potencia.
 * @param stepSeconds - Intervalo temporal entre muestras.
 * @returns Objeto con tiempos, sumas y conteos acumulados.
 */
export function buildPrefixes(dataset: Dataset, stepSeconds = 5): Prefixes {
  const temps = dataset.temperature;
  const powers = dataset.power;

  const n = Math.max(temps.length, powers.length);
  const times = temps.map(t => t.time); 

  const tempSum = new Array(n).fill(0);
  const tempCnt = new Array(n).fill(0);
  const kwhSum  = new Array(n).fill(0);

  let s = 0, c = 0, e = 0;

  for (let i = 0; i < n; i++) {
    const dk = temps[i]?.value;
    if (typeof dk === "number" && Number.isFinite(dk)) {
      const tc = toCelsius(dk);
      s += tc; c += 1;
    }
    const kwh = mwStrToKWh(powers[i]?.value ?? "0", stepSeconds);
    e += kwh;

    tempSum[i] = s;
    tempCnt[i] = c;
    kwhSum[i]  = e;
  }

  return { times, tempSum, tempCnt, kwhSum };
}