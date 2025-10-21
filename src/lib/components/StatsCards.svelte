<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";

  const { avgTempC, totalKWh } = $props<{
    avgTempC: number;
    totalKWh: number;
  }>();

  const partsKWh = $derived(totalKWh.toFixed(2).split("."));
</script>

<div class="grid grid-cols-2 gap-4 flex-shrink-0">
  <Card.Root class="flex flex-col w-full pb-12">
    <Card.Header class="items-start">
      <Card.Title class="text-lg font-light">Temperatura media</Card.Title>
    </Card.Header>
    <Card.Content class="flex-1 flex items-center justify-center">
      <div class="text-5xl font-semibold">{avgTempC.toFixed(2)} °C</div>
    </Card.Content>
  </Card.Root>

  <Card.Root class="flex flex-col w-full pb-12">
    <Card.Header class="items-start">
      <Card.Title class="text-lg font-light">Energía acumulada</Card.Title>
    </Card.Header>
    <Card.Content class="flex-1 flex items-center justify-center">
      <div class="text-5xl font-semibold">
        {partsKWh[0]}.<span class="text-3xl text-gray-500">{partsKWh[1]}</span>
        <span class="text-2xl text-gray-500">kWh</span>
      </div>
    </Card.Content>
  </Card.Root>
</div>
