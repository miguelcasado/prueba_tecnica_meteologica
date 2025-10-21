/** 
 * Formatea un número con dos dígitos (añadiendo ceros a la izquierda).
 */
export const formatString = (num: number) => String(num).padStart(2, '0');

/** 
 * Devuelve la hora actual truncada al múltiplo más cercano de stepSeconds.
 * Ejemplo: si son las 12:00:07 y stepSeconds=5 → "12:00:05".
 */
export function formatToActualDate(stepSeconds = 5): string {
    const date = new Date();
    const flooredSeconds = date.getSeconds() - (date.getSeconds() % stepSeconds);
    return `${formatString(date.getHours())}:${formatString(date.getMinutes())}:${formatString(flooredSeconds)}`;
}

/** 
 * Calcula cuántos milisegundos faltan hasta el próximo paso temporal.
 * @param stepMs - Duración del paso en milisegundos (por defecto 5000).
 */
export function msToNextStep(stepMs = 5000): number {
    return stepMs - (Date.now() % stepMs);
}

/** 
 * Convierte un string "HH:MM:SS" en un objeto Date (día fijo 1970-01-01).
 */
export const toDate = (hhmmss: string): Date => {
  const [hh, mm, ss = "0"] = hhmmss.split(":");
  return new Date(1970, 0, 1, Number(hh), Number(mm), Number(ss));
};