import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { convertToHebrewDate } from '../../../core/utils/hebrew-date.util';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.sass'
})
export class DatePickerComponent implements OnInit, OnChanges {
  @Input() value: string | null = null;
  @Input() placeholder: string = '';
  @Output() valueChange = new EventEmitter<string>();

  internalValue: string = '';
  displayValue: string = '';
  hebrewDate: string = '';
  inputId: string = '';

  ngOnInit(): void {
    this.updateDisplay();
    // Generate unique ID for this date picker instance
    this.inputId = `date-input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.updateDisplay();
    }
  }

  private updateDisplay(): void {
    if (this.value) {
      // Convert YYYY-MM-DD to DD/MM/YYYY for display
      const date = new Date(this.value);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        this.displayValue = `${day}/${month}/${year}`;
        this.hebrewDate = convertToHebrewDate(this.displayValue);
        this.internalValue = this.value;
      } else {
        this.displayValue = this.value;
        this.hebrewDate = convertToHebrewDate(this.value);
        this.internalValue = this.value;
      }
    } else {
      this.displayValue = '';
      this.hebrewDate = '';
      this.internalValue = '';
    }
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const dateValue = input.value;
    
    if (dateValue) {
      this.internalValue = dateValue;
      // Convert YYYY-MM-DD to DD/MM/YYYY for display
      const date = new Date(dateValue);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      this.displayValue = `${day}/${month}/${year}`;
      this.hebrewDate = convertToHebrewDate(this.displayValue);
      this.valueChange.emit(dateValue);
    } else {
      this.internalValue = '';
      this.displayValue = '';
      this.hebrewDate = '';
      this.valueChange.emit('');
    }
  }

  openDatePicker(): void {
    const input = document.getElementById(this.inputId) as HTMLInputElement;
    if (input) {
      if (input.showPicker) {
        input.showPicker();
      } else {
        input.click();
      }
    }
  }
}

