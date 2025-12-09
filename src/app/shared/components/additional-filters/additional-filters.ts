import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent, SelectOption } from '../custom-select/custom-select';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select';
  placeholder?: string;
  options?: SelectOption[];
  value?: string;
}

export interface Tab {
  id: string;
  label: string;
  count: number | null;
}

@Component({
  selector: 'app-additional-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './additional-filters.html',
  styleUrl: './additional-filters.sass'
})
export class AdditionalFiltersComponent implements OnInit {
  @Input() fields: FilterField[] = [];
  @Input() tabs: Tab[] = [];
  @Input() activeTab: string = '';
  @Output() saveFilters = new EventEmitter<Record<string, string>>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() tabClick = new EventEmitter<string>();

  showFilters = false;
  filterValues: Record<string, string> = {};

  get hasFilters(): boolean {
    return this.fields && this.fields.length > 0;
  }

  ngOnInit(): void {
    // Initialize filter values from fields
    if (this.fields) {
      this.fields.forEach(field => {
        this.filterValues[field.key] = field.value || '';
      });
    }
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onSave(): void {
    this.saveFilters.emit(this.filterValues);
  }

  onClear(): void {
    this.fields.forEach(field => {
      this.filterValues[field.key] = '';
    });
    this.clearFilters.emit();
  }

  areFiltersEmpty(): boolean {
    return Object.values(this.filterValues).every(value => !value || value === '');
  }

  updateFilterValue(key: string, value: string): void {
    this.filterValues[key] = value;
  }

  onTabClick(tabId: string): void {
    this.tabClick.emit(tabId);
  }
}

