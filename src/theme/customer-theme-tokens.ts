import type { UserPreferences } from '@/domain/models';
import type { BookingStatusTone } from '@/domain/booking-status';

export type CustomerThemeTokens = {
  background: string;
  surface: string;
  text: string;
  secondaryText: string;
  border: string;
  accent: string;
  inverseSurface: string;
  inverseText: string;
  statusColors: Record<BookingStatusTone, string>;
  textScale: number;
};

export function getCustomerThemeTokens(preferences: Pick<UserPreferences, 'darkMode' | 'largeText'>): CustomerThemeTokens {
  if (preferences.darkMode) {
    return {
      background: '#171717', surface: '#252525', text: '#FFF', secondaryText: '#D0C8C2',
      border: '#3A3632', accent: '#D9B778', inverseSurface: '#F5F0EA', inverseText: '#171717',
      statusColors: { positive: '#70D19A', informative: '#83B8E8', warning: '#F0B866', negative: '#F28B82', neutral: '#D0C8C2' },
      textScale: preferences.largeText ? 1.15 : 1,
    };
  }
  return {
    background: '#F5F0EA', surface: '#FFF', text: '#171717', secondaryText: '#736C62',
    border: '#E9DED0', accent: '#8A6A3A', inverseSurface: '#171717', inverseText: '#FFF',
    statusColors: { positive: '#1E7A4B', informative: '#2D6A9F', warning: '#A15C16', negative: '#B93A2F', neutral: '#736C62' },
    textScale: preferences.largeText ? 1.15 : 1,
  };
}