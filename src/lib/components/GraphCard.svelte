<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import { AreaChart } from "layerchart";
  import { scaleTime } from "d3-scale";
  import { curveNatural } from "d3-shape";
  import type { Point } from "$lib/types";
  import type { Snippet } from "svelte";

  const {
    title,
    visibleSeries,
    viewMetric,
    axisCfg,
    chartConfig,
    controls
  } = $props<{
    title: string;
    visibleSeries: Point[];
    viewMetric: "temperature" | "energy";
    axisCfg: { ticksFn: (scale: any) => Date[]; format: (d: Date) => string; tooltipLabel: (d: Date) => string };
    chartConfig: Record<"temperature" | "energy", { label: string; color: string }>;
    controls?: Snippet;
  }>();
</script>

<Card.Root class="h-full flex flex-col">
  <Card.Header class="flex items-center justify-between gap-3 flex-wrap px-6">
    <Card.Title class="text-2xl font-light">{title}</Card.Title>
    {@render controls?.()}
  </Card.Header>

  <Card.Content class="flex-1 min-h-0 px-6 lg:mt-48">
    <Chart.Container config={chartConfig} class="w-full h-full">
      <AreaChart
        data={visibleSeries}
        x="date"
        xScale={scaleTime()}
        series={[
          {
            key: viewMetric,
            label: chartConfig[viewMetric].label,
            color: chartConfig[viewMetric].color
          }
        ]}
        axis="x"
        props={{
          area: {
            curve: curveNatural,
            "fill-opacity": 0.35,
            line: { class: "stroke-2" },
            motion: "tween"
          },
          xAxis: {
            ticks: axisCfg.ticksFn,
            format: axisCfg.format
          }
        }}
      >
        {#snippet tooltip()}
          <Chart.Tooltip indicator="line" labelFormatter={axisCfg.tooltipLabel} />
        {/snippet}
      </AreaChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
