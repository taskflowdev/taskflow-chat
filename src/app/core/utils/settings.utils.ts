/**
 * Theme and Settings Utilities
 * 
 * Reusable helper functions for theme and settings management
 */

/**
 * Convert camelCase string to kebab-case
 * Example: 'backgroundColor' -> 'background-color'
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case string to camelCase
 * Example: 'background-color' -> 'backgroundColor'
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Safely merge two objects, with source overriding target
 * Performs deep merge for nested objects
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  if (!source) return target;
  if (!target) return source as T;

  const result = { ...target };

  Object.keys(source).forEach(key => {
    const sourceValue = (source as any)[key];
    const targetValue = (result as any)[key];

    if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      (result as any)[key] = deepMerge(targetValue || {}, sourceValue);
    } else {
      (result as any)[key] = sourceValue;
    }
  });

  return result;
}

/**
 * Generate CSS variables string from object
 * @param tokens Object with key-value pairs for CSS variables
 * @param prefix Prefix for CSS variable names (default: 'taskflow')
 * @returns String of CSS variable declarations
 */
export function generateCSSVariables(
  tokens: Record<string, string>,
  prefix: string = 'taskflow'
): string {
  const variables: string[] = [];

  Object.entries(tokens).forEach(([key, value]) => {
    const kebabKey = camelToKebab(key);
    variables.push(`  --${prefix}-${kebabKey}: ${value};`);
  });

  return variables.join('\n');
}

/**
 * Inject CSS variables into a style element
 * @param styleElement The style element to inject into
 * @param cssVariables The CSS variables string
 */
export function injectCSSVariables(
  styleElement: HTMLStyleElement,
  cssVariables: string
): void {
  styleElement.textContent = `:root {\n${cssVariables}\n}`;
}

/**
 * Create a versioned storage key
 * @param baseKey Base key name
 * @param version Version number
 * @returns Versioned key string
 */
export function versionedKey(baseKey: string, version: number = 1): string {
  return `${baseKey}_v${version}`;
}

/**
 * Check if a value is a valid JSON string
 */
export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a debounced function
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get the current timestamp in milliseconds
 */
export function now(): number {
  return Date.now();
}

/**
 * Check if cached data is still fresh
 * @param timestamp Cached timestamp
 * @param maxAge Maximum age in milliseconds
 * @returns True if cache is still fresh
 */
export function isCacheFresh(timestamp: number, maxAge: number): boolean {
  return now() - timestamp < maxAge;
}
