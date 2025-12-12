import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageInputComponent } from '../../../../shared/components/image-input/image-input';
import { BusinessService } from '../../../../core/services/network/business.service';

export interface OrganizationSettings {
  business_number: string;
  name: string;
  logo: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  type: 'npo' | 'exempt' | 'licensed' | 'company';
  website: string | null;
  preferred_date_format: 'gregorian' | 'hebrew';
  show_details_on_invoice: boolean;
  synagogue_name: string;
  synagogue_phone: string | null;
  synagogue_address: string | null;
  synagogue_email: string | null;
}

@Component({
  selector: 'app-general-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageInputComponent],
  templateUrl: './general-tab.html',
  styleUrl: './general-tab.sass'
})
export class GeneralTabComponent implements OnInit {
  private businessService = inject(BusinessService);

  settings: OrganizationSettings = {
    business_number: '',
    name: '',
    logo: null,
    phone: null,
    address: null,
    email: null,
    type: 'npo',
    website: null,
    preferred_date_format: 'gregorian',
    show_details_on_invoice: true,
    synagogue_name: '',
    synagogue_phone: null,
    synagogue_address: null,
    synagogue_email: null
  };

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
}
