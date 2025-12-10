import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-toggle-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-switch.html',
  styleUrl: './toggle-switch.sass',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleSwitchComponent),
      multi: true
    }
  ]
})
export class ToggleSwitchComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Output() toggleChange = new EventEmitter<boolean>();

  value: boolean = false;
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: boolean | null | undefined): void {
    // Handle null/undefined values - default to false
    this.value = value === true;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle(event?: Event): void {
    if (this.disabled) return;
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    this.value = !this.value;
    this.onChange(this.value);
    this.onTouched();
    this.toggleChange.emit(this.value);
  }
}

