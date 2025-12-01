import { Directive, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { I18nService } from './i18n.service';

/**
 * RtlDirective - Automatically manages RTL/LTR direction and language attributes
 * 
 * This directive:
 * - Updates <html dir="rtl|ltr"> when language changes
 * - Updates <html lang="..."> when language changes
 * - Handles RTL languages: Arabic, Hebrew, Farsi, Urdu, etc.
 * 
 * Usage:
 * Add to your root component (app.component.ts):
 * ```typescript
 * @Component({
 *   selector: 'app-root',
 *   imports: [RtlDirective],
 *   template: '<router-outlet appRtl></router-outlet>'
 * })
 * ```
 * 
 * Or in app.component.html:
 * ```html
 * <div appRtl>
 *   <router-outlet></router-outlet>
 * </div>
 * ```
 */
@Directive({
  selector: '[appRtl]',
  standalone: true
})
export class RtlDirective implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document,
    private i18nService: I18nService
  ) {}

  ngOnInit(): void {
    // Only run in browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Apply initial direction
    this.updateDocumentAttributes(this.i18nService.getLanguage());

    // Subscribe to language changes
    this.subscription = this.i18nService.languageChanged$.subscribe((lang) => {
      this.updateDocumentAttributes(lang);
    });
  }

  /**
   * Update the HTML element's dir and lang attributes
   */
  private updateDocumentAttributes(lang: string): void {
    const htmlElement = this.document.documentElement;
    
    if (!htmlElement) {
      return;
    }

    // Set language attribute
    htmlElement.setAttribute('lang', lang);

    // Set direction attribute
    const direction = this.i18nService.getDirectionForLanguage(lang);
    htmlElement.setAttribute('dir', direction);

    // Log for debugging
    console.log(`I18n: Updated document attributes - lang="${lang}", dir="${direction}"`);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
