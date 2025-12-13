import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { GroupService, Group } from '../../../core/services/network/group.service';
import { Member } from '../../../core/entities/member.entity';
import { MemberAutocompleteComponent } from '../../../shared/components/member-autocomplete/member-autocomplete';
import { DialogHeaderComponent } from '../../../shared/components/dialog-header/dialog-header';

export interface GroupDialogData {
  groupId: string;
  groupName?: string;
}

@Component({
  selector: 'app-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MemberAutocompleteComponent,
    DialogHeaderComponent
  ],
  templateUrl: './group-dialog.html',
  styleUrl: './group-dialog.sass'
})
export class GroupDialogComponent implements OnInit {
  private groupService = inject(GroupService);
  public dialogRef = inject(MatDialogRef<GroupDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as GroupDialogData;

  isEditMode = false;
  group: Group | null = null;
  members: Member[] = [];
  isLoading = true;
  isSaving = false;
  isRemovingMember: Set<string> = new Set();
  isAddingMember = false;

  // Edit mode fields
  groupName = '';
  selectedMemberId = '';
  selectedMemberName = '';

  ngOnInit(): void {
    this.loadGroupData();
  }

  getDialogTitle(): string {
    if (this.isEditMode) {
      return 'עריכת קבוצה';
    }
    return this.group?.name ? this.group.name + ':' : '';
  }

  private loadGroupData(): void {
    this.isLoading = true;
    this.groupService.getOne(this.data.groupId).subscribe({
      next: (group) => {
        this.group = group;
        this.groupName = group.name;
        this.loadMembers();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadMembers(): void {
    this.groupService.getGroupMembers(this.data.groupId).subscribe({
      next: (members) => {
        this.members = members;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onEdit(): void {
    this.isEditMode = true;
  }

  onCancel(): void {
    this.isEditMode = false;
    this.groupName = this.group?.name || '';
    this.selectedMemberId = '';
    this.selectedMemberName = '';
  }

  onMemberSelected(member: Member): void {
    if (this.isAddingMember) return;
    if (this.members.find(m => m.id === member.id)) return;

    this.isAddingMember = true;
    this.groupService.addMember(this.data.groupId, member.id).subscribe({
      next: () => {
        this.members = [...this.members, member];
        this.selectedMemberId = '';
        this.selectedMemberName = '';
        this.isAddingMember = false;
      },
      error: () => {
        this.isAddingMember = false;
      }
    });
  }

  removeMember(member: Member): void {
    if (this.isRemovingMember.has(member.id)) return;

    this.isRemovingMember.add(member.id);
    this.groupService.removeMember(this.data.groupId, member.id).subscribe({
      next: () => {
        this.members = this.members.filter(m => m.id !== member.id);
        this.isRemovingMember.delete(member.id);
      },
      error: () => {
        this.isRemovingMember.delete(member.id);
      }
    });
  }

  onSave(): void {
    if (!this.groupName.trim() || this.isSaving) return;

    this.isSaving = true;
    const nameChanged = this.groupName.trim() !== this.group?.name;

    if (nameChanged) {
      this.groupService.update(this.data.groupId, { name: this.groupName.trim() }).subscribe({
        next: (updatedGroup) => {
          this.group = updatedGroup;
          this.isEditMode = false;
          this.isSaving = false;
          this.dialogRef.close(true);
        },
        error: () => {
          this.isSaving = false;
        }
      });
    } else {
      this.isEditMode = false;
      this.isSaving = false;
      this.dialogRef.close(true);
    }
  }

  onClose(): void {
    this.dialogRef.close(false);
  }
}

