import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ExpenseService } from '../../../core/services/network/expense.service';
import { DebtService } from '../../../core/services/network/debt.service';
import { IncomeService } from '../../../core/services/network/income.service';
import { InvoiceService } from '../../../core/services/network/invoice.service';
import { firstValueFrom } from 'rxjs';

export interface ShareDialogData {
  entityType: 'expenses' | 'debts' | 'incomes' | 'invoices';
  selectedIds: string[];
  title?: string;
}

@Component({
  selector: 'app-share-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './share-dialog.html',
  styleUrl: './share-dialog.sass'
})
export class ShareDialogComponent {
  private expenseService = inject(ExpenseService);
  private debtService = inject(DebtService);
  private incomeService = inject(IncomeService);
  private invoiceService = inject(InvoiceService);

  isLoading = false;
  error: string | null = null;
  pdfBlob: Blob | null = null;

  constructor(
    private dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ShareDialogData
  ) {}

  async onShareWhatsApp(): Promise<void> {
    try {
      await this.fetchPdfIfNeeded();
      if (!this.pdfBlob) {
        this.error = 'לא ניתן ליצור את הקובץ';
        return;
      }

      const fileName = `${this.data.entityType}_${Date.now()}.pdf`;
      const file = new File([this.pdfBlob], fileName, { type: 'application/pdf' });

      // Use Web Share API to share the file with WhatsApp
      // This will open the native share dialog, and if WhatsApp is available, the file will be attached
      if (navigator.share) {
        try {
          // Check if canShare is available and supports files
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: this.data.title || 'שתף קובץ',
              text: 'קובץ PDF מצורף',
              files: [file]
            });
            // Share successful, close dialog
            this.dialogRef.close();
            return;
          }
        } catch (shareError: any) {
          // If share fails (user cancelled or not supported)
          if (shareError.name === 'AbortError') {
            // User cancelled, don't show error
            return;
          }
          // If canShare check fails, fall through to fallback
        }
      }

      // Fallback: If Web Share API is not available, show error message
      // WhatsApp Web doesn't support direct file sharing without download
      this.error = 'שיתוף ישיר לוואטסאפ אינו נתמך בדפדפן זה. נא להשתמש בדפדפן תומך או באפליקציית WhatsApp.';
    } catch (error: any) {
      console.error('Error sharing via WhatsApp:', error);
      this.error = 'שגיאה בשליחה לוואטסאפ';
    }
  }

  async onShareEmail(): Promise<void> {
    try {
      await this.fetchPdfIfNeeded();
      if (!this.pdfBlob) {
        this.error = 'לא ניתן ליצור את הקובץ';
        return;
      }

      const fileName = `${this.data.entityType}_${Date.now()}.pdf`;
      const file = new File([this.pdfBlob], fileName, { type: 'application/pdf' });

      // Check if Web Share API is available and supports files
      if (navigator.share) {
        try {
          // Check if canShare is available and supports files
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: this.data.title || 'שתף קובץ',
              text: 'קובץ PDF מצורף',
              files: [file]
            });
            this.dialogRef.close();
            return;
          }
        } catch (shareError: any) {
          // If canShare check fails or share fails, fall through to mailto
          if (shareError.name === 'AbortError') {
            // User cancelled, don't show error
            return;
          }
        }
      }

      // Fallback: Create mailto link with download
      const blobUrl = URL.createObjectURL(this.pdfBlob);
      
      // Trigger download first
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Open email client with message
      const subject = encodeURIComponent(this.data.title || 'קובץ PDF');
      const body = encodeURIComponent(`נא לצרף את הקובץ ${fileName} שמוריד כעת.`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name !== 'AbortError') {
        console.error('Error sharing via Email:', error);
        this.error = 'שגיאה בשליחה באימייל';
      }
    }
  }

  private async fetchPdfIfNeeded(): Promise<void> {
    if (this.pdfBlob) {
      return; // Already fetched
    }

    this.isLoading = true;
    this.error = null;

    try {
      let blob: Blob;

      switch (this.data.entityType) {
        case 'expenses':
          blob = await firstValueFrom(
            this.expenseService.export(undefined, this.data.selectedIds, 'pdf')
          );
          break;
        case 'debts':
          blob = await firstValueFrom(
            this.debtService.export(undefined, this.data.selectedIds, 'pdf')
          );
          break;
        case 'incomes':
          blob = await firstValueFrom(
            this.incomeService.export({ ids: this.data.selectedIds, file_type: 'pdf' })
          );
          break;
        case 'invoices':
          blob = await firstValueFrom(
            this.invoiceService.export(this.data.selectedIds, 'pdf')
          );
          break;
        default:
          throw new Error('Unknown entity type');
      }

      this.pdfBlob = blob;
      this.isLoading = false;
    } catch (error: any) {
      console.error('Error fetching PDF:', error);
      this.error = 'שגיאה בטעינת הקובץ. נסה שוב מאוחר יותר.';
      this.isLoading = false;
      throw error;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
