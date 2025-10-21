<script lang="ts">
  import { onMount } from "svelte";
  import * as Select from "$lib/components/ui/select/index.js";
  import Loader2 from "@lucide/svelte/icons/loader-2";
  import favicon from "$lib/assets/favicon.svg";

  import GraphCard from "$lib/components/GraphCard.svelte";
  import StatsCards from "$lib/components/StatsCards.svelte";
  import LatestTable from "$lib/components/LatestTable.svelte";

  import { aggregate, buildAxisConfig } from "$lib/utils/chartFunctions";
  import { loadData } from "$lib/utils/loadData";
  import { getRealtimeData } from "$lib/services/realtimeService";
  import { findClosestTimeIndex } from "$lib/utils/searchValues";
  import { formatToActualDate, toDate } from "$lib/utils/time";
  import { mwStrToKWh, toCelsius } from "$lib/utils/converter";

  import type { RealtimeData, Point } from "$lib/types";

  /**
   * Duración de las ventanas visibles en milisegundos según el intervalo.
   * Sirve para limitar el rango mostrado en el gráfico.
   */
  const WINDOW_MS_MAP = {
    "5s":     10 * 60 * 1000,   // 10 minutos
    "minute": 6  * 60 * 60 * 1000, // 6 horas
    "hour":   24 * 60 * 60 * 1000  // 24 horas
  } as const;

  /** Datos principales del gráfico (temperatura y energía) */
  let chartData = $state<Point[]>([]);
  /** Filas mostradas en la tabla lateral */
  let rows = $state<RealtimeData[]>([]);
  /** Máximo de filas visibles */
  const ROWS_MAX = 500;

  /** Acumuladores de estadísticas globales */
  let sumTemp = $state(0);
  let cntTemp = $state(0);
  let totalKWh = $state(0);

  /** Estado actual de vista (métrica y resolución temporal) */
  let viewMetric   = $state<"temperature" | "energy">("temperature");
  let viewInterval = $state<"5s" | "minute" | "hour">("minute");

  /** Promedio de temperatura calculado en tiempo real */
  let avgTempC = $derived(cntTemp ? sumTemp / cntTemp : 0);

  /** Etiquetas de interfaz dependientes del estado */
  let metricLabel   = $derived(viewMetric === "temperature" ? "Temperatura" : "Energía");
  let intervalLabel = $derived(viewInterval === "5s" ? "5 s" : viewInterval === "minute" ? "Minuto" : "Hora");

  /** Configuración visual del gráfico (etiquetas y colores) */
  const chartConfig = {
    temperature: { label: "Temperatura (°C)", color: "#22c55e" },
    energy:      { label: "Energía (kWh)",    color: "#facc15" }
  } satisfies Record<"temperature"|"energy",{label:string;color:string}>;

  /**
   * Serie base del gráfico.
   * Si el intervalo es 5s, usa datos sin agregación.
   * Si es "minute" u "hour", aplica función de agregación.
   */
  const baseSeries = $derived((() => {
    if (viewInterval === "5s") {
      return viewMetric === "temperature"
        ? chartData.map(p => ({ date: p.date, temperature: p.temperature }))
        : chartData.map(p => ({ date: p.date, energy: p.energy }));
    }
    return aggregate(chartData, viewInterval, viewMetric);
  })());

  /** Configuración del eje X del gráfico según intervalo y ancho */
  const axisCfg = $derived(buildAxisConfig(viewInterval, 900));

  /**
   * Fecha inicial visible en el gráfico
   * (último punto menos la duración de la ventana)
   */
  const xStart = $derived((() => {
    if (baseSeries.length === 0) return new Date(0);
    const end = baseSeries[baseSeries.length - 1].date;
    return new Date(end.getTime() - WINDOW_MS_MAP[viewInterval]);
  })());

  /** Fecha final visible en el gráfico */
  const xEnd = $derived((() => {
    if (baseSeries.length === 0) return new Date(0);
    return baseSeries[baseSeries.length - 1].date;
  })());

  /**
   * Filtra la serie base para mostrar solo los puntos dentro del rango visible.
   */
  const visibleSeries = $derived((() => {
    if (baseSeries.length === 0) return baseSeries;
    const start = xStart, end = xEnd;
    return baseSeries.filter(p => p.date >= start && p.date <= end);
  })());

  /**
   * Hook de montaje principal.
   * Carga datos históricos, genera el gráfico inicial y mantiene el flujo en tiempo real.
   */
  onMount(() => {
    let cancelled = false;
    const cancel = () => { cancelled = true; };

    (async () => {
      /** 
       * Carga de datos históricos.
       * La función loadData obtiene series de temperatura y potencia.
       */
      const dataset = await loadData();
      const temps = dataset.temperature ?? [];
      const powers = dataset.power ?? [];
      const times = temps.map(t => t.time);

      /** Busca índice más cercano a la fecha objetivo */
      const target = formatToActualDate(5);
      const endIdx = Math.min(
        findClosestTimeIndex(times, target),
        Math.min(temps.length, powers.length) - 1
      );

      const STEP = 12; // Paso para reducir puntos visualizados
      let accTempSum = 0;
      let accTempCnt = 0;
      let accEnergyKWh = 0;

      /**
       * Itera datos históricos y genera puntos para el gráfico.
       * Se limita con STEP y se cede el control al navegador cada cierto número
       * de iteraciones para evitar bloqueos (usando requestAnimationFrame).
       */
      for (let i = 0; i <= endIdx; i++) {
        const tempC = toCelsius(temps[i].value);
        accTempSum += tempC;
        accTempCnt += 1;

        const kWh = mwStrToKWh(powers[i].value);
        accEnergyKWh += kWh;

        if (i % STEP === 0) {
          chartData = [
            ...chartData,
            { date: toDate(temps[i].time), temperature: tempC, energy: kWh }
          ];
        }
        if (i % (STEP * 100) === 0) {
          await new Promise(r => requestAnimationFrame(r));
        }
      }

      /** Agrega el último punto si no cayó justo en un múltiplo de STEP */
      if (endIdx >= 0 && endIdx % STEP !== 0) {
        const tempC = toCelsius(temps[endIdx].value);
        const kWh   = mwStrToKWh(powers[endIdx].value);
        chartData = [
          ...chartData,
          { date: toDate(temps[endIdx].time), temperature: tempC, energy: kWh }
        ];
      }

      /** Actualiza acumuladores globales */
      sumTemp  += accTempSum;
      cntTemp  += accTempCnt;
      totalKWh += accEnergyKWh;

      /**
       * Bucle principal de datos en tiempo real.
       * getRealtimeData devuelve un generador asincrónico que emite nuevas lecturas.
       */
      for await (const s of getRealtimeData(dataset, 5000)) {
        if (cancelled) break;

        sumTemp  += s.temperature;
        cntTemp  += 1;
        totalKWh += s.power;

        chartData = [
          ...chartData,
          { date: toDate(s.time), temperature: s.temperature, energy: s.power }
        ];
        rows = [s, ...rows].slice(0, ROWS_MAX);
      }
    })();

    // Cancela el stream al desmontar el componente
    return cancel;
  });
</script>


<!-- ===================================== -->
<!-- UI principal: header + gráfico + tabla -->
<!-- ===================================== -->
<div class="h-[calc(100vh-4rem)] bg-gray-50 text-gray-900 px-6 py-4 space-y-4">
  <header class="bg-gray-50">
    <div class="flex items-center justify-between">
      <img src={favicon} alt="Logo" class="w-8 h-8" />
    </div>
  </header>

  <div class="grid grid-cols-5 gap-4 sm:gap-6 h-full">
    <!-- Gráfico principal -->
    <div class="col-span-5 lg:col-span-3 h-full min-h-0">
      <GraphCard
        title="Gráfico en tiempo real"
        {visibleSeries}
        {viewMetric}
        {axisCfg}
        {chartConfig}
      >
        {#snippet controls()}
          <div class="flex gap-2">
            <!-- Selector de métrica -->
            <Select.Root type="single" bind:value={viewMetric}>
              <Select.Trigger class="w-[140px] text-sm">
                <span class="truncate">{metricLabel}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="temperature">Temperatura</Select.Item>
                <Select.Item value="energy">Energía</Select.Item>
              </Select.Content>
            </Select.Root>

            <!-- Selector de intervalo temporal -->
            <Select.Root type="single" bind:value={viewInterval}>
              <Select.Trigger class="w-[120px] text-sm">
                <span class="truncate">{intervalLabel}</span>
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="5s">5 s</Select.Item>
                <Select.Item value="minute">Minuto</Select.Item>
                <Select.Item value="hour">Hora</Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
        {/snippet}
      </GraphCard>
    </div>

    <!-- Panel lateral con estadísticas y tabla -->
    <div class="col-span-5 lg:col-span-2 h-full flex flex-col gap-4 min-h-0">
      <StatsCards {avgTempC} {totalKWh} />

      <LatestTable {rows}>
        {#snippet loading()}
          <div class="flex items-center justify-center h-full">
            <Loader2 class="size-6 animate-spin text-muted-foreground" />
          </div>
        {/snippet}
      </LatestTable>
    </div>
  </div>
</div>
