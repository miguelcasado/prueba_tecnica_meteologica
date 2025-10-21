/** 
 * Búsqueda binaria del índice donde debería insertarse un tiempo objetivo.
 * @param times - Lista ordenada de timestamps (strings "HH:MM:SS").
 * @param target - Tiempo objetivo a buscar.
 * @returns Índice del elemento encontrado o posición de inserción.
 */
export function binarySearch(times: string[], target: string): number {
    let lo = 0;
    let hi = times.length;
    while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (times[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    return lo;
}

/** 
 * Encuentra el índice más cercano al tiempo objetivo en una lista ordenada.
 * @param times - Lista de tiempos (strings).
 * @param target - Tiempo objetivo.
 * @returns Índice del valor más cercano.
 */
export function findClosestTimeIndex(times: string[], target: string): number {
    const index = binarySearch(times, target);
    if (index === 0) return 0;
    if (index === times.length) return times.length - 1;
    return times[index] === target ? index : index - 1;
}