import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceInstallment {
  paymentMethod: string;
  dueDate: string;
  amount: number;
}

export interface InvoiceData {
  organizationName: string;
  organizationId: string;
  email: string;
  phone: string;
  address: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerTaxId: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  rounding: number;
  discount: number;
  vatPercent: number;
  vat: number;
  total: number;
  installments: InvoiceInstallment[];
  debtRef?: string;
}

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-preview.html',
  styleUrl: './invoice-preview.sass'
})
export class InvoicePreviewComponent {
  @Input() data!: InvoiceData;
  @Input() logoUrl?: string;
  @ViewChild('invoiceCard', { static: false }) invoiceCardRef?: ElementRef<HTMLElement>;

  /**
   * Get the HTML element reference for PDF generation
   */
  getElementRef(): HTMLElement | null {
    return this.invoiceCardRef?.nativeElement || null;
  }
}
