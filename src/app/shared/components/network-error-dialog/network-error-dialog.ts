import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface NetworkErrorDialogData {
  statusCode?: number;
  message?: string;
}

@Component({
  selector: 'app-network-error-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './network-error-dialog.html',
  styleUrl: './network-error-dialog.sass'
})
export class NetworkErrorDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NetworkErrorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NetworkErrorDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
