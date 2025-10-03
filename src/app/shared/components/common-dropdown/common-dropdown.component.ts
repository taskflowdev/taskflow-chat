import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: string;
  divider?: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-common-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './common-dropdown.component.html',
  styleUrls: ['./common-dropdown.component.scss']
})
export class CommonDropdownComponent {
  @Input() items: DropdownItem[] = [];
  @Input() buttonIcon: string = 'bi-three-dots-vertical';
  @Input() buttonClass: string = 'action-btn';
  @Input() buttonTitle: string = 'More options';
  @Output() itemSelected = new EventEmitter<string>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  onItemClick(item: DropdownItem, event: Event): void {
    event.stopPropagation();
    if (!item.disabled && !item.divider) {
      this.isOpen = false;
      this.itemSelected.emit(item.id);
    }
  }

  trackByItemId(index: number, item: DropdownItem): string {
    return item.id;
  }
}
