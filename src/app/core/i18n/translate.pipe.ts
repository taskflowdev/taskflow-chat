import { Pipe, PipeTransform, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { I18nService } from './i18n.service';

/**
 * TranslatePipe - Pipe for translating keys in templates
 * 
 * This pipe is impure to enable automatic updates when:
 * - Language changes
 * - Translations are loaded
 * 
 * Usage in templates:
 * ```html
 * <!-- Simple translation -->
 * <span>{{ 'navbar.settings' | translate }}</span>
 * 
 * <!-- With interpolation -->
 * <span>{{ 'messages.welcome' | translate:{ name: userName } }}</span>
 * 
 * <!-- Nested keys -->
 * <span>{{ 'dialogs.create-group.controls.group-name.label' | translate }}</span>
 * ```
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Impure to detect language changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private value = '';
  private lastKey: string | null = null;
  private lastParams: Record<string, any> | null = null;
  private subscription: Subscription;

  constructor(
    private i18nService: I18nService,
    private cdr: ChangeDetectorRef
  ) {
    // Subscribe to language changes to update translations
    this.subscription = this.i18nService.languageChanged$.subscribe(() => {
      this.updateValue();
      this.cdr.markForCheck();
    });
  }

  /**
   * Transform method called by Angular's pipe framework
   * 
   * @param key Translation key (dot-notation path)
   * @param params Optional interpolation parameters
   * @returns Translated string or the key if not found
   */
  transform(key: string, params?: Record<string, any>): string {
    if (!key) {
      return '';
    }

    // Check if we need to update the value
    if (key !== this.lastKey || !this.paramsEqual(params, this.lastParams)) {
      this.lastKey = key;
      this.lastParams = params || null;
      this.updateValue();
    }

    return this.value;
  }

  /**
   * Update the translated value
   */
  private updateValue(): void {
    if (this.lastKey) {
      this.value = this.i18nService.t(this.lastKey, this.lastParams || undefined);
    }
  }

  /**
   * Compare params objects for equality
   */
  private paramsEqual(a: Record<string, any> | undefined | null, b: Record<string, any> | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => a[key] === b[key]);
  }

  /**
   * Cleanup subscription on destroy
   */
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
