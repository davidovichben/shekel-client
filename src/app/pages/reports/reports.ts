import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent } from '../../shared/components/custom-select/custom-select';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker';
import { DraggableListComponent, DraggableItem } from '../../shared/components/draggable-list/draggable-list';
import { MemberAutocompleteComponent } from '../../shared/components/member-autocomplete/member-autocomplete';
import { ReportService } from '../../core/services/network/report.service';
import {
  ReportCategory,
  ReportType,
  ReportConfigResponse,
  GenerateReportRequest,
  ReportErrorResponse
} from '../../core/entities/report.entity';

export interface ColumnOption {
  id: string;
  label: string;
  required: boolean; // If true, shows lock icon and cannot be removed
  selected: boolean; // If true, appears in selected columns list
}

export interface ReportConfig {
  reportName: string;
  dateFrom: string | null;
  dateTo: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, string>;
  resultLimit: string;
  columns: string[];
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, DatePickerComponent, DraggableListComponent, MemberAutocompleteComponent],
  templateUrl: './reports.html',
  styleUrl: './reports.sass'
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);

  selectedReportType: string | null = null;
  reportCategories: ReportCategory[] = [];
  
  isLoadingCategories = false;
  isLoadingConfig = false;
  isGeneratingReport = false;
  isExporting = false;
  error: string | null = null;

  reportConfig: ReportConfig = {
    reportName: '',
    dateFrom: null,
    dateTo: null,
    sortBy: '',
    sortOrder: 'desc',
    filters: {},
    resultLimit: 'unlimited',
    columns: []
  };

  selectedColumns: ColumnOption[] = [];
  availableColumns: ColumnOption[] = [];

  sortOptions: { value: string; label: string }[] = [];
  filterOptions: { value: string; label: string }[] = [];
  currentConfig: ReportConfigResponse | null = null;
  
  selectedMemberName: string = '';
  selectedMemberId: string | null = null;
  resultLimitOptions = [
    { value: 'unlimited', label: 'ללא הגבלה' },
    { value: '10', label: '10' },
    { value: '25', label: '25' },
    { value: '50', label: '50' },
    { value: '100', label: '100' }
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.isLoadingCategories = true;
    this.error = null;
    
    this.reportService.getCategories().subscribe({
      next: (response) => {
        this.reportCategories = response.categories;
        this.isLoadingCategories = false;
        
        // Select first report by default
        if (this.reportCategories.length > 0 && this.reportCategories[0].reports.length > 0) {
          this.selectReportType(this.reportCategories[0].reports[0].id);
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.error = 'שגיאה בטעינת קטגוריות הדוחות. נסה שוב מאוחר יותר.';
        this.isLoadingCategories = false;
      }
    });
  }

  selectReportType(reportTypeId: string): void {
    this.selectedReportType = reportTypeId;
    this.error = null;
    this.isLoadingConfig = true;
    
    const reportType = this.findReportType(reportTypeId);
    if (!reportType) {
      this.error = 'סוג דוח לא נמצא';
      this.isLoadingConfig = false;
      return;
    }

    // Set report name from menu label
    this.reportConfig.reportName = reportType.label;

    this.reportService.getConfig(reportTypeId).subscribe({
      next: (config) => {
        this.currentConfig = config;
        this.initializeColumns(config);
        this.initializeSortAndFilters(config);
        this.isLoadingConfig = false;
      },
      error: (error) => {
        console.error('Error loading config:', error);
        this.handleApiError(error);
        this.isLoadingConfig = false;
      }
    });
  }

  private findReportType(reportTypeId: string): ReportType | null {
    for (const category of this.reportCategories) {
      const report = category.reports.find(r => r.id === reportTypeId);
      if (report) return report;
    }
    return null;
  }

  private initializeColumns(config: ReportConfigResponse): void {
    // Map API columns to ColumnOption format
    // Initially, all columns are selected (in the report)
    const allColumns: ColumnOption[] = config.columns.map(col => ({
      id: col.id,
      label: col.label,
      required: col.required,
      selected: true // All columns start as selected
    }));

    this.selectedColumns = [...allColumns];
    this.availableColumns = [];
  }

  private initializeSortAndFilters(config: ReportConfigResponse): void {
    // Use sort options from API
    this.sortOptions = config.sortOptions.map(opt => ({
      value: opt.value,
      label: opt.label
    }));

    // Handle report-specific filter logic
    let filtersToShow = config.filters;
    
    // Remove income_type filter for community/external donation reports
    // and set the filter value automatically
    if (this.selectedReportType === 'donations_community' || this.selectedReportType === 'donations_external') {
      // Filter out income_type, income_category, category, or any similar filter keys
      filtersToShow = config.filters.filter(filter => {
        const key = filter.key.toLowerCase();
        return key !== 'income_type' && key !== 'income_category' && key !== 'category' && key !== 'type';
      });
      
      // Set the income_type filter value automatically based on report type
      if (this.selectedReportType === 'donations_community') {
        this.reportConfig.filters['income_type'] = 'community_donations';
        // Also try alternative keys
        this.reportConfig.filters['income_category'] = 'community_donations';
        this.reportConfig.filters['category'] = 'community_donations';
      } else if (this.selectedReportType === 'donations_external') {
        this.reportConfig.filters['income_type'] = 'external_donations';
        // Also try alternative keys
        this.reportConfig.filters['income_category'] = 'external_donations';
        this.reportConfig.filters['category'] = 'external_donations';
      }
    }

    // Use filtered filters from API
    this.filterOptions = filtersToShow.map(filter => ({
      value: filter.key,
      label: filter.label
    }));

    // Initialize filter values
    config.filters.forEach(filter => {
      // Only initialize if not already set (for community/external donations)
      if (!this.reportConfig.filters.hasOwnProperty(filter.key)) {
        this.reportConfig.filters[filter.key] = '';
      }
    });

    // Set default dates for monthly reports
    if (this.selectedReportType === 'income_monthly' || this.selectedReportType === 'expenses_monthly') {
      const { firstDay, lastDay } = this.getCurrentMonthDates();
      this.reportConfig.dateFrom = firstDay;
      this.reportConfig.dateTo = lastDay;
    } else if (this.isMemberReport()) {
      // Member reports don't use date ranges - set to null
      this.reportConfig.dateFrom = null;
      this.reportConfig.dateTo = null;
    } else {
      // Reset dates for other reports
      this.reportConfig.dateFrom = null;
      this.reportConfig.dateTo = null;
    }

    // Set default sort if available
    if (this.sortOptions.length > 0 && !this.reportConfig.sortBy) {
      this.reportConfig.sortBy = this.sortOptions[0].value;
    }
  }

  private getCurrentMonthDates(): { firstDay: string; lastDay: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // First day of current month
    const firstDay = new Date(year, month, 1);
    const firstDayStr = firstDay.toISOString().split('T')[0];
    
    // Last day of current month
    const lastDay = new Date(year, month + 1, 0);
    const lastDayStr = lastDay.toISOString().split('T')[0];
    
    return { firstDay: firstDayStr, lastDay: lastDayStr };
  }

  getFilterOptions(filterKey: string): { value: string; label: string }[] {
    if (!this.currentConfig) return [];
    
    // Find the filter from the current config
    const filter = this.currentConfig.filters.find(f => f.key === filterKey);
    if (!filter) return [];

    // Return the filter options
    return filter.options.map(opt => ({
      value: opt.value,
      label: opt.label
    }));
  }

  removeColumn(columnId: string): void {
    const column = this.selectedColumns.find(c => c.id === columnId);
    if (column !== undefined && !column.required) {
      column.selected = false;
      this.selectedColumns = this.selectedColumns.filter(c => c.id !== columnId);
      this.availableColumns.push(column);
    }
  }

  addColumn(columnId: string): void {
    const column = this.availableColumns.find(c => c.id === columnId);
    if (column !== undefined) {
      column.selected = true;
      this.availableColumns = this.availableColumns.filter(c => c.id !== columnId);
      this.selectedColumns.push(column);
    }
  }

  getDraggableColumns(): DraggableItem[] {
    return this.selectedColumns.map(c => ({
      id: c.id,
      label: c.label,
      required: c.required
    }));
  }

  reorderColumns(newOrder: DraggableItem[]): void {
    // Map the draggable items back to ColumnOption objects
    const reordered: ColumnOption[] = [];
    for (const item of newOrder) {
      const column = this.selectedColumns.find(c => c.id === item.id);
      if (column !== undefined) {
        reordered.push(column);
      }
    }
    this.selectedColumns = reordered;
  }

  onDateFromChange(date: string): void {
    this.reportConfig.dateFrom = date;
  }

  onDateToChange(date: string): void {
    this.reportConfig.dateTo = date;
  }

  onSortChange(value: string): void {
    this.reportConfig.sortBy = value;
  }

  onFilterChange(key: string, value: string): void {
    this.reportConfig.filters[key] = value;
  }

  onResultLimitChange(value: string): void {
    this.reportConfig.resultLimit = value;
  }

  onMemberSelected(member: { id: string; fullName: string } | null): void {
    if (member) {
      this.selectedMemberId = member.id;
      this.selectedMemberName = member.fullName;
      this.reportConfig.filters['member_id'] = member.id;
    } else {
      this.selectedMemberId = null;
      this.selectedMemberName = '';
      delete this.reportConfig.filters['member_id'];
    }
  }

  isDebtsByDebtorReport(): boolean {
    return this.selectedReportType === 'debts_by_debtor';
  }

  isMemberReport(): boolean {
    return this.selectedReportType === 'members_active' ||
           this.selectedReportType === 'members_recent' ||
           this.selectedReportType === 'members_no_donation' ||
           this.selectedReportType === 'members_no_auto_payment';
  }

  generateReport(): void {
    if (!this.selectedReportType) return;

    // Validate required columns are included
    const requiredColumns = this.selectedColumns.filter(c => c.required).map(c => c.id);
    const selectedColumnIds = this.selectedColumns.map(c => c.id);
    const missingRequired = requiredColumns.filter(id => !selectedColumnIds.includes(id));
    
    if (missingRequired.length > 0) {
      this.error = `עמודות חובה חסרות: ${missingRequired.join(', ')}`;
      return;
    }

    this.isGeneratingReport = true;
    this.error = null;

    const request: GenerateReportRequest = {
      dateFrom: this.reportConfig.dateFrom,
      dateTo: this.reportConfig.dateTo,
      sortBy: this.reportConfig.sortBy,
      sortOrder: this.reportConfig.sortOrder,
      filters: this.reportConfig.filters,
      resultLimit: this.reportConfig.resultLimit,
      columns: this.selectedColumns.map(c => c.id).reverse()
    };

    this.reportService.generateReport(this.selectedReportType, request).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, 'application/pdf', `report_${this.selectedReportType}.pdf`);
        this.isGeneratingReport = false;
      },
      error: (error) => {
        console.error('Error generating report:', error);
        this.handleApiError(error);
        this.isGeneratingReport = false;
      }
    });
  }

  exportToHashavshevet(): void {
    if (!this.selectedReportType) return;

    // Validate required columns are included
    const requiredColumns = this.selectedColumns.filter(c => c.required).map(c => c.id);
    const selectedColumnIds = this.selectedColumns.map(c => c.id);
    const missingRequired = requiredColumns.filter(id => !selectedColumnIds.includes(id));
    
    if (missingRequired.length > 0) {
      this.error = `עמודות חובה חסרות: ${missingRequired.join(', ')}`;
      return;
    }

    this.isExporting = true;
    this.error = null;

    const request: GenerateReportRequest = {
      dateFrom: this.reportConfig.dateFrom,
      dateTo: this.reportConfig.dateTo,
      sortBy: this.reportConfig.sortBy,
      sortOrder: this.reportConfig.sortOrder,
      filters: this.reportConfig.filters,
      resultLimit: this.reportConfig.resultLimit,
      columns: this.selectedColumns.map(c => c.id).reverse()
    };

    this.reportService.exportToHashavshevet(this.selectedReportType, request).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, 'text/csv', `export_${this.selectedReportType}.csv`);
        this.isExporting = false;
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.handleApiError(error);
        this.isExporting = false;
      }
    });
  }

  private downloadBlob(blob: Blob, contentType: string, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private handleApiError(error: any): void {
    if (error.error instanceof Blob) {
      // Try to parse error response as JSON
      error.error.text().then((text: string) => {
        try {
          const errorData: ReportErrorResponse = JSON.parse(text);
          this.error = errorData.message || errorData.error || 'שגיאה בעת ביצוע הפעולה';
        } catch {
          this.error = 'שגיאה בעת ביצוע הפעולה';
        }
      });
    } else if (error.error) {
      const errorData: ReportErrorResponse = error.error;
      if (errorData.missingColumns && errorData.missingColumns.length > 0) {
        this.error = `עמודות חובה חסרות: ${errorData.missingColumns.join(', ')}`;
      } else {
        this.error = errorData.message || errorData.error || 'שגיאה בעת ביצוע הפעולה';
      }
    } else {
      this.error = 'שגיאה בעת ביצוע הפעולה';
    }
  }
}

