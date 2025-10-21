/**
 * Representa un punto de temperatura con su marca temporal y valor numérico.
 */
export interface DkPoint {
  /** Marca temporal en formato ISO (por ejemplo, "2025-10-21T12:00:00Z"). */
  time: string;

  /** Valor de temperatura en décikelvin o unidad base del sensor. */
  value: number;
}

/**
 * Representa un punto de energía (potencia) con su hora y valor en texto.
 */
export interface KWhPoint {
  /** Marca temporal en formato ISO (por ejemplo, "2025-10-21T12:00:00Z"). */
  time: string;

  /** Valor de potencia expresado como string, normalmente en MW o kWh. */
  value: string;
}

/**
 * Estructura completa de datos históricos cargados desde la fuente.
 * Contiene arrays de temperatura y potencia en paralelo.
 */
export interface Dataset {
  /** Serie de puntos de temperatura. */
  temperature: DkPoint[];

  /** Serie de puntos de potencia/energía. */
  power: KWhPoint[];
}

/**
 * Datos emitidos en tiempo real por el servicio de streaming.
 * Cada objeto representa una lectura instantánea.
 */
export interface RealtimeData {
  /** Hora de la lectura en formato ISO. */
  time: string;

  /** Temperatura actual convertida a °C. */
  temperature: number;

  /** Potencia instantánea actual en kWh. */
  power: number;

  /** Promedio acumulado de temperatura en °C. */
  avgTemperature: number;

  /** Energía total acumulada en kWh. */
  totalPower: number;
}

/**
 * Conjunto de vectores auxiliares usados en cálculos agregados.
 * Sirve para optimizar búsquedas y operaciones sobre series.
 */
export type Prefixes = {
  /** Tiempos asociados a cada posición del acumulador. */
  times: string[];

  /** Suma acumulada de temperaturas. */
  tempSum: number[];

  /** Conteo de puntos usados para promediar temperatura. */
  tempCnt: number[];

  /** Suma acumulada de energía (kWh). */
  kwhSum: number[];
};

/**
 * Punto de serie listo para graficar.
 * Puede contener temperatura, energía o ambas según el modo de vista.
 */
export type Point = {
  /** Fecha ya convertida a objeto Date para usar en ejes temporales. */
  date: Date;

  /** Temperatura (°C), si se está mostrando el modo temperatura. */
  temperature?: number;

  /** Energía (kWh), si se está mostrando el modo energía. */
  energy?: number;
};
