import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.html',
  styleUrl: './data-table.sass'
})
export class DataTableComponent {
  @Input() isLoading = false;
  @Input() columns: { key: string; label: string; class?: string }[] = [];
  @Input() data: any[] = [];
  @Input() totalItems = 0;
  @Input() currentPage = 1;
  @Input() itemsPerPage = 10;
  @Input() totalPages = 1;
  @Input() showCheckbox = true;
  @Input() showRowNumber = true;
  @Input() allSelected = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() selectAll = new EventEmitter<boolean>();

  onSelectAllChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectAll.emit(checked);
  }

  get colSpan(): number {
    let span = this.columns.length;
    if (this.showCheckbox) span++;
    if (this.showRowNumber) span++;
    return span;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageChange.emit(page);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
