import { Component, OnInit, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../core/services/local/user.service';
import { AuthService } from '../../../core/services/network/auth.service';
import { GenericService } from '../../../core/services/network/generic.service';
import { StatsService, SearchResults, SearchResultItem } from '../../../core/services/network/stats.service';
import { BusinessService } from '../../../core/services/network/business.service';
import { MemberService } from '../../../core/services/network/member.service';
import { IncomeService } from '../../../core/services/network/income.service';
import { NotificationService } from '../../../core/services/network/notification.service';
import { Notification } from '../../../core/entities/notification.entity';
import { MemberViewComponent } from '../../community/member-view/member-view';
import { DebtFormComponent } from '../../debts/debt-form/debt-form';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.sass'
})
export class HeaderComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private genericService = inject(GenericService);
  private statsService = inject(StatsService);
  private memberService = inject(MemberService);
  private incomeService = inject(IncomeService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private businessService = inject(BusinessService);
  private dialog = inject(MatDialog);
  private elementRef = inject(ElementRef);
  userService = inject(UserService);

  packageName = '';

  searchText = '';
  searchResults: SearchResults = { members: [], debts: [], receipts: [] };
  showDropdown = false;

  gregorianDate = '';
  hebrewDate = '';
  dayOfWeek = '';
  parasha = '';

  // Notifications
  showNotifications = false;
  notifications: Notification[] = [];
  totalNotifications = 0;
  isLoadingNotifications = false;
  isMarkingAllRead = false;
  markingReadId: string | null = null;

  // User menu
  showUserMenu = false;

  private hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  private hebrewNumbers = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳', 'י״א', 'י״ב', 'י״ג', 'י״ד', 'ט״ו', 'ט״ז', 'י״ז', 'י״ח', 'י״ט', 'כ׳', 'כ״א', 'כ״ב', 'כ״ג', 'כ״ד', 'כ״ה', 'כ״ו', 'כ״ז', 'כ״ח', 'כ״ט', 'ל׳'];

  ngOnInit(): void {
    this.updateDates();
    this.fetchParasha();
    this.checkUnreadNotifications();
    this.loadPackageName();
  }

  private loadPackageName(): void {
    this.businessService.show().subscribe({
      next: (business) => {
        if (business.package_id) {
          this.genericService.getPackages().subscribe({
            next: (packages) => {
              const pkg = packages.find(p => p.id === business.package_id);
              if (pkg) {
                this.packageName = pkg.name;
              }
            }
          });
        }
      }
    });
  }

  private checkUnreadNotifications(): void {
    this.notificationService.getUnread(1, 1).subscribe({
      next: (response: any) => {
        this.totalNotifications = response.counts?.totalRows || response.counts?.total_rows || response.rows.length;
      }
    });
  }

  private updateDates(): void {
    const today = new Date();

    // Gregorian date
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    this.gregorianDate = `${day}/${month}/${year}`;

    // Day of week
    this.dayOfWeek = `יום ${this.hebrewDays[today.getDay()]}`;

    // Hebrew date using Intl API
    this.hebrewDate = this.getHebrewDate(today);
  }

  private getHebrewDate(date: Date): string {
    try {
      const hebrewFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        day: 'numeric',
        month: 'long'
      });
      const parts = hebrewFormatter.formatToParts(date);
      const dayPart = parts.find(p => p.type === 'day');
      const monthPart = parts.find(p => p.type === 'month');

      if (dayPart && monthPart) {
        const dayNum = parseInt(dayPart.value, 10);
        const hebrewDay = this.hebrewNumbers[dayNum] || dayPart.value;
        return `${hebrewDay} ${monthPart.value}`;
      }

      return hebrewFormatter.format(date);
    } catch {
      return '';
    }
  }

  private fetchParasha(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const url = `https://www.hebcal.com/shabbat?cfg=json&geonameid=293397&M=on&gy=${year}&gm=${month}&gd=${day}`;

    this.http.get<{ items: Array<{ category: string; hebrew?: string }> }>(url).subscribe({
      next: (response) => {
        const parashaItem = response.items?.find(item => item.category === 'parashat');
        if (parashaItem?.hebrew) {
          this.parasha = parashaItem.hebrew;
        }
      },
      error: () => {
        this.parasha = 'פרשת השבוע';
      }
    });
  }

  onSearch(query: string): void {
    this.searchText = query;
    if (query.trim().length > 1) {
      this.statsService.search(query).subscribe({
        next: (results) => {
          this.searchResults = results;
          this.showDropdown = this.hasResults();
        },
        error: () => {
          this.searchResults = {
            members: [{ id: '1', name: query + ' - חבר לדוגמה' }],
            debts: [{ id: '2', name: query + ' - חוב לדוגמה' }],
            receipts: []
          };
          this.showDropdown = true;
        }
      });
    } else {
      this.searchResults = { members: [], debts: [], receipts: [] };
      this.showDropdown = false;
    }
  }

  hasResults(): boolean {
    return this.searchResults.members.length > 0 ||
           this.searchResults.debts.length > 0 ||
           this.searchResults.receipts.length > 0;
  }

  onSearchFocus(): void {
    if (this.hasResults()) {
      this.showDropdown = true;
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.searchResults = { members: [], debts: [], receipts: [] };
    this.showDropdown = false;
  }

  onResultClick(item: SearchResultItem, type: 'member' | 'debt' | 'receipt'): void {
    this.showDropdown = false;
    this.clearSearch();

    switch (type) {
      case 'member':
        this.memberService.getOne(item.id).subscribe({
          next: (member) => {
            this.dialog.open(MemberViewComponent, {
              width: '95vw',
              maxWidth: '1400px',
              height: '720px',
              panelClass: 'member-view-dialog',
              autoFocus: false,
              disableClose: true,
              data: { memberId: item.id, member }
            });
          }
        });
        break;
      case 'debt':
        this.dialog.open(DebtFormComponent, {
          data: { debt: { id: item.id } },
          width: '600px',
          disableClose: false
        });
        break;
      case 'receipt':
        this.incomeService.downloadReceipt(item.id).subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt_${item.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          },
          error: () => {
            // Do nothing if download fails
          }
        });
        break;
    }
  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  // User menu methods
  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  // Notifications methods
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
      this.loadNotifications();
    }
  }

  private loadNotifications(): void {
    this.isLoadingNotifications = true;
    this.notificationService.getUnread(1, 7).subscribe({
      next: (response: any) => {
        this.notifications = response.rows.slice(0, 7);
        this.totalNotifications = response.counts?.totalRows || response.counts?.total_rows || response.rows.length;
        this.isLoadingNotifications = false;
      },
      error: () => {
        this.isLoadingNotifications = false;
      }
    });
  }

  goToNotifications(): void {
    this.showNotifications = false;
    this.router.navigate(['/settings/notifications']);
  }

  markAllAsRead(): void {
    this.isMarkingAllRead = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.isMarkingAllRead = false;
        this.notifications = [];
        this.totalNotifications = 0;
      },
      error: () => {
        this.isMarkingAllRead = false;
      }
    });
  }

  markAsRead(notification: Notification): void {
    this.markingReadId = notification.id;
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.totalNotifications = Math.max(0, this.totalNotifications - 1);
        this.markingReadId = null;

        // Load more if there are more unread notifications
        if (this.totalNotifications > this.notifications.length && this.notifications.length < 7) {
          this.loadMoreNotification();
        }
      },
      error: () => {
        this.markingReadId = null;
      }
    });
  }

  private loadMoreNotification(): void {
    this.notificationService.getUnread(1, 7).subscribe({
      next: (response: any) => {
        const newNotifications = response.rows.filter(
          (n: Notification) => !this.notifications.some(existing => existing.id === n.id)
        );
        if (newNotifications.length > 0) {
          this.notifications = [...this.notifications, ...newNotifications].slice(0, 7);
        }
      }
    });
  }

  onNotificationAction(notification: Notification): void {
    if (notification.type === 'member') {
      this.memberService.getOne(notification.type_id).subscribe({
        next: (member) => {
          this.showNotifications = false;
          this.dialog.open(MemberViewComponent, {
            width: '95vw',
            maxWidth: '1400px',
            height: '720px',
            panelClass: 'member-view-dialog',
            autoFocus: false,
            disableClose: true,
            data: { memberId: notification.type_id, member }
          });
        }
      });
    } else if (notification.type === 'income') {
      this.showNotifications = false;
      window.open('/incomes', '_blank');
    }
  }

  formatNotificationTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `לפני ${diffMins} דק'`;
    } else if (diffHours < 24) {
      return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const notificationBell = this.elementRef.nativeElement.querySelector('.notification-bell');
    const notificationDropdown = this.elementRef.nativeElement.querySelector('.notification-dropdown');

    if (notificationBell && !notificationBell.contains(target) &&
        notificationDropdown && !notificationDropdown.contains(target)) {
      this.showNotifications = false;
    }

    const userSection = this.elementRef.nativeElement.querySelector('.user-section');
    if (userSection && !userSection.contains(target)) {
      this.showUserMenu = false;
    }
  }
}
