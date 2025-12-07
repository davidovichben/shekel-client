import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VowSetService } from '../../../core/services/network/vow-set.service';
import { VowItem, AliyahType } from '../../../core/entities/vow-set.entity';
import { Member } from '../../../core/entities/member.entity';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';
import { MemberAutocompleteComponent } from '../../../shared/components/member-autocomplete/member-autocomplete';

export interface VowSetFormDialogData {
  vowSet?: {
    id: string;
    gregorianDate: string;
    hebrewDate: string;
    description: string;
    vows: VowItem[];
  };
}

interface VowItemForm {
  memberId: string;
  fullName: string;
  aliyahType: string;
  amount: number;
  sendReminder: boolean;
}

@Component({
  selector: 'app-vow-set-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent, MemberAutocompleteComponent],
  templateUrl: './vow-set-form.html',
  styleUrl: './vow-set-form.sass'
})
export class VowSetFormComponent implements OnInit {
  private vowSetService = inject(VowSetService);
  private dialogRef = inject(MatDialogRef<VowSetFormComponent>);
  private data: VowSetFormDialogData = inject(MAT_DIALOG_DATA);

  isEditMode = false;
  vowSetId = '';

  vowSet = {
    gregorianDate: '',
    hebrewDate: '',
    description: ''
  };

  vows: VowItemForm[] = [];

  aliyahOptions = [
    { value: AliyahType.Rishona, label: 'ראשונה' },
    { value: AliyahType.Shniya, label: 'שנייה' },
    { value: AliyahType.Shlishit, label: 'שלישית' },
    { value: AliyahType.Reviit, label: 'רביעית' },
    { value: AliyahType.Chamishit, label: 'חמישית' },
    { value: AliyahType.Shishit, label: 'שישית' },
    { value: AliyahType.Shviit, label: 'שביעית' },
    { value: AliyahType.Maftir, label: 'מפטיר' },
    { value: AliyahType.Hagbaha, label: 'הגבהה' },
    { value: AliyahType.Glila, label: 'גלילה' },
    { value: AliyahType.Petichta, label: 'פתיחה' },
    { value: AliyahType.Other, label: 'אחר' }
  ];

  isSubmitting = false;

  ngOnInit(): void {
    // Add initial empty vow
    this.addVow();

    if (this.data?.vowSet) {
      this.isEditMode = true;
      this.vowSetId = this.data.vowSet.id;
      this.vowSet = {
        gregorianDate: this.data.vowSet.gregorianDate || '',
        hebrewDate: this.data.vowSet.hebrewDate || '',
        description: this.data.vowSet.description || ''
      };
      if (this.data.vowSet.vows && this.data.vowSet.vows.length > 0) {
        this.vows = this.data.vowSet.vows.map(vow => ({
          memberId: vow.memberId,
          fullName: vow.fullName,
          aliyahType: vow.aliyahType,
          amount: vow.amount,
          sendReminder: vow.sendReminder
        }));
      }
    }
  }

  addVow(): void {
    this.vows.push({
      memberId: '',
      fullName: '',
      aliyahType: '',
      amount: 0,
      sendReminder: true
    });
  }

  removeVow(index: number): void {
    if (this.vows.length > 1) {
      this.vows.splice(index, 1);
    }
  }

  onMemberSelected(member: Member, index: number): void {
    this.vows[index].memberId = member.id;
    this.vows[index].fullName = member.fullName;
  }

  onSubmit(): void {
    // Validate at least one vow with member and amount
    const validVows = this.vows.filter(v => v.memberId && v.amount > 0);
    if (validVows.length === 0) {
      return;
    }

    this.isSubmitting = true;

    const payload = {
      ...this.vowSet,
      vows: validVows
    };

    const request = this.isEditMode
      ? this.vowSetService.update(this.vowSetId, payload)
      : this.vowSetService.create(payload);

    request.subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error saving vow set:', error);
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
