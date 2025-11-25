import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class RedirectUrlService {

    constructor(private router: Router) { }

    /**
     * Navigates to the login page with the redirect query parameter.
     * Uses navigateByUrl to preserve slash readability (avoids %2F).
     * @param returnUrl The URL to redirect back to after login.
     */
    navigateToLogin(returnUrl: string): void {
        // Manually construct the URL to keep it readable
        this.router.navigateByUrl(`/auth/login?redirect=${returnUrl}`);
    }

    /**
     * Redirects the user after a successful login.
     * Checks for a redirect in the query parameters.
     * If present, navigates to it. Otherwise, navigates to the default URL.
     * @param route The current ActivatedRoute to read query params from.
     * @param defaultUrl The default URL to navigate to if no redirect is present.
     */
    redirectAfterLogin(route: ActivatedRoute, defaultUrl: string): void {
        const redirectUrl = route.snapshot.queryParams['redirect'];
        if (redirectUrl) {
            this.router.navigateByUrl(redirectUrl);
        } else {
            this.router.navigate([defaultUrl], { replaceUrl: true });
        }
    }
}
