import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnChanges, SimpleChanges, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
export class CustomSelectComponent implements OnChanges, OnInit, AfterViewInit {
  @Input() options: SelectOption[] = [];
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() prefix: string = '';
  @Input() disabled: boolean = false;
  @Input() sortOrder: 'asc' | 'desc' | null = null;
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('selectMenu', { static: false }) selectMenu?: ElementRef<HTMLDivElement>;

  isOpen = false;
  internalValue: string = '';
  menuStyle: { top?: string; bottom?: string; right?: string; width?: string } = {};

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

  ngAfterViewInit(): void {
    // Position menu when opened
  }

  get selectedLabel(): string {
    // Use the value directly, as it's bound via [(value)]
    const currentValue = this.value;
    const option = this.options.find(o => o.value === currentValue);
    if (option) return option.label;
    if (!currentValue) return this.placeholder;
    return this.placeholder;
  }

  toggle(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.updateMenuPosition(), 0);
    }
  }

  private updateMenuPosition(): void {
    const trigger = this.elementRef.nativeElement.querySelector('.select-trigger') as HTMLElement;
    if (!trigger || !this.selectMenu?.nativeElement) return;

    const rect = trigger.getBoundingClientRect();
    const menu = this.selectMenu.nativeElement;
    const menuHeight = Math.min(menu.scrollHeight, 200); // max-height is 200px
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Check if menu would overflow below, and if there's more space above
    const shouldOpenUpward = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    
    if (shouldOpenUpward) {
      // Position above the trigger
      this.menuStyle = {
        bottom: `${window.innerHeight - rect.top + 4}px`,
        right: `${window.innerWidth - rect.right}px`,
        width: `${rect.width}px`
      };
      // Remove top if it was set
      delete this.menuStyle.top;
    } else {
      // Position below the trigger (default)
      this.menuStyle = {
        top: `${rect.bottom + 4}px`,
        right: `${window.innerWidth - rect.right}px`,
        width: `${rect.width}px`
      };
      // Remove bottom if it was set
      delete this.menuStyle.bottom;
    }
  }

  select(option: SelectOption): void {
    this.internalValue = option.value;
    this.value = option.value;
    this.valueChange.emit(option.value);
    this.isOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    const trigger = this.elementRef.nativeElement.querySelector('.select-trigger');
    const menu = this.selectMenu?.nativeElement;
    
    if (trigger && menu) {
      if (!trigger.contains(target) && !menu.contains(target)) {
        this.isOpen = false;
      }
    } else if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen = false;
    }
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (this.isOpen) {
      this.updateMenuPosition();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isOpen) {
      this.updateMenuPosition();
    }
  }
}
