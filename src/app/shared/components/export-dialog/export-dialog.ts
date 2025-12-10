import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ExportDialogData {
  title?: string;
  subtitle?: string;
}

export interface ExportDialogResult {
  fileType: 'csv' | 'xls' | 'pdf';
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-dialog.html',
  styleUrl: './export-dialog.sass'
})
export class ExportDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {}

  onFileTypeSelect(fileType: 'csv' | 'xls' | 'pdf'): void {
    this.dialogRef.close({ fileType });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

