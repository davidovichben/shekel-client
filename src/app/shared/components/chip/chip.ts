import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ChipVariant = 
  | 'pending' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled' 
  | 'active' 
  | 'approved' 
  | 'not-approved'
  | 'default';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chip.html',
  styleUrl: './chip.sass'
})
export class ChipComponent {
  @Input() variant: ChipVariant = 'default';
  @Input() label: string = '';
  @Input() customClass: string = '';
  @Input() backgroundColor: string = '';
  @Input() textColor: string = '';
  @Input() borderColor: string = '';
}

