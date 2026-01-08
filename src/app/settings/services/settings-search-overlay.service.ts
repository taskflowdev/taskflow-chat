import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service to manage the settings search overlay state
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsSearchOverlayService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);

  /** Observable for overlay open state */
  public isOpen$: Observable<boolean> = this.isOpenSubject.asObservable();

  /**
   * Open the search overlay
   */
  open(): void {
    this.isOpenSubject.next(true);
  }

  /**
   * Close the search overlay
   */
  close(): void {
    this.isOpenSubject.next(false);
  }

  /**
   * Toggle the search overlay
   */
  toggle(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  /**
   * Get current open state
   */
  isOpen(): boolean {
    return this.isOpenSubject.value;
  }
}
