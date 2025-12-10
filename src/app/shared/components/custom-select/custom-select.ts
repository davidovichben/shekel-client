import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnChanges, SimpleChanges, OnInit } from '@angular/core';
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
export class CustomSelectComponent implements OnChanges, OnInit {
  @Input() options: SelectOption[] = [];
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() prefix: string = '';
  @Input() disabled: boolean = false;
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;
  internalValue: string = '';

  constructor(private elementRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.internalValue = this.value;
    }
    if (changes['options'] && this.value) {
      // Ensure internalValue is set when options are loaded
      this.internalValue = this.value;
    }
  }

  ngOnInit(): void {
    this.internalValue = this.value;
  }

  get selectedLabel(): string {
    // Use the value directly, as it's bound via [(value)]
    const currentValue = this.value;
    if (!currentValue) return this.placeholder;
    const option = this.options.find(o => o.value === currentValue);
    return option?.label || this.placeholder;
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  select(option: SelectOption): void {
    this.internalValue = option.value;
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
