import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ExportDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  cancelDisabled?: boolean;
}

export interface ExportDialogResult {
  exportAll: boolean;
  fileType?: string;
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="export-dialog">
      <div class="dialog-header">
        <h2>{{ data.title || 'ייצוא לקובץ' }}</h2>
        <button class="close-btn" (click)="onCancel()">
          <img src="/assets/icons/close-icon.svg" alt="Close" />
        </button>
      </div>
      <div class="dialog-content">
        <p>{{ data.message || 'בחר את סוג הייצוא:' }}</p>
        <div class="dialog-actions">
          <button class="btn-confirm" (click)="onExportAll()">
            {{ data.confirmText || 'ייצא את כל הרשומות' }}
          </button>
          <button 
            class="btn-cancel" 
            (click)="onExportSelected()" 
            [disabled]="data.cancelDisabled">
            {{ data.cancelText || 'ייצא פריטים שנבחרו' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .export-dialog {
      padding: 0;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn img {
      width: 20px;
      height: 20px;
    }
    .dialog-content {
      padding: 1.5rem;
    }
    .dialog-content p {
      margin: 0 0 1.5rem 0;
      color: #666;
    }
    .dialog-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }
    .btn-confirm,
    .btn-cancel {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-confirm {
      background: #0b1a51;
      color: white;
    }
    .btn-confirm:hover {
      background: #162a6b;
    }
    .btn-cancel {
      background: #d1d5dc;
      color: #0b1a51;
    }
    .btn-cancel:hover:not(:disabled) {
      background: #c4c9d0;
    }
    .btn-cancel:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class ExportDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {}

  onExportAll(): void {
    this.dialogRef.close({ exportAll: true, fileType: 'csv' });
  }

  onExportSelected(): void {
    this.dialogRef.close({ exportAll: false, fileType: 'csv' });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

