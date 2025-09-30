/**
 * Theme models that bridge API DTOs with UI components
 */

import { DynamicThemeDto, DynamicThemeVariantDto, DynamicUserThemeDto, EffectiveThemeDto } from '../../api/models';

/**
 * Theme mode enum
 */
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

/**
 * Theme variant for UI
 */
export interface ThemeVariant {
  id: string;
  name: string;
  isDefault: boolean;
  themeId: string;
  themeMode: 'light' | 'dark';
  tokens: Record<string, string>;
  accentColors: {
    primary: string;
    secondary: string;
  };
}

/**
 * Theme for UI
 */
export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  isBuiltIn: boolean;
  tokens: Record<string, string>;
  variants: ThemeVariant[];
}

/**
 * User theme preferences
 */
export interface UserThemePreference {
  lightThemeId: string;
  lightThemeVariantId: string;
  darkThemeId: string;
  darkThemeVariantId: string;
  syncWithSystem: boolean;
  currentMode: ThemeMode;
}

/**
 * Effective theme that's currently applied
 */
export interface EffectiveTheme {
  name: string;
  themeId: string;
  variantId: string;
  variantName: string;
  themeType: string;
  tokens: Record<string, string>;
}

/**
 * Helper functions to convert API DTOs to UI models
 */
export class ThemeMapper {
  /**
   * Convert API DynamicThemeDto to UI Theme model
   */
  static toTheme(dto: DynamicThemeDto): Theme {
    return {
      id: dto.id || '',
      name: dto.name || '',
      mode: (dto.themeType?.toLowerCase() === 'dark' ? 'dark' : 'light') as 'light' | 'dark',
      isBuiltIn: dto.isBuiltIn || false,
      tokens: dto.tokens || {},
      variants: (dto.variants || []).map(v => this.toThemeVariant(v, dto.id || '', dto.themeType?.toLowerCase() as 'light' | 'dark'))
    };
  }

  /**
   * Convert API DynamicThemeVariantDto to UI ThemeVariant model
   */
  static toThemeVariant(dto: DynamicThemeVariantDto, themeId: string, themeMode: 'light' | 'dark'): ThemeVariant {
    const tokens = dto.tokens || {};
    
    return {
      id: dto.id || '',
      name: dto.name || '',
      isDefault: dto.isDefault || false,
      themeId,
      themeMode,
      tokens,
      accentColors: {
        primary: tokens['AccentPrimary'] || tokens['ButtonPrimary'] || (themeMode === 'light' ? '#0d6efd' : '#0a58ca'),
        secondary: tokens['AccentSecondary'] || tokens['ButtonSecondary'] || (themeMode === 'light' ? '#6c757d' : '#5a6268')
      }
    };
  }

  /**
   * Convert API DynamicUserThemeDto to UI UserThemePreference
   */
  static toUserThemePreference(dto: DynamicUserThemeDto): UserThemePreference {
    return {
      lightThemeId: dto.lightThemeId || '',
      lightThemeVariantId: dto.lightVariantId || '',
      darkThemeId: dto.darkThemeId || '',
      darkThemeVariantId: dto.darkVariantId || '',
      syncWithSystem: dto.syncWithSystem || false,
      currentMode: dto.syncWithSystem ? ThemeMode.SYSTEM : ThemeMode.LIGHT
    };
  }

  /**
   * Convert API EffectiveThemeDto to UI EffectiveTheme
   */
  static toEffectiveTheme(dto: EffectiveThemeDto): EffectiveTheme {
    return {
      name: dto.name || '',
      themeId: dto.themeId || '',
      variantId: dto.variantId || '',
      variantName: dto.variantName || '',
      themeType: dto.themeType || '',
      tokens: dto.tokens || {}
    };
  }

  /**
   * Merge base theme tokens with variant tokens
   */
  static mergeThemeTokens(baseTokens: Record<string, string>, variantTokens: Record<string, string>): Record<string, string> {
    return { ...baseTokens, ...variantTokens };
  }
}
