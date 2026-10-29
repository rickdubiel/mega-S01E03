<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import tickets from '#lib/data/tickets-4471.json';
  import { splitTicket } from '#lib/kb/problems';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  const groups = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const total = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket).length);
  const oneDay = $derived(groups.find((g) => g.problem === 'one-day')?.reports.length ?? 0);
  const filed = tickets as Record<string, string | null>;
  const counts = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{total}</strong> reports merged into #{ticket} ·
  <strong>{groups.length}</strong>
  {groups.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tagged as</th><th>came in by</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td class="small">{counts(g.taggedAs)}</td>
        <td class="small">{counts(g.channels)}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if filed[g.problem]}<a href={filed[g.problem]}>#{filed[g.problem]?.split('/').pop()}</a>{:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#if oneDay}
  <p class="small">Counted the desk's way: each report under the cause it is filed under by tenant. The {oneDay}
    <code>one-day</code> reports are filed under <code>parser</code> and listed again in their own row.</p>
{/if}

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
