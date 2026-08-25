import type { UserPreferences } from '@/domain/models';

export type CustomerThemeTokens = {
  background: string;
  surface: string;
  text: string;
  secondaryText: string;
  border: string;
  accent: string;
  inverseSurface: string;
  inverseText: string;
  textScale: number;
};

export function getCustomerThemeTokens(preferences: Pick<UserPreferences, 'darkMode' | 'largeText'>): CustomerThemeTokens {
  if (preferences.darkMode) {
    return {
      background: '#171717', surface: '#252525', text: '#FFF', secondaryText: '#D0C8C2',
      border: '#3A3632', accent: '#D9B778', inverseSurface: '#F5F0EA', inverseText: '#171717',
      textScale: preferences.largeText ? 1.15 : 1,
    };
  }
  return {
    background: '#F5F0EA', surface: '#FFF', text: '#171717', secondaryText: '#736C62',
    border: '#E9DED0', accent: '#8A6A3A', inverseSurface: '#171717', inverseText: '#FFF',
    textScale: preferences.largeText ? 1.15 : 1,
  };
}