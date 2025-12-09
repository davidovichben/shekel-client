import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Member } from '../../../../../core/entities/member.entity';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog';

interface Group {
  id: string;
  name: string;
}

@Component({
  selector: 'app-member-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groups.html',
  styleUrl: './groups.sass'
})
export class MemberGroupsComponent {
  private dialog = inject(MatDialog);

  @Input() member: Member | null = null;
  @Output() save = new EventEmitter<string[]>();
  @Output() closeDialog = new EventEmitter<void>();

  searchText = '';

  // Mock data for member's current groups
  memberGroups: Group[] = [
    { id: '1', name: 'משפחת לוי המורחבת' },
    { id: '2', name: 'מנין נץ' },
    { id: '3', name: 'שבת חתן יהודה לוי' },
    { id: '4', name: 'שבת חתן ראובן שמחוני' }
  ];

  // Mock data for available groups to search
  availableGroups: Group[] = [
    { id: '5', name: 'שיעור דף יומי' },
    { id: '6', name: 'ועד בית הכנסת' },
    { id: '7', name: 'קבוצת נוער' }
  ];

  get filteredGroups(): Group[] {
    if (!this.searchText) return [];
    const search = this.searchText.toLowerCase();
    return this.availableGroups.filter(g =>
      g.name.includes(search) && !this.memberGroups.find(mg => mg.id === g.id)
    );
  }

  addGroup(group: Group): void {
    if (!this.memberGroups.find(g => g.id === group.id)) {
      this.memberGroups = [...this.memberGroups, group];
    }
    this.searchText = '';
  }

  removeGroup(group: Group): void {
    this.memberGroups = this.memberGroups.filter(g => g.id !== group.id);
  }

  onSave(): void {
    this.save.emit(this.memberGroups.map(g => g.id));
  }

  onCancel(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      panelClass: 'confirm-dialog-panel',
      backdropClass: 'confirm-dialog-backdrop',
      enterAnimationDuration: '0ms',
      exitAnimationDuration: '0ms',
      data: {
        title: 'ביטול שינויים',
        message: 'האם אתה בטוח שברצונך לבטל את השינויים ולסגור?',
        confirmText: 'כן, סגור',
        cancelText: 'המשך עריכה'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.closeDialog.emit();
      }
    });
  }
}
