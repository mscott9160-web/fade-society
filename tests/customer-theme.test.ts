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
});