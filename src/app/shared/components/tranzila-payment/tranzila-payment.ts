import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface TranzilaResponse {
  success: boolean;
  txId?: string;
  token?: string;
  authNr?: string;
  index?: string;
  error?: string;
  cardLastFour?: string;
  expMonth?: string;
  expYear?: string;
}

@Component({
  selector: 'app-tranzila-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tranzila-payment.html',
  styleUrl: './tranzila-payment.sass'
})
export class TranzilaPaymentComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('paymentFrame') paymentFrame!: ElementRef<HTMLIFrameElement>;

  @Input() url!: string;
  @Input() width = '100%';
  @Input() height = '400px';

  @Output() paymentSuccess = new EventEmitter<TranzilaResponse>();
  @Output() paymentError = new EventEmitter<TranzilaResponse>();

  iframeUrl: SafeResourceUrl | null = null;
  isLoading = true;

  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.setupMessageListener();
    if (this.url) {
      this.setIframeUrl(this.url);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['url'] && this.url) {
      this.setIframeUrl(this.url);
    }
  }

  ngOnDestroy(): void {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
  }

  private setIframeUrl(url: string): void {
    // Ensure postMessage parameters are included for Tranzila response
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('ppnewwin')) {
      urlObj.searchParams.set('ppnewwin', 'postmessage');
    }
    if (!urlObj.searchParams.has('ppmsg')) {
      urlObj.searchParams.set('ppmsg', '1');
    }
    const finalUrl = urlObj.toString();
    console.log('Tranzila iframe URL:', finalUrl);
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
    this.isLoading = true;
  }

  private setupMessageListener(): void {
    this.messageHandler = (event: MessageEvent) => {
      // Log ALL postMessage events for debugging
      console.log('=== PostMessage received ===');
      console.log('Origin:', event.origin);
      console.log('Data type:', typeof event.data);
      console.log('Data:', event.data);
      console.log('Data stringified:', JSON.stringify(event.data));

      if (!event.data) {
        console.log('No data in message, ignoring');
        return;
      }

      // Check for tranzilaEvent format (custom integration)
      if (event.data.tranzilaEvent) {
        console.log('Found tranzilaEvent:', event.data.tranzilaEvent);
        this.handleTranzilaEvent(event.data.tranzilaEvent);
        return;
      }

      // Check if the data itself has type/event properties (alternative format)
      if (event.data.type || event.data.event || event.data.status) {
        console.log('Found event data directly:', event.data);
        this.handleTranzilaEvent(event.data);
        return;
      }

      // Accept messages from tranzila.com domains for legacy format
      if (event.origin.includes('tranzila.com')) {
        console.log('Tranzila origin message:', event.data);
        try {
          let data: any;
          if (typeof event.data === 'string') {
            try {
              data = JSON.parse(event.data);
            } catch {
              if (event.data.includes('=')) {
                data = this.parseUrlParams(event.data);
              } else {
                return;
              }
            }
          } else {
            data = event.data;
          }
          this.handleTranzilaResponse(data);
        } catch (e) {
          console.error('Error processing Tranzila response:', e);
        }
      }
    };

    window.addEventListener('message', this.messageHandler);
    console.log('Tranzila postMessage listener set up');
  }

  private parseUrlParams(queryString: string): Record<string, string> {
    const params = new URLSearchParams(queryString);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private handleTranzilaEvent(eventData: any): void {
    console.log('handleTranzilaEvent:', eventData);

    const eventType = eventData.type || eventData.event;
    const data = eventData.data || eventData;

    if (eventType === 'paymentSuccess' || eventType === 'success' || data.status === 'ok') {
      const response: TranzilaResponse = {
        success: true,
        txId: data.txId || data.transactionId || data.index,
        token: data.token || data.TranzilaTK,
        authNr: data.authNr || data.auth_nr,
        index: data.index,
        cardLastFour: data.cardLastFour || data.last4,
        expMonth: data.expMonth,
        expYear: data.expYear
      };
      console.log('Emitting paymentSuccess from tranzilaEvent:', response);
      this.paymentSuccess.emit(response);
    } else if (eventType === 'paymentError' || eventType === 'error' || data.status === 'error') {
      const response: TranzilaResponse = {
        success: false,
        error: data.error || data.message || 'Payment failed'
      };
      console.log('Emitting paymentError from tranzilaEvent:', response);
      this.paymentError.emit(response);
    } else if (eventType === 'formSubmitted' || eventType === 'submitted') {
      // Form was submitted, emit success to trigger processing state
      const response: TranzilaResponse = {
        success: true
      };
      console.log('Form submitted, emitting paymentSuccess:', response);
      this.paymentSuccess.emit(response);
    }
  }

  private handleTranzilaResponse(data: any): void {
    console.log('handleTranzilaResponse called with:', data);

    const responseCode = data.Response || data.response || data.ResponseCode || data.CCode;
    console.log('Response code:', responseCode);

    const isSuccess = responseCode === '000' || responseCode === '0' || responseCode === 0 ||
                      data.success === true || data.success === 'true' ||
                      (data.TranzilaTK && !responseCode); // Token present without error code

    console.log('Is success:', isSuccess);

    if (isSuccess) {
      const response: TranzilaResponse = {
        success: true,
        txId: data.ConfirmationCode || data.txId || data.TxId || data.index || data.Index,
        token: data.TranzilaTK || data.Token || data.token,
        authNr: data.AuthNr || data.authnr || data.auth_nr,
        index: data.Index || data.index,
        cardLastFour: data.ccno ? data.ccno.slice(-4) : (data.last4 || data.card_last_4 || data.cardLastFour),
        expMonth: data.expmonth || data.exp_month || data.expMonth,
        expYear: data.expyear || data.exp_year || data.expYear
      };
      console.log('Emitting paymentSuccess:', response);
      this.paymentSuccess.emit(response);
    } else {
      const response: TranzilaResponse = {
        success: false,
        error: data.error || data.Error || data.errmsg || data.ErrMsg || `Transaction failed (code: ${responseCode})`
      };
      console.log('Emitting paymentError:', response);
      this.paymentError.emit(response);
    }
  }

  onIframeLoad(): void {
    this.isLoading = false;
  }
}
