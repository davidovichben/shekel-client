import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Member } from '../../../../../core/entities/member.entity';

@Component({
  selector: 'app-member-groups',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './groups.html',
  styleUrl: './groups.sass'
})
export class MemberGroupsComponent {
  @Input() member: Member | null = null;
}
