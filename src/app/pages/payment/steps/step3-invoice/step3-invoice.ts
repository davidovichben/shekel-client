import { Component, Input, Output, EventEmitter, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoicePreviewComponent, InvoiceData } from '../../../../shared/components/invoice-preview/invoice-preview';
import { CustomSelectComponent } from '../../../../shared/components/custom-select/custom-select';
import { PayerDetails } from '../step1-payer/step1-payer';
import { PaymentDetails } from '../step2-payment/step2-payment';
import { IncomeCategory } from '../../../../core/entities/income.entity';
import { PdfGenerationService } from '../../../../core/services/pdf-generation.service';

@Component({
  selector: 'app-step3-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoicePreviewComponent, CustomSelectComponent],
  templateUrl: './step3-invoice.html',
  styleUrl: './step3-invoice.sass'
})
export class Step3InvoiceComponent {
  private pdfGenerationService = inject(PdfGenerationService);
  
  @Input() payerDetails!: PayerDetails;
  @Input() paymentDetails!: PaymentDetails;
  @Input() transaction!: {
    description: string;
    amount: number;
    installments: number;
    vat: number;
    vatPercent: number;
    total: number;
  };
  @Output() receiptTypeChange = new EventEmitter<string>();
  @ViewChild(InvoicePreviewComponent) invoicePreview?: InvoicePreviewComponent;

  receiptType = IncomeCategory.Other;
  receiptTypeOptions = [
    { value: IncomeCategory.Vows, label: 'נדרים' },
    { value: IncomeCategory.CommunityDonations, label: 'תרומות מהקהילה' },
    { value: IncomeCategory.ExternalDonations, label: 'תרומות חיצוניות' },
    { value: IncomeCategory.Ascensions, label: 'עליות' },
    { value: IncomeCategory.OnlineDonations, label: 'תרומות אונליין' },
    { value: IncomeCategory.MembershipFees, label: 'דמי חברים' },
    { value: IncomeCategory.Other, label: 'אחר' }
  ];

  onReceiptTypeChange(): void {
    this.receiptTypeChange.emit(this.receiptType);
  }

  /**
   * Generate PDF receipt from invoice preview
   */
  async generateReceiptPdf(): Promise<Blob> {
    if (!this.invoicePreview) {
      throw new Error('Invoice preview component not found');
    }

    const element = this.invoicePreview.getElementRef();
    if (!element) {
      throw new Error('Invoice element not found');
    }

    const filename = `receipt_${this.invoiceData.invoiceNumber}.pdf`;
    return await this.pdfGenerationService.generatePdfFromElement(element, filename);
  }

  get invoiceData(): InvoiceData {
    const installmentAmount = this.transaction.installments > 0
      ? Math.round((this.transaction.total / this.transaction.installments) * 100) / 100
      : this.transaction.total;

    const installments = [];
    const today = new Date();
    for (let i = 0; i < this.transaction.installments; i++) {
      const dueDate = new Date(today);
      dueDate.setMonth(dueDate.getMonth() + i);
      installments.push({
        paymentMethod: this.paymentDetails.paymentMethod === 'credit' ? 'אשראי' : 'מס"ב',
        dueDate: this.formatHebrewDate(dueDate),
        amount: installmentAmount
      });
    }

    return {
      organizationName: 'בית כנסת אהל משה',
      organizationId: '12322322121',
      email: 'beit-kneset@gmail.com',
      phone: '03-5214452',
      address: 'נחמיה 13 בני ברק, ישראל',
      invoiceNumber: '10254',
      date: this.formatDate(new Date()),
      customerName: `${this.payerDetails.firstName} ${this.payerDetails.lastName}`.trim(),
      customerAddress: this.payerDetails.address || 'נחמיה 13 בני ברק, ישראל.',
      customerTaxId: this.payerDetails.companyId || '201536555',
      lineItems: [{
        description: this.transaction.description || 'עליה ראשונה שבת שובה',
        quantity: 1,
        unitPrice: this.transaction.amount,
        total: this.transaction.amount
      }],
      subtotal: this.transaction.amount,
      rounding: 0,
      discount: 0,
      vatPercent: this.transaction.vatPercent,
      vat: this.transaction.vat,
      total: this.transaction.total,
      installments,
      debtRef: '2352'
    };
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private formatHebrewDate(date: Date): string {
    const hebrewMonths = ["טבת", "שבט", "אדר", "ניסן", "אייר", "סיון", "תמוז", "אב", "אלול", "תשרי", "חשון", "כסלו"];
    const month = hebrewMonths[date.getMonth()];
    return `כה' ${month} תשפ"ה`;
  }
}
