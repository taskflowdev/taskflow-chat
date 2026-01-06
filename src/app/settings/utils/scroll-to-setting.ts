/**
 * Utility functions for scrolling to and highlighting settings
 */

/**
 * Scroll to a setting element by its data-setting-key attribute
 * Applies smooth scroll and temporary highlight animation
 * 
 * @param settingKey The full setting key (e.g., 'appearance.theme')
 * @param options Configuration options
 * @returns Promise that resolves when scroll is complete
 */
export async function scrollToSetting(
  settingKey: string,
  options: {
    /** Duration of highlight animation in ms (default: 2000) */
    highlightDuration?: number;
    /** Behavior for scroll (default: 'smooth') */
    behavior?: ScrollBehavior;
    /** Block alignment for scroll (default: 'center') */
    block?: ScrollLogicalPosition;
    /** Whether to focus the control after scroll (default: true) */
    focusControl?: boolean;
    /** Whether to update URL hash (default: false) */
    updateHash?: boolean;
  } = {}
): Promise<void> {
  const {
    highlightDuration = 2000,
    behavior = 'smooth',
    block = 'center',
    focusControl = true,
    updateHash = false
  } = options;

  // Find the setting element
  const settingElement = document.querySelector(`[data-setting-key="${settingKey}"]`);

  if (!settingElement) {
    console.warn(`Setting element not found: ${settingKey}`);
    return;
  }

  // Scroll to the element
  settingElement.scrollIntoView({
    behavior,
    block,
    inline: 'nearest'
  });

  // Apply highlight animation
  applyHighlight(settingElement as HTMLElement, highlightDuration);

  // Focus the control if requested
  if (focusControl) {
    // Wait for scroll to complete (approximate)
    await new Promise(resolve => setTimeout(resolve, behavior === 'smooth' ? 500 : 0));
    focusSettingControl(settingElement as HTMLElement);
  }

  // Update URL hash if requested
  if (updateHash) {
    window.history.replaceState(null, '', `#${settingKey}`);
  }
}

/**
 * Apply a temporary highlight animation to an element
 */
function applyHighlight(element: HTMLElement, duration: number): void {
  // Add highlight class
  element.classList.add('setting-highlight-animation');

  // Remove after duration
  setTimeout(() => {
    element.classList.remove('setting-highlight-animation');
  }, duration);
}

/**
 * Focus the interactive control within a setting element
 * Tries to find the first focusable element (input, select, button, etc.)
 */
function focusSettingControl(settingElement: HTMLElement): void {
  // Find focusable elements within the setting
  const focusableSelectors = [
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    'a[href]'
  ];

  const focusableElement = settingElement.querySelector<HTMLElement>(
    focusableSelectors.join(', ')
  );

  if (focusableElement) {
    focusableElement.focus();
  }
}

/**
 * Parse setting key from URL hash
 * Returns null if hash is not a valid setting key format
 */
export function getSettingKeyFromHash(): string | null {
  const hash = window.location.hash.slice(1); // Remove #
  
  if (!hash) {
    return null;
  }

  // Validate format: category.key (e.g., 'appearance.theme')
  const settingKeyPattern = /^[a-z0-9]+\.[a-z0-9.]+$/i;
  
  if (settingKeyPattern.test(hash)) {
    return hash;
  }

  return null;
}

/**
 * Scroll to setting on page load if hash is present
 * Should be called after settings are rendered
 */
export function scrollToSettingFromHash(delay: number = 500): void {
  const settingKey = getSettingKeyFromHash();
  
  if (settingKey) {
    // Wait for DOM to be ready and for smooth scroll
    setTimeout(() => {
      scrollToSetting(settingKey, {
        behavior: 'smooth',
        block: 'center',
        focusControl: true,
        updateHash: false // Already in URL
      });
    }, delay);
  }
}
