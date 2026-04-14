import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ReportInput from '../ReportInput.vue';

describe('ReportInput', () => {
  it('should render input and button', () => {
    const wrapper = mount(ReportInput, {
      props: { modelValue: '', loading: false },
    });

    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('button').text()).toBe('Analyze');
  });

  it('should emit update:modelValue on input', async () => {
    const wrapper = mount(ReportInput, {
      props: { modelValue: '', loading: false },
    });

    await wrapper.find('input').setValue('https://www.warcraftlogs.com/reports/ABC123');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      'https://www.warcraftlogs.com/reports/ABC123',
    ]);
  });

  it('should emit submit on form submit', async () => {
    const wrapper = mount(ReportInput, {
      props: { modelValue: 'ABC123', loading: false },
    });

    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toHaveLength(1);
  });

  it('should disable button when loading', () => {
    const wrapper = mount(ReportInput, {
      props: { modelValue: 'ABC123', loading: true },
    });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('button').text()).toBe('Loading...');
  });

  it('should disable button when input is empty', () => {
    const wrapper = mount(ReportInput, {
      props: { modelValue: '', loading: false },
    });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
  });
});
