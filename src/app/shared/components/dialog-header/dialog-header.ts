import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-header.html',
  styleUrl: './dialog-header.sass'
})
export class DialogHeaderComponent {
  @Input() title: string = '';
  @Input() iconPath?: string;
  @Input() showCloseButton: boolean = true;
  @Input() closeIconPath: string = '/assets/icons/close-icon.svg';
  @Input() variant: 'primary' | 'default' = 'primary';

  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}

