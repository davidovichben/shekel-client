import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { DebtService } from '../services/network/debt.service';
import { Debt } from '../entities/debt.entity';

export const debtResolver: ResolveFn<Debt> = (route) => {
  const debtService = inject(DebtService);
  const id = route.paramMap.get('id')!;
  return debtService.getOne(id);
};
