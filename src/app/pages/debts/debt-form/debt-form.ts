import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DebtService } from '../../../core/services/network/debt.service';
import { CustomSelectComponent } from '../../../shared/components/custom-select/custom-select';

@Component({
  selector: 'app-debt-form',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './debt-form.html',
  styleUrl: './debt-form.sass'
})
export class DebtFormComponent implements OnInit {
  private debtService = inject(DebtService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditMode = false;
  debtId = '';

  debt = {
    memberId: '',
    fullName: '',
    amount: 0,
    description: '',
    hebrewDate: '',
    gregorianDate: '',
    autoPaymentApproved: false,
    status: 'active'
  };

  statusOptions = [
    { value: 'active', label: 'חוב פעיל' },
    { value: 'paid', label: 'שולם' },
    { value: 'cancelled', label: 'בוטל' }
  ];

  isSubmitting = false;

  ngOnInit(): void {
    const resolvedDebt = this.route.snapshot.data['debt'];
    if (resolvedDebt) {
      this.isEditMode = true;
      this.debtId = resolvedDebt.id;
      this.debt = {
        memberId: resolvedDebt.memberId || '',
        fullName: resolvedDebt.fullName || '',
        amount: resolvedDebt.amount || 0,
        description: resolvedDebt.description || '',
        hebrewDate: resolvedDebt.hebrewDate || '',
        gregorianDate: resolvedDebt.gregorianDate || '',
        autoPaymentApproved: resolvedDebt.autoPaymentApproved || false,
        status: resolvedDebt.status || 'active'
      };
    }
  }

  onSubmit(): void {
    if (!this.debt.fullName || !this.debt.amount) {
      return;
    }

    this.isSubmitting = true;

    const request = this.isEditMode
      ? this.debtService.update(this.debtId, this.debt)
      : this.debtService.create(this.debt);

    request.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/debts']);
      },
      error: (error) => {
        console.error('Error saving debt:', error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/debts']);
  }
}
