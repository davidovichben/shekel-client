import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MemberService } from '../../../core/services/network/member.service';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './member-form.html',
  styleUrl: './member-form.sass'
})
export class MemberFormComponent {
  private memberService = inject(MemberService);
  private dialogRef = inject(MatDialogRef<MemberFormComponent>);

  formData = {
    type: '',
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    country: '',
    city: '',
    address: '',
    address2: '',
    zipcode: ''
  };

  typeOptions = [
    { value: 'permanent', label: 'חבר קהילה' },
    { value: 'family_member', label: 'בן משפחה' },
    { value: 'guest', label: 'אורח' },
    { value: 'supplier', label: 'ספק' },
    { value: 'primary_admin', label: 'מנהל' },
    { value: 'other', label: 'אחר' }
  ];

  titleOptions = [
    { value: 'mr', label: 'מר' },
    { value: 'mrs', label: 'גברת' },
    { value: 'rabbi', label: 'הרב' },
    { value: 'dr', label: 'ד"ר' }
  ];

  onSave(): void {
    if (!this.formData.firstName || !this.formData.lastName) {
      return;
    }

    this.memberService.create(this.formData).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error creating member:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
