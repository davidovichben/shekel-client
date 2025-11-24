import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MemberService } from '../../../core/services/network/member.service';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';

@Component({
  selector: 'app-member-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './member-form.html',
  styleUrl: './member-form.sass'
})
export class MemberFormComponent implements OnInit {
  private memberService = inject(MemberService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  memberId = '';

  member = {
    firstName: '',
    lastName: '',
    mobile: '',
    phone: '',
    email: '',
    gender: '',
    address: '',
    address2: '',
    city: '',
    country: '',
    zipcode: '',
    gregorianBirthDate: '',
    hebrewBirthDate: '',
    gregorianWeddingDate: '',
    hebrewWeddingDate: '',
    gregorianDeathDate: '',
    hebrewDeathDate: '',
    contactPerson: '',
    contactPersonType: '',
    tag: '',
    title: '',
    type: 'permanent',
    memberNumber: '',
    hasWebsiteAccount: false,
    shouldMail: false
  };

  typeOptions = [
    { value: 'permanent', label: 'קבוע' },
    { value: 'familyMember', label: 'בן משפחה' },
    { value: 'guest', label: 'אורח' },
    { value: 'supplier', label: 'ספק' },
    { value: 'primaryAdmin', label: 'מנהל' },
    { value: 'other', label: 'אחר' }
  ];

  genderOptions = [
    { value: 'male', label: 'זכר' },
    { value: 'female', label: 'נקבה' }
  ];

  contactPersonTypeOptions = [
    { value: 'child', label: 'ילד' },
    { value: 'parent', label: 'הורה' },
    { value: 'sibling', label: 'אח/אחות' },
    { value: 'spouse', label: 'בן/בת זוג' },
    { value: 'brother-in-law', label: 'גיס' },
    { value: 'grandparent', label: 'סב/סבתא' },
    { value: 'son-in-law', label: 'חתן' },
    { value: 'guest', label: 'אורח' },
    { value: 'phone_operator', label: 'מוקדן' },
    { value: 'other', label: 'אחר' }
  ];

  isSubmitting = false;

  ngOnInit(): void {
    const resolvedMember = this.route.snapshot.data['member'];
    if (resolvedMember) {
      this.isEditMode = true;
      this.memberId = resolvedMember.id;
      this.member = {
        firstName: resolvedMember.firstName || '',
        lastName: resolvedMember.lastName || '',
        mobile: resolvedMember.mobile || '',
        phone: resolvedMember.phone || '',
        email: resolvedMember.email || '',
        gender: resolvedMember.gender || '',
        address: resolvedMember.address || '',
        address2: resolvedMember.address2 || '',
        city: resolvedMember.city || '',
        country: resolvedMember.country || '',
        zipcode: resolvedMember.zipcode || '',
        gregorianBirthDate: resolvedMember.gregorianBirthDate || '',
        hebrewBirthDate: resolvedMember.hebrewBirthDate || '',
        gregorianWeddingDate: resolvedMember.gregorianWeddingDate || '',
        hebrewWeddingDate: resolvedMember.hebrewWeddingDate || '',
        gregorianDeathDate: resolvedMember.gregorianDeathDate || '',
        hebrewDeathDate: resolvedMember.hebrewDeathDate || '',
        contactPerson: resolvedMember.contactPerson || '',
        contactPersonType: resolvedMember.contactPersonType || '',
        tag: resolvedMember.tag || '',
        title: resolvedMember.title || '',
        type: resolvedMember.type || 'permanent',
        memberNumber: resolvedMember.memberNumber || '',
        hasWebsiteAccount: resolvedMember.hasWebsiteAccount || false,
        shouldMail: resolvedMember.shouldMail || false
      };
    }
  }

  onSubmit(): void {
    if (!this.member.firstName || !this.member.lastName) {
      return;
    }

    this.isSubmitting = true;

    const request = this.isEditMode
      ? this.memberService.update(this.memberId, this.member)
      : this.memberService.create(this.member);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/community']);
      },
      error: (error) => {
        console.error('Error saving member:', error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/community']);
  }
}
