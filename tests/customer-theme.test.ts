import { describe, expect, it } from 'vitest';
import { getCustomerThemeTokens } from '../src/theme/customer-theme-tokens';

describe('customer theme tokens', () => {
  it('selects contrasting light and dark surfaces', () => {
    expect(getCustomerThemeTokens({ darkMode: false, largeText: false }).background).toBe('#F5F0EA');
    expect(getCustomerThemeTokens({ darkMode: true, largeText: false }).background).toBe('#171717');
  });

  it('scales text only when larger text is enabled', () => {
    expect(getCustomerThemeTokens({ darkMode: false, largeText: false }).textScale).toBe(1);
    expect(getCustomerThemeTokens({ darkMode: false, largeText: true }).textScale).toBe(1.15);
  });

  it('maps every status tone to semantic colors in each theme', () => {
    expect(getCustomerThemeTokens({ darkMode: false, largeText: false }).statusColors).toEqual({ positive: '#1E7A4B', informative: '#2D6A9F', warning: '#A15C16', negative: '#B93A2F', neutral: '#736C62' });
    expect(getCustomerThemeTokens({ darkMode: true, largeText: false }).statusColors).toEqual({ positive: '#70D19A', informative: '#83B8E8', warning: '#F0B866', negative: '#F28B82', neutral: '#D0C8C2' });
  });
});