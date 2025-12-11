import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ExportDialogData {
  title?: string;
  subtitle?: string;
  selectedCount?: number;
  tabName?: string;
}

export interface ExportDialogResult {
  fileType: 'csv' | 'xls' | 'pdf';
  exportScope: 'selected' | 'tab';
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './export-dialog.html',
  styleUrl: './export-dialog.sass'
})
export class ExportDialogComponent {
  exportScope: 'selected' | 'tab' = 'tab';

  constructor(
    private dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {
    // Default to 'selected' if there are selected rows, otherwise 'tab'
    if (this.data.selectedCount && this.data.selectedCount > 0) {
      this.exportScope = 'selected';
    }
  }

  onFileTypeSelect(fileType: 'csv' | 'xls' | 'pdf'): void {
    this.dialogRef.close({ fileType, exportScope: this.exportScope });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
