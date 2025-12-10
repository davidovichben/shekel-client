import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PaymentComponent } from '../../payment/payment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.sass'
})
export class SidebarComponent {
  private dialog = inject(MatDialog);

  openPaymentDialog(): void {
    this.dialog.open(PaymentComponent, {
      width: '80%',
      panelClass: 'payment-dialog-panel'
    });
  }
}
