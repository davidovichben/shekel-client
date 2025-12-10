import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.sass'
})
export class CustomSelectComponent {
  @Input() options: SelectOption[] = [];
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() prefix: string = '';
  @Input() disabled: boolean = false;
  @Input() sortOrder: 'asc' | 'desc' | null = null;
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  get selectedLabel(): string {
    return this.options.find(o => o.value === this.value)?.label || this.placeholder;
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  select(option: SelectOption): void {
    this.value = option.value;
    this.valueChange.emit(option.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
