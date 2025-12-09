import { Component, Input, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Member } from '../../../../../core/entities/member.entity';
import { CustomSelectComponent } from '../../../../../shared/components/custom-select/custom-select';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-member-general',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './general.html',
  styleUrl: './general.sass'
})
export class MemberGeneralComponent implements OnInit {
  private dialog = inject(MatDialog);

  @Input() member: Member | null = null;
  @Output() save = new EventEmitter<Partial<Member>>();
  @Output() closeDialog = new EventEmitter<void>();

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

  ngOnInit(): void {
    this.populateForm();
  }

  private populateForm(): void {
    if (!this.member) return;

    this.formData = {
      type: this.member.type || '',
      title: this.member.title || '',
      firstName: this.member.firstName || '',
      lastName: this.member.lastName || '',
      email: this.member.email || '',
      mobile: this.member.mobile || '',
      country: this.member.country || '',
      city: this.member.city || '',
      address: this.member.address || '',
      address2: this.member.address2 || '',
      zipcode: this.member.zipcode || ''
    };
  }

  onSave(): void {
    this.save.emit(this.formData);
  }

  onCancel(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'ביטול שינויים',
        message: 'האם אתה בטוח שברצונך לבטל את השינויים ולסגור?',
        confirmText: 'כן, סגור',
        cancelText: 'המשך עריכה'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.closeDialog.emit();
      }
    });
  }
}
