import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BusinessService } from '../../core/services/network/business.service';
import { GeneralTabComponent, OrganizationSettings } from './tabs/general-tab/general-tab';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, GeneralTabComponent],
  templateUrl: './system-settings.html',
  styleUrl: './system-settings.sass'
})
export class SystemSettingsComponent implements OnInit {
  activeTab = 'general';

  constructor(private businessService: BusinessService) {}

  tabs = [
    { id: 'general', label: 'כללי' },
    { id: 'categories', label: 'ניהול קטגוריות' },
    { id: 'tables', label: 'ניהול טבלאות ועמודות' },
    { id: 'pricing', label: 'מחיר ושדרוג תכנית' },
    { id: 'notifications', label: 'התראות והודעות' },
    { id: 'automation', label: 'אוטמציה ותזכור' },
    { id: 'updates', label: 'עדכוני מערכת' },
    { id: 'integrations', label: 'אינטגרציות' }
  ];

  settings: OrganizationSettings = {
    business_number: '541231554',
    name: 'בית ישעיהו בע"מ',
    logo: null,
    phone: '050-654-2211',
    address: 'ה\' באייר, 45 ראשון לציון',
    email: 'beit-kneset@gmail.com',
    type: 'npo',
    website: 'beityeshaayahu.com',
    preferred_date_format: 'gregorian',
    show_details_on_invoice: true,
    synagogue_name: 'בית ישעיהו',
    synagogue_phone: '050-654-2211',
    synagogue_address: 'ה\' באייר, 45 ראשון לציון',
    synagogue_email: 'beit-kneset@gmail.com'
  };

  // Categories tab
  memberTypes: string[] = ['קבוע', 'אורח', 'בן משפחה', 'מנהל', 'ספק'];
  expenseTypes: string[] = ['החזקת בית הכנסת', 'ציוד וריהוט', 'הנהלה ושכר', 'ביטוחים', 'תפעול פעילויות', 'ספקים ובעלי מקצוע'];
  newMemberType = '';
  newExpenseType = '';

  // Save state
  isSaving = false;
  showSaveSuccess = false;

  ngOnInit(): void {
    this.businessService.show().subscribe(business => {
      this.settings = {
        business_number: business.business_number,
        name: business.name,
        logo: business.logo,
        phone: business.phone,
        address: business.address,
        email: business.email,
        type: business.type,
        website: business.website,
        preferred_date_format: business.preferred_date_format || 'gregorian',
        show_details_on_invoice: business.show_details_on_invoice ?? true,
        synagogue_name: business.synagogue_name,
        synagogue_phone: business.synagogue_phone,
        synagogue_address: business.synagogue_address,
        synagogue_email: business.synagogue_email
      };
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  onSave(): void {
    this.isSaving = true;
    this.showSaveSuccess = false;
    this.businessService.update(this.settings).subscribe({
      next: () => {
        this.isSaving = false;
        this.showSaveSuccess = true;
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  closeSuccessDialog(): void {
    this.showSaveSuccess = false;
  }

  addMemberType(): void {
    if (this.newMemberType.trim()) {
      this.memberTypes.push(this.newMemberType.trim());
      this.newMemberType = '';
    }
  }

  removeMemberType(type: string): void {
    this.memberTypes = this.memberTypes.filter(t => t !== type);
  }

  addExpenseType(): void {
    if (this.newExpenseType.trim()) {
      this.expenseTypes.push(this.newExpenseType.trim());
      this.newExpenseType = '';
    }
  }

  removeExpenseType(type: string): void {
    this.expenseTypes = this.expenseTypes.filter(t => t !== type);
  }
}
