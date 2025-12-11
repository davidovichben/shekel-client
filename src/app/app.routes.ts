import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { LayoutComponent } from './pages/layout/layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { CommunityComponent } from './pages/community/community';
import { MemberFormComponent } from './pages/community/member-form/member-form';
import { DebtsComponent } from './pages/debts/debts';
import { InvoicesComponent } from './pages/invoices/invoices';
import { ExpensesComponent } from './pages/expenses/expenses';
import { memberResolver } from './core/resolvers/member.resolver';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'community', component: CommunityComponent },
      { path: 'community/new', component: MemberFormComponent },
      { path: 'community/edit/:id', component: MemberFormComponent, resolve: { member: memberResolver } },
      { path: 'debts', component: DebtsComponent },
      { path: 'expenses', component: ExpensesComponent },
      { path: 'invoices', component: InvoicesComponent }
    ]
  }
];
