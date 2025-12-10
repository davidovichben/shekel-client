import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ExportDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  cancelDisabled?: boolean;
}

export interface ExportDialogResult {
  exportAll: boolean;
  fileType: string;
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="export-dialog">
      <div class="dialog-content">
        <h2>{{ data.title }}</h2>
      </div>
      <div class="file-types-section">
        <span class="file-types-title">להורדה - לחץ על סוג הקובץ המבוקש</span>
        <div class="file-types-buttons">
          <button class="file-type-btn csv" [class.selected]="selectedFileType === 'csv'" (click)="selectFileType('csv')">
            <i class="fa-solid fa-file-csv"></i>
            <span>CSV</span>
          </button>
          <button class="file-type-btn xls" [class.selected]="selectedFileType === 'xls'" (click)="selectFileType('xls')">
            <i class="fa-solid fa-file-excel"></i>
            <span>XLS</span>
          </button>
          <button class="file-type-btn pdf" [class.selected]="selectedFileType === 'pdf'" (click)="selectFileType('pdf')">
            <i class="fa-solid fa-file-pdf"></i>
            <span>PDF</span>
          </button>
        </div>
      </div>
      <p class="export-type-label">{{ data.message }}</p>
      <div class="dialog-actions">
        <button class="btn-confirm" (click)="onExportAll()">
          {{ data.confirmText }}
        </button>
        <button class="btn-cancel" (click)="onExportSelected()" [disabled]="data.cancelDisabled">
          {{ data.cancelText }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './export-dialog.sass'
})
export class ExportDialogComponent {
  selectedFileType: string = 'xls';

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {}

  selectFileType(type: string): void {
    this.selectedFileType = type;
  }

  onExportAll(): void {
    this.dialogRef.close({ exportAll: true, fileType: this.selectedFileType });
  }

  onExportSelected(): void {
    this.dialogRef.close({ exportAll: false, fileType: this.selectedFileType });
  }
}
