import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../../core/services/network/notification.service';
import { BusinessService, MessageTemplate } from '../../../../core/services/network/business.service';
import { MemberService } from '../../../../core/services/network/member.service';
import { NotificationItemComponent } from './notification-item/notification-item';
import { Notification } from '../../../../core/entities/notification.entity';
import { MemberViewComponent } from '../../../community/member-view/member-view';

@Component({
  selector: 'app-notifications-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationItemComponent],
  templateUrl: './notifications-tab.html',
  styleUrl: './notifications-tab.sass'
})
export class NotificationsTabComponent implements OnInit {
  activeSubTab: 'new' | 'archive' = 'new';
  reminderTemplate: MessageTemplate = { subject: '', content: '' };
  notifications: Notification[] = [];
  isLoading = false;
  isMarkingAll = false;
  markingReadId: string | null = null;

  currentPage = 1;
  totalPages = 1;
  pageSize = 10;

  isSavingTemplate = false;
  isResettingTemplate = false;
  templateSaved = false;

  constructor(
    private notificationService: NotificationService,
    private businessService: BusinessService,
    private memberService: MemberService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadMessageTemplate();
  }

  private loadNotifications(): void {
    this.isLoading = true;
    const request = this.activeSubTab === 'new'
      ? this.notificationService.getUnread(this.currentPage, this.pageSize)
      : this.notificationService.getRead(this.currentPage, this.pageSize);

    request.subscribe({
      next: (response: any) => {
        this.notifications = response.rows;
        this.totalPages = response.counts?.totalPages || response.counts?.total_pages || 1;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadMessageTemplate(): void {
    this.businessService.show().subscribe((business: any) => {
      if (business.message_template) {
        if (typeof business.message_template === 'string') {
          this.reminderTemplate.content = business.message_template;
        } else {
          this.reminderTemplate = business.message_template;
        }
      }
    });
  }

  @Output() saveTemplate = new EventEmitter<MessageTemplate>();

  setSubTab(tab: 'new' | 'archive'): void {
    this.activeSubTab = tab;
    this.currentPage = 1;
    this.loadNotifications();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadNotifications();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  markAllAsRead(): void {
    this.isMarkingAll = true;
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.isMarkingAll = false;
        this.loadNotifications();
      },
      error: () => {
        this.isMarkingAll = false;
      }
    });
  }

  markAsRead(notification: Notification): void {
    this.markingReadId = notification.id;
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.markingReadId = null;
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
      },
      error: () => {
        this.markingReadId = null;
      }
    });
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  onSaveTemplate(): void {
    this.isSavingTemplate = true;
    this.templateSaved = false;
    this.businessService.saveMessageTemplate(this.reminderTemplate.content).subscribe({
      next: () => {
        this.isSavingTemplate = false;
        this.templateSaved = true;
        setTimeout(() => this.templateSaved = false, 2000);
      },
      error: () => {
        this.isSavingTemplate = false;
      }
    });
  }

  onResetTemplate(): void {
    this.isResettingTemplate = true;
    this.businessService.resetMessageTemplate().subscribe({
      next: (response: any) => {
        this.isResettingTemplate = false;
        if (response.message_template) {
          if (typeof response.message_template === 'string') {
            this.reminderTemplate.content = response.message_template;
          } else {
            this.reminderTemplate = response.message_template;
          }
        }
      },
      error: () => {
        this.isResettingTemplate = false;
      }
    });
  }

  onOpenMemberCard(memberId: string): void {
    this.memberService.getOne(memberId).subscribe({
      next: (member) => {
        this.dialog.open(MemberViewComponent, {
          width: '95vw',
          maxWidth: '1400px',
          height: '720px',
          panelClass: 'member-view-dialog',
          autoFocus: false,
          disableClose: true,
          data: { memberId, member }
        });
      }
    });
  }
}
