import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../../../../core/entities/notification.entity';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-item.html',
  styleUrl: './notification-item.sass'
})
export class NotificationItemComponent {
  @Input() notification!: Notification;
  @Input() isLoading = false;
  @Output() markAsRead = new EventEmitter<Notification>();
  @Output() openMemberCard = new EventEmitter<string>();

  onMarkAsRead(): void {
    if (!this.isLoading) {
      this.markAsRead.emit(this.notification);
    }
  }

  onActionClick(): void {
    if (this.notification.type === 'member') {
      this.openMemberCard.emit(this.notification.type_id);
    } else if (this.notification.type === 'income') {
      window.open('/incomes', '_blank');
    }
  }
}
