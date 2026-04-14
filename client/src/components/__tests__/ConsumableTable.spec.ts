import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import ConsumableTable from '../ConsumableTable.vue';
import type { ConsumableReport } from '../../types/consumables';

describe('ConsumableTable', () => {
  const mockReport: ConsumableReport = {
    reportTitle: 'Karazhan Clear',
    encounters: [
      { id: 1, name: 'Attumen', kill: true, startTime: 0, endTime: 100 },
      { id: 2, name: 'Moroes', kill: true, startTime: 200, endTime: 400 },
    ],
    players: [
      {
        playerName: 'Legolas',
        class: 'Hunter',
        consumables: [
          { name: 'Haste Potion', category: 'potion', spellId: 28507, count: 3, uptimePercent: null },
          { name: 'Flask of Relentless Assault', category: 'flask', spellId: 28520, count: 1, uptimePercent: 95 },
        ],
      },
      {
        playerName: 'Gandalf',
        class: 'Mage',
        consumables: [
          { name: 'Destruction Potion', category: 'potion', spellId: 28508, count: 2, uptimePercent: null },
          { name: 'Flask of Pure Death', category: 'flask', spellId: 28540, count: 1, uptimePercent: 42 },
        ],
      },
    ],
  };

  it('should render report title', () => {
    const wrapper = mount(ConsumableTable, {
      props: { report: mockReport, reportCode: 'TEST1234', fightId: null },
    });

    expect(wrapper.find('h2').text()).toBe('Karazhan Clear');
  });

  it('should render all players', () => {
    const wrapper = mount(ConsumableTable, {
      props: { report: mockReport, reportCode: 'TEST1234', fightId: null },
    });

    const playerHeaders = wrapper.findAll('h3.text-lg');
    expect(playerHeaders).toHaveLength(2);
    expect(playerHeaders[0].text()).toContain('Legolas');
    expect(playerHeaders[1].text()).toContain('Gandalf');
  });

  it('should render consumable rows with uptime column', () => {
    const wrapper = mount(ConsumableTable, {
      props: { report: mockReport, reportCode: 'TEST1234', fightId: null },
    });

    const tables = wrapper.findAll('table');
    expect(tables).toHaveLength(2);

    const firstTableRows = tables[0].findAll('tbody tr');
    expect(firstTableRows).toHaveLength(2);

    // Check uptime header exists
    const headers = tables[0].findAll('th');
    expect(headers[3].text()).toBe('Uptime');
  });

  it('should show dash for potion uptime and percentage for non-potions', () => {
    const wrapper = mount(ConsumableTable, {
      props: { report: mockReport, reportCode: 'TEST1234', fightId: null },
    });

    const html = wrapper.html();
    expect(html).toContain('95%');
    expect(html).toContain('—'); // mdash for potions
  });

  it('should show empty state when no players', () => {
    const wrapper = mount(ConsumableTable, {
      props: {
        report: { reportTitle: 'Empty', encounters: [], players: [] }, reportCode: 'TEST1234', fightId: null,
      },
    });

    expect(wrapper.text()).toContain('No consumable usage found');
  });

  it('should display category badges', () => {
    const wrapper = mount(ConsumableTable, {
      props: { report: mockReport, reportCode: 'TEST1234', fightId: null },
    });

    const badges = wrapper.findAll('span.inline-block');
    expect(badges.length).toBeGreaterThan(0);
  });
});

describe('tri-state consumable filter', () => {
  const mockReport: ConsumableReport = {
    reportTitle: 'Karazhan Clear',
    encounters: [
      { id: 1, name: 'Attumen', kill: true, startTime: 0, endTime: 100 },
      { id: 2, name: 'Moroes', kill: true, startTime: 200, endTime: 400 },
    ],
    players: [
      {
        playerName: 'Legolas',
        class: 'Hunter',
        consumables: [
          { name: 'Haste Potion', category: 'potion', spellId: 28507, count: 3, uptimePercent: null },
          { name: 'Flask of Relentless Assault', category: 'flask', spellId: 28520, count: 1, uptimePercent: 95 },
        ],
      },
      {
        playerName: 'Gandalf',
        class: 'Mage',
        consumables: [
          { name: 'Destruction Potion', category: 'potion', spellId: 28508, count: 2, uptimePercent: null },
          { name: 'Flask of Pure Death', category: 'flask', spellId: 28540, count: 1, uptimePercent: 42 },
        ],
      },
    ],
  };

  function mountComponent() {
    return mount(ConsumableTable, {
      props: { report: mockReport, reportCode: 'TEST1234', fightId: null },
    });
  }

  async function expandCategory(wrapper: ReturnType<typeof mount>, categoryLabel: string) {
    const categoryButtons = wrapper.findAll('button');
    const categoryBtn = categoryButtons.find((btn) => btn.text().includes(categoryLabel));
    expect(categoryBtn, `Expected to find category accordion button for "${categoryLabel}"`).toBeDefined();
    await categoryBtn!.trigger('click');
    await nextTick();
  }

  it('include state shows only players who used the consumable', async () => {
    const wrapper = mountComponent();

    // Expand the Potion category accordion
    await expandCategory(wrapper, 'Potion');

    // Click toggle once → state 1 (include): show only players with Haste Potion (28507)
    const toggle = wrapper.find('[data-testid="consumable-toggle-28507"]');
    expect(toggle.exists()).toBe(true);
    await toggle.trigger('click');
    await nextTick();

    const playerHeaders = wrapper.findAll('h3.text-lg');
    expect(playerHeaders).toHaveLength(1);
    expect(playerHeaders[0].text()).toContain('Legolas');
    // Gandalf does not have Haste Potion (28507), so is filtered out
    expect(wrapper.text()).not.toContain('Gandalf');
  });

  it('exclude state shows only players missing the consumable', async () => {
    const wrapper = mountComponent();

    await expandCategory(wrapper, 'Potion');

    const toggle = wrapper.find('[data-testid="consumable-toggle-28507"]');

    // Click once → include (state 1)
    await toggle.trigger('click');
    await nextTick();

    // Click again → exclude (state 2): show only players MISSING Haste Potion (28507)
    await toggle.trigger('click');
    await nextTick();

    const playerHeaders = wrapper.findAll('h3.text-lg');
    expect(playerHeaders).toHaveLength(1);
    // Gandalf does not have Haste Potion (28507), so Gandalf is missing it → shown
    expect(playerHeaders[0].text()).toContain('Gandalf');
    // Legolas has Haste Potion (28507) → not missing → hidden
    expect(wrapper.text()).not.toContain('Legolas');
  });

  it('third click returns to neutral showing all players', async () => {
    const wrapper = mountComponent();

    await expandCategory(wrapper, 'Potion');

    const toggle = wrapper.find('[data-testid="consumable-toggle-28507"]');

    // Click once → include
    await toggle.trigger('click');
    await nextTick();

    // Click twice → exclude
    await toggle.trigger('click');
    await nextTick();

    // Click three times → neutral (state 0): no filter applied
    await toggle.trigger('click');
    await nextTick();

    const playerHeaders = wrapper.findAll('h3.text-lg');
    expect(playerHeaders).toHaveLength(2);
    const texts = playerHeaders.map((h) => h.text());
    expect(texts.some((t) => t.includes('Legolas'))).toBe(true);
    expect(texts.some((t) => t.includes('Gandalf'))).toBe(true);
  });

  it('clear resets both include and exclude filters', async () => {
    const wrapper = mountComponent();

    await expandCategory(wrapper, 'Potion');

    const toggle = wrapper.find('[data-testid="consumable-toggle-28507"]');

    // Click once → include
    await toggle.trigger('click');
    await nextTick();

    // Click again → exclude (state 2)
    await toggle.trigger('click');
    await nextTick();

    // The clear button is conditionally rendered inside the filter section header
    // when selectedSpellIds.size + selectedMissingSpellIds.size > 0
    const clearBtn = wrapper.findAll('button').find((btn) => btn.text() === 'clear');
    expect(clearBtn, 'Expected "clear" button to be visible when filters are active').toBeDefined();
    await clearBtn!.trigger('click');
    await nextTick();

    // Both players should now be visible again
    const playerHeaders = wrapper.findAll('h3.text-lg');
    expect(playerHeaders).toHaveLength(2);
    const texts = playerHeaders.map((h) => h.text());
    expect(texts.some((t) => t.includes('Legolas'))).toBe(true);
    expect(texts.some((t) => t.includes('Gandalf'))).toBe(true);
  });

  it('include + exclude filters on different consumables produce empty state when no player satisfies both', async () => {
    // Flask of Relentless Assault (28520): only Legolas has it
    // Haste Potion (28507): only Legolas has it
    //
    // Setting 28520 to include → only Legolas passes (has flask)
    // Setting 28507 to exclude → keep players MISSING 28507 → only Gandalf passes (Legolas has it)
    //
    // Combined: Legolas passes include but fails exclude; Gandalf fails include → nobody shown
    const wrapper = mountComponent();

    // Set Flask of Relentless Assault (28520) to include (click once)
    await expandCategory(wrapper, 'Flask');
    const flaskToggle = wrapper.find('[data-testid="consumable-toggle-28520"]');
    expect(flaskToggle.exists()).toBe(true);
    await flaskToggle.trigger('click');
    await nextTick();

    // Set Haste Potion (28507) to exclude (click twice)
    await expandCategory(wrapper, 'Potion');
    const potionToggle = wrapper.find('[data-testid="consumable-toggle-28507"]');
    expect(potionToggle.exists()).toBe(true);
    // Click once → include
    await potionToggle.trigger('click');
    await nextTick();
    // Click again → exclude
    await potionToggle.trigger('click');
    await nextTick();

    // No player satisfies both filters simultaneously → empty state
    expect(wrapper.text()).toContain('No consumable usage found');
    expect(wrapper.findAll('h3.text-lg')).toHaveLength(0);
  });
});
