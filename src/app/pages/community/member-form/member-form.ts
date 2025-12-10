import { Component, inject, Inject, Optional, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MemberService } from '../../../core/services/network/member.service';
import { Member } from '../../../core/entities/member.entity';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header';
import { environment } from '../../../../environments/environment';

export interface MemberFormDialogData {
  member?: Member;
}

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, DialogHeaderComponent],
  templateUrl: './member-form.html',
  styleUrl: './member-form.sass'
})
export class MemberFormComponent implements OnInit {
  private memberService = inject(MemberService);
  private dialogRef = inject(MatDialogRef<MemberFormComponent>);

  isDevMode = !environment.production;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  memberId: string | null = null;

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

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: MemberFormDialogData
  ) {}

  ngOnInit(): void {
    if (this.data?.member) {
      this.isEditMode = true;
      this.memberId = this.data.member.id;
      this.loadMemberDetails(this.memberId);
    }
  }

  private loadMemberDetails(id: string): void {
    this.isLoading = true;
    this.memberService.getOne(id).subscribe({
      next: (member) => {
        this.populateForm(member);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading member details:', error);
        this.isLoading = false;
      }
    });
  }

  private populateForm(member: Member): void {
    const m = member as any;
    this.formData = {
      type: m.type || '',
      title: m.title || '',
      firstName: m.firstName || m.first_name || '',
      lastName: m.lastName || m.last_name || '',
      email: m.email || '',
      mobile: m.mobile || '',
      country: m.country || '',
      city: m.city || '',
      address: m.address || '',
      address2: m.address2 || m.address_2 || '',
      zipcode: m.zipcode || ''
    };
  }

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

  isValidEmail(email: string): boolean {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSave(): void {
    if (!this.formData.firstName || !this.formData.lastName) {
      return;
    }

    if (!this.isValidEmail(this.formData.email)) {
      return;
    }

    const payload = {
      type: this.formData.type,
      title: this.formData.title,
      first_name: this.formData.firstName,
      last_name: this.formData.lastName,
      email: this.formData.email,
      mobile: this.formData.mobile,
      country: this.formData.country,
      city: this.formData.city,
      address: this.formData.address,
      address_2: this.formData.address2,
      zipcode: this.formData.zipcode
    };

    this.isSaving = true;

    if (this.isEditMode && this.memberId) {
      this.memberService.update(this.memberId, payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error updating member:', error);
          this.isSaving = false;
        }
      });
    } else {
      this.memberService.create(payload).subscribe({
        next: () => {
          this.isSaving = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error creating member:', error);
          this.isSaving = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  fillTestData(): void {
    const firstNames = ['יוסף', 'משה', 'דוד', 'אברהם', 'יעקב', 'שמואל', 'אליהו', 'חיים', 'מנחם', 'שלמה'];
    const lastNames = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'אברהמי', 'גולדשטיין', 'פרידמן', 'רוזנברג', 'שפירא'];
    const cities = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'בני ברק', 'רמת גן', 'פתח תקווה', 'אשדוד', 'נתניה', 'ראשון לציון'];
    const streets = ['הרצל', 'רוטשילד', 'בן יהודה', 'דיזנגוף', 'אלנבי', 'ז\'בוטינסקי', 'ויצמן', 'בגין', 'רבין', 'הנשיא'];
    const types = ['permanent', 'family_member', 'guest', 'supplier', 'other'];
    const titles = ['mr', 'mrs', 'rabbi', 'dr'];

    const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomNum = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

    const firstName = random(firstNames);
    const lastName = random(lastNames);

    this.formData = {
      type: random(types),
      title: random(titles),
      firstName,
      lastName,
      email: `${firstName}.${lastName}${randomNum(1, 999)}@test.com`,
      mobile: `05${randomNum(0, 9)}-${randomNum(100, 999)}-${randomNum(1000, 9999)}`,
      country: 'ישראל',
      city: random(cities),
      address: random(streets),
      address2: String(randomNum(1, 150)),
      zipcode: String(randomNum(1, 20))
    };
  }
}
