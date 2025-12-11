import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageInputComponent } from '../../../../shared/components/image-input/image-input';

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
export class GeneralTabComponent {
  @Input() settings!: OrganizationSettings;
  @Input() isSaving = false;
  @Output() save = new EventEmitter<void>();

  onSave(): void {
    this.save.emit();
  }
}
