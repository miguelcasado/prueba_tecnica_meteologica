import { parse } from 'yaml';
import type { Dataset } from '../types';

/** 
 * Carga el archivo YAML con los datos de temperatura y potencia.
 * @returns Promesa que resuelve con el Dataset parseado.
 */
export async function loadData(): Promise<Dataset> {
  const res = await fetch('/data.yml');
  const text = await res.text();
  const raw: any = parse(text);

  return {
    temperature: raw?.temperature?.values ?? [],
    power: raw?.power?.values ?? []
  };
}
