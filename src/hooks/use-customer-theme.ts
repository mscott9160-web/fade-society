import { useAppStore } from '@/state/app-store';
import { getCustomerThemeTokens } from '@/theme/customer-theme-tokens';
export { getCustomerThemeTokens } from '@/theme/customer-theme-tokens';

export function useCustomerTheme() {
  return getCustomerThemeTokens(useAppStore().preferences);
}