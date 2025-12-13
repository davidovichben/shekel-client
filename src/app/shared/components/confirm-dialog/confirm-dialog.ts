import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DialogButton {
  text: string;
  icon?: string;
  type: 'primary' | 'cancel' | 'secondary' | 'success' | 'warning';
  action: 'confirm' | 'cancel' | string;
}

export interface ConfirmDialogData {
  title: string;
  message?: string;
  description?: string;
  buttons?: DialogButton[];
  confirmText?: string;
  confirmIcon?: string; // Optional icon for confirm button
  cancelText?: string;
  cancelDisabled?: boolean;
  items?: string[];
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-content">
        <h2>{{ data.title }}</h2>
        <p>{{ data.message }}</p>
        @if (data.items && data.items.length > 0) {
          <ul class="items-list">
            @for (item of data.items; track item) {
              <li>{{ item }}</li>
            }
          </ul>
        }
      </div>
      <div class="dialog-actions">
        @if (data.buttons && data.buttons.length > 0) {
          @for (button of data.buttons; track button.action) {
            <button [class]="'btn-' + button.type" (click)="onButtonClick(button.action)" type="button">
              @if (button.icon) {
                <img [src]="'assets/img/icons/' + button.icon.replace('-icon', '') + '.svg'" [alt]="button.text" class="btn-icon" />
              }
              {{ button.text }}
            </button>
          }
        } @else {
          @if (data.cancelText) {
            <button class="btn-cancel" (click)="onCancel()" type="button">
              <img src="/assets/img/icons/close.svg" alt="ביטול" class="btn-icon" />
              {{ data.cancelText }}
            </button>
          }
          @if (data.confirmText) {
            <button class="btn-confirm" (click)="onConfirm()" type="button">
              @if (data.confirmIcon) {
                <img [src]="'assets/img/icons/' + data.confirmIcon" [alt]="data.confirmText" class="btn-icon" />
              } @else if (data.cancelText) {
                <img src="assets/img/icons/trash-white.svg" alt="מחק" class="btn-icon" />
              }
              {{ data.confirmText }}
            </button>
          }
        }
      </div>
    </div>
  `,
  styleUrl: './confirm-dialog.sass'
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onButtonClick(action: string): void {
    if (action === 'confirm') {
      this.dialogRef.close(true);
    } else if (action === 'cancel') {
      this.dialogRef.close(false);
    } else {
      this.dialogRef.close(action);
    }
  }
}
