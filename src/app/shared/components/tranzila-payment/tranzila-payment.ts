import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export type TranzilaMode = 'store-card' | 'charge';

export interface TranzilaConfig {
  mode: TranzilaMode;
  sum?: number; // Required for 'charge' mode
  orderId?: string;
  contact?: string;
  email?: string;
  phone?: string;
}

export interface TranzilaResponse {
  success: boolean;
  txId?: string;
  token?: string;
  authNr?: string;
  index?: string;
  error?: string;
  cardLastFour?: string;
}

@Component({
  selector: 'app-tranzila-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tranzila-payment.html',
  styleUrl: './tranzila-payment.sass'
})
export class TranzilaPaymentComponent implements OnInit, OnDestroy {
  @ViewChild('paymentFrame') paymentFrame!: ElementRef<HTMLIFrameElement>;

  @Input() config!: TranzilaConfig;
  @Input() width = '100%';
  @Input() height = '400px';

  @Output() paymentSuccess = new EventEmitter<TranzilaResponse>();
  @Output() paymentError = new EventEmitter<TranzilaResponse>();
  @Output() paymentCancel = new EventEmitter<void>();

  iframeUrl: SafeResourceUrl | null = null;
  isLoading = true;

  private readonly TERMINAL = 'test3030';
  private readonly TERMINAL_PW = '5650500';
  private readonly CURRENCY = 1; // Shekels
  private readonly BASE_URL = 'https://direct.tranzila.com';

  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.buildIframeUrl();
    this.setupMessageListener();
  }

  ngOnDestroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
  }

  private buildIframeUrl(): void {
    const params = new URLSearchParams({
      supplier: this.TERMINAL,
      TranzilaPW: this.TERMINAL_PW,
      currency: this.CURRENCY.toString(),
      lang: 'il',
      nologo: '1',
      cred_type: '1',
      trBgColor: 'FAFAFA',
      trTextColor: '333333',
      trButtonColor: '0B1A51'
    });

    if (this.config.mode === 'store-card') {
      // Store card mode - verification only with token generation (J5)
      // Use minimal sum for verification (1 ILS)
      params.set('sum', '1');
      params.set('tranmode', 'VK');
      params.set('buttonLabel', 'שמור כרטיס');
      params.set('pdesc', 'שמירת כרטיס אשראי');
    } else {
      // Charge mode - actual payment
      if (!this.config.sum || this.config.sum <= 0) {
        console.error('Sum is required for charge mode');
        return;
      }
      params.set('sum', this.config.sum.toString());
      params.set('tranmode', 'AK');
      params.set('buttonLabel', 'שלם');
      params.set('pdesc', 'תשלום');
    }

    if (this.config.orderId) {
      params.set('order_id', this.config.orderId);
    }

    if (this.config.contact) {
      params.set('contact', this.config.contact);
    }

    if (this.config.email) {
      params.set('email', this.config.email);
    }

    if (this.config.phone) {
      params.set('phone', this.config.phone);
    }

    params.set('ppnewwin', 'no');

    const url = `${this.BASE_URL}/${this.TERMINAL}/iframenew.php?${params.toString()}`;
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private setupMessageListener(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Verify origin is from Tranzila
      if (!event.origin.includes('tranzila.com')) {
        return;
      }

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        this.handleTranzilaResponse(data);
      } catch (e) {
        // If not JSON, try to parse as URL params or handle as string response
        if (typeof event.data === 'string') {
          this.parseStringResponse(event.data);
        }
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  private handleTranzilaResponse(data: any): void {
    if (data.Response === '000' || data.success === true || data.response === '000') {
      const response: TranzilaResponse = {
        success: true,
        txId: data.txId || data.TxId || data.ConfirmationCode,
        token: data.Token || data.token || data.TranzilaTK,
        authNr: data.AuthNr || data.authnr,
        index: data.Index || data.index,
        cardLastFour: data.last4 || data.ccno?.slice(-4)
      };
      this.paymentSuccess.emit(response);
    } else {
      const response: TranzilaResponse = {
        success: false,
        error: data.error || data.Error || data.Response || 'Payment failed'
      };
      this.paymentError.emit(response);
    }
  }

  private parseStringResponse(data: string): void {
    // Try to parse as URL query string
    if (data.includes('=')) {
      const params = new URLSearchParams(data);
      const responseCode = params.get('Response') || params.get('response');

      if (responseCode === '000') {
        const response: TranzilaResponse = {
          success: true,
          txId: params.get('txId') || params.get('ConfirmationCode') || undefined,
          token: params.get('Token') || params.get('TranzilaTK') || undefined,
          authNr: params.get('AuthNr') || undefined,
          index: params.get('Index') || undefined,
          cardLastFour: params.get('last4') || undefined
        };
        this.paymentSuccess.emit(response);
      } else if (responseCode) {
        const response: TranzilaResponse = {
          success: false,
          error: `Transaction failed with code: ${responseCode}`
        };
        this.paymentError.emit(response);
      }
    }
  }

  onIframeLoad(): void {
    this.isLoading = false;
  }

  cancel(): void {
    this.paymentCancel.emit();
  }
}
