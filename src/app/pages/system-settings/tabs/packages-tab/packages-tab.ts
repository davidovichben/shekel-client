import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenericService, Package as ApiPackage } from '../../../../core/services/network/generic.service';
import { BusinessService, Business } from '../../../../core/services/network/business.service';
import { BillingService } from '../../../../core/services/network/billing.service';
import { TranzilaPaymentComponent, TranzilaResponse } from '../../../../shared/components/tranzila-payment/tranzila-payment';

export interface Package {
  id: string;
  name: string;
  price: number;
  isRecommended?: boolean;
  features: string[];
  paymentFeatures?: string[];
  paidFeatures?: string[];
}

export interface CurrentSubscription {
  packageId: string | null;
  packageName: string;
  nextBillingDate: string;
  nextBillingAmount: number;
  cardLastFour: string;
}

@Component({
  selector: 'app-packages-tab',
  standalone: true,
  imports: [CommonModule, TranzilaPaymentComponent],
  templateUrl: './packages-tab.html',
  styleUrl: './packages-tab.sass'
})
export class PackagesTabComponent implements OnInit {
  private genericService = inject(GenericService);
  private businessService = inject(BusinessService);
  private billingService = inject(BillingService);

  currentSubscription: CurrentSubscription = {
    packageId: null,
    packageName: '',
    nextBillingDate: '',
    nextBillingAmount: 0,
    cardLastFour: ''
  };

  packages: Package[] = [];
  isLoading = true;
  showChangeCardDialog = false;
  isLoadingIframe = false;
  iframeUrl: string | null = null;

  @Output() changeCard = new EventEmitter<void>();
  @Output() selectPackage = new EventEmitter<Package>();

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;

    // Load packages
    this.genericService.getPackages().subscribe({
      next: (packages) => {
        this.packages = packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          features: pkg.features || [],
          paymentFeatures: pkg.payment_features || [],
          paidFeatures: pkg.paid_features || [],
          isRecommended: pkg.name.toLowerCase() === 'pro'
        }));
        this.isLoading = false;
      },
      error: () => {
        // Fallback to default packages if API fails
        this.packages = this.getDefaultPackages();
        this.isLoading = false;
      }
    });

    // Load business to get current package
    this.businessService.show().subscribe({
      next: (business) => {
        this.currentSubscription.packageId = business.package_id;
        const currentPkg = this.packages.find(p => p.id === business.package_id);
        if (currentPkg) {
          this.currentSubscription.packageName = currentPkg.name;
          this.currentSubscription.nextBillingAmount = currentPkg.price;
        }
      }
    });
  }

  private getDefaultPackages(): Package[] {
    return [
      {
        id: 'platinum',
        name: 'Platinum',
        price: 199,
        features: [
          'הפקת 300 קבלות בחודש',
          'שליחת 120 הודעות מייל / ווטסאפ בחודש',
          '250 חברי קהילה במערכת',
          'אתר בית כנסת',
          'איזור אישי לחבר קהילה',
          'ניהול דינאמי למנהל מערכת',
          'ניהול הוצאות חודשיות - ללא הגבלה',
          'תמיכה טכנית בווטסאפ / מייל / טלפון'
        ],
        paymentFeatures: [
          'סליקה בעמלה של 1.10%',
          'ייצוא דוחות לחשבשבת'
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 149,
        isRecommended: true,
        features: [
          'הפקת 200 קבלות בחודש',
          'שליחת 80 הודעות מייל / ווטסאפ בחודש',
          '150 חברי קהילה במערכת',
          'אתר בית כנסת',
          'איזור אישי לחבר קהילה',
          'ניהול דינאמי למנהל מערכת',
          'ניהול 50 הוצאות חודשיות',
          'תמיכה טכנית בווטסאפ / מייל'
        ],
        paymentFeatures: [
          'סליקה בעמלה של 1.20%',
          'ייצוא דוחות לחשבשבת'
        ]
      },
      {
        id: 'plus',
        name: 'Plus',
        price: 79,
        features: [
          'הפקת 100 קבלות בחודש',
          'שליחת 50 הודעות מייל / ווטסאפ בחודש',
          '100 חברי קהילה במערכת',
          'אתר בית כנסת',
          'איזור אישי לחבר קהילה',
          'ניהול דינאמי למנהל מערכת',
          'ניהול 30 הוצאות חודשיות',
          'תמיכה טכנית בווטסאפ / מייל'
        ],
        paymentFeatures: [
          'הוספת קבלות - 1 ש"ח ליחידה',
          'הוספת הודעות: 0.3 ש"ח ליחידה'
        ]
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 0,
        features: [
          'הפקת 8 קבלות בחודש',
          'שליחת 10 הודעות מייל / ווטסאפ בחודש',
          '25 חברי קהילה במערכת',
          'אתר בית כנסת',
          'איזור אישי לחבר קהילה',
          'ניהול דינאמי למנהל מערכת',
          'ניהול 20 הוצאות חודשיות',
          'תמיכה טכנית בווטסאפ / מייל'
        ],
        paymentFeatures: [
          'לא יינתנו שירותים בתוספת תשלום.'
        ]
      }
    ];
  }

  isCurrentPackage(pkg: Package): boolean {
    return pkg.id === this.currentSubscription.packageId;
  }

  onChangeCard(): void {
    this.showChangeCardDialog = true;
    this.isLoadingIframe = true;
    this.iframeUrl = null;

    this.billingService.getIframeUrl().subscribe({
      next: (response) => {
        this.iframeUrl = response.iframe_url;
        this.isLoadingIframe = false;
      },
      error: (error) => {
        console.error('Error loading iframe URL:', error);
        this.isLoadingIframe = false;
      }
    });
  }

  onSelectPackage(pkg: Package): void {
    this.selectPackage.emit(pkg);
  }

  onCardStored(response: TranzilaResponse): void {
    if (response.success && response.token) {
      // TODO: Send token to backend to update stored card
      console.log('Card stored successfully:', response);
      if (response.cardLastFour) {
        this.currentSubscription.cardLastFour = response.cardLastFour;
      }
      this.showChangeCardDialog = false;
    }
  }

  onCardStoreError(response: TranzilaResponse): void {
    console.error('Card store failed:', response.error);
  }

  closeChangeCardDialog(): void {
    this.showChangeCardDialog = false;
    this.iframeUrl = null;
  }
}
