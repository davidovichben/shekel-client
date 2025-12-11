import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoicePreviewComponent, InvoiceData } from '../../../../shared/components/invoice-preview/invoice-preview';
import { PayerDetails } from '../step1-payer/step1-payer';
import { PaymentDetails } from '../step2-payment/step2-payment';

@Component({
  selector: 'app-step3-invoice',
  standalone: true,
  imports: [CommonModule, InvoicePreviewComponent],
  templateUrl: './step3-invoice.html',
  styleUrl: './step3-invoice.sass'
})
export class Step3InvoiceComponent {
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
