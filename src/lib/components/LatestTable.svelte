<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import type { RealtimeData } from "$lib/types";
  import type { Snippet } from "svelte";

  const { rows, loading } = $props<{
    rows: RealtimeData[];
    loading?: Snippet;
  }>();
</script>

<Card.Root class="flex-1 min-h-0 overflow-hidden gap-0">
  <Card.Header class="py-3 flex-shrink-0 px-4">
    <Card.Title class="text-lg font-light">Último valor</Card.Title>
  </Card.Header>

  <Card.Content class="h-[calc(100%-2.5rem)] min-h-0 px-4 pb-4">
    {#if rows.length === 0}
      {@render loading?.()}
    {:else}
      <ScrollArea class="h-full w-full">
        <Table.Root class="min-w-full">
          <Table.Header>
            <Table.Row>
              <Table.Head>Hora</Table.Head>
              <Table.Head class="text-right">Temperatura (°C)</Table.Head>
              <Table.Head class="text-right">Energía (kWh)</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each rows as r, i}
              <Table.Row class={`border-b last:border-b-0 transition-colors ${
                i === 0
                  ? 'bg-gray-50/80 dark:bg-gray-950/40 font-semibold text-gray-700 dark:text-gray-300'
                  : 'hover:bg-muted/30'
              }`}>
                <Table.Cell class="font-bold">{r.time}</Table.Cell>
                <Table.Cell class="text-right">{r.temperature.toFixed(2)}</Table.Cell>
                <Table.Cell class="text-right">{r.power.toFixed(4)}</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </ScrollArea>
    {/if}
  </Card.Content>
</Card.Root>
