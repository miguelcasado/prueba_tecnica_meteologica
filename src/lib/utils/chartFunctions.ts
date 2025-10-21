import { timeSecond, timeMinute, timeHour } from "d3-time";
import type { Point } from "$lib/types";

/** 
 * Calcula el intervalo de ticks apropiado según el ancho y la vista.
 * @param view - Escala temporal ("5s" | "minute" | "hour").
 * @param width - Ancho del gráfico en píxeles.
 * @returns Función D3 para generar ticks espaciados.
 */
export function pickTickEvery(view: "5s" | "minute" | "hour", width: number) {
  const target = Math.max(3, Math.floor(width / 90));
  if (view === "5s") {
    if (target < 7)  return timeMinute.every(2);
    if (target < 15) return timeMinute.every(1);
    return timeSecond.every(30);
  }
  if (view === "minute") {
    if (target < 6)   return timeHour.every(1);
    if (target < 10)  return timeMinute.every(15);
    if (target < 18)  return timeMinute.every(10);
    if (target < 30)  return timeMinute.every(5);
    return timeMinute.every(1);
  }
  if (target < 6)  return timeHour.every(6);
  if (target < 10) return timeHour.every(3);
  if (target < 16) return timeHour.every(2);
  return timeHour.every(1);
}

/** 
 * Construye la configuración del eje X del gráfico (ticks, formato, tooltip).
 * @param view - Escala temporal ("5s" | "minute" | "hour").
 * @param width - Ancho del gráfico.
 * @returns Configuración para ticks y formato de etiquetas.
 */
export function buildAxisConfig(view: "5s" | "minute" | "hour", width: number) {
  const interval = pickTickEvery(view, width);

  const ticksFn = (scale: any) => {
    const candidates: Date[] = scale.ticks(interval);
    const minPx = 80;
    const out: Date[] = [];
    let prevX = -Infinity;
    for (const t of candidates) {
      const x = scale(t);
      if (x - prevX >= minPx) {
        out.push(t);
        prevX = x;
      }
    }
    return out;
  };

  const format =
    view === "5s"
      ? (d: Date) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : view === "minute"
      ? (d: Date) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : (d: Date) => d.toLocaleTimeString("es-ES", { hour: "2-digit" }) + ":00";

  const tooltipLabel = (d: Date) =>
    view === "5s"
      ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : view === "minute"
      ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleTimeString("es-ES", { hour: "2-digit" }) + ":00";

  return { ticksFn, format, tooltipLabel };
}

/** 
 * Agrega (promedia o acumula) los puntos en función del modo y métrica.
 * @param src - Serie de puntos de entrada.
 * @param mode - Nivel de agregación ("minute" | "hour").
 * @param metric - Tipo de dato ("temperature" | "energy").
 * @returns Serie agregada lista para graficar.
 */
export function aggregate(
  src: Point[],
  mode: "minute" | "hour",
  metric: "temperature" | "energy"
): Point[] {
  const keyOf = (d: Date) =>
    mode === "minute"
      ? new Date(1970, 0, 1, d.getHours(), d.getMinutes(), 0)
      : new Date(1970, 0, 1, d.getHours(), 0, 0);

  const NORMAL_FACTOR = mode === "minute" ? 12 : 720;

  const map = new Map<number, { sum: number; cnt: number }>();

  for (const p of src) {
    const v = metric === "temperature" ? p.temperature : p.energy;
    if (v == null) continue;
    const k = keyOf(p.date).getTime();
    const b = map.get(k) ?? { sum: 0, cnt: 0 };
    b.sum += v;
    b.cnt += 1;
    map.set(k, b);
  }

  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([k, b]) => {
      const avg = b.cnt ? b.sum / b.cnt : 0;
      if (metric === "temperature") {
        return { date: new Date(k), temperature: avg };
      } else {
        return { date: new Date(k), energy: avg * NORMAL_FACTOR };
      }
    });
}