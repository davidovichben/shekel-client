import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { SplashComponent } from './pages/splash/splash';
import { LayoutComponent } from './pages/layout/layout';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { CommunityComponent } from './pages/community/community';
import { MemberFormComponent } from './pages/community/member-form/member-form';
import { DebtsComponent } from './pages/debts/debts';
import { InvoicesComponent } from './pages/invoices/invoices';
import { ExpensesComponent } from './pages/expenses/expenses';
import { IncomesComponent } from './pages/incomes/incomes';
import { SystemSettingsComponent } from './pages/system-settings/system-settings';
import { GeneralTabComponent } from './pages/system-settings/tabs/general-tab/general-tab';
import { CategoriesTabComponent } from './pages/system-settings/tabs/categories-tab/categories-tab';
import { PackagesTabComponent } from './pages/system-settings/tabs/packages-tab/packages-tab';
import { NotificationsTabComponent } from './pages/system-settings/tabs/notifications-tab/notifications-tab';
import { SecurityTabComponent } from './pages/system-settings/tabs/security-tab/security-tab';
import { memberResolver } from './core/resolvers/member.resolver';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'splash', component: SplashComponent, canActivate: [authGuard] },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'community', component: CommunityComponent },
      { path: 'community/new', component: MemberFormComponent },
      { path: 'community/edit/:id', component: MemberFormComponent, resolve: { member: memberResolver } },
      { path: 'debts', component: DebtsComponent },
      { path: 'expenses', component: ExpensesComponent },
      { path: 'incomes', component: IncomesComponent },
      { path: 'invoices', component: InvoicesComponent },
      {
        path: 'settings',
        component: SystemSettingsComponent,
        children: [
          { path: '', redirectTo: 'general', pathMatch: 'full' },
          { path: 'general', component: GeneralTabComponent },
          { path: 'categories', component: CategoriesTabComponent },
          { path: 'packages', component: PackagesTabComponent },
          { path: 'notifications', component: NotificationsTabComponent },
          { path: 'security', component: SecurityTabComponent }
        ]
      }
    ]
  }
];
