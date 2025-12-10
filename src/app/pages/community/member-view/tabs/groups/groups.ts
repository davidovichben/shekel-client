import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Member } from '../../../../../core/entities/member.entity';
import { MemberGroupService } from '../../../../../core/services/network/member-group.service';
import { GroupService, Group } from '../../../../../core/services/network/group.service';

@Component({
  selector: 'app-member-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groups.html',
  styleUrl: './groups.sass'
})
export class MemberGroupsComponent implements OnInit {
  private memberGroupService = inject(MemberGroupService);
  private groupService = inject(GroupService);

  @Input() member: Member | null = null;

  searchText = '';
  memberGroups: Group[] = [];
  availableGroups: Group[] = [];
  showDropdown = false;
  isLoading = true;
  showCreateGroupInput = false;
  newGroupName = '';
  isCreating = false;
  removingGroupIds: Set<string> = new Set();
  private closeTimeout: any = null;

  ngOnInit(): void {
    if (this.member) {
      this.loadMemberGroups();
      this.loadAvailableGroups();
    }
  }

  private loadMemberGroups(): void {
    if (!this.member) return;

    this.isLoading = true;
    this.memberGroupService.getByMember(this.member.id).subscribe({
      next: (groups) => {
        this.memberGroups = groups;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadAvailableGroups(): void {
    if (!this.member) return;

    this.groupService.getAvailableGroups(this.member.id).subscribe(groups => {
      this.availableGroups = groups;
    });
  }

  get filteredGroups(): Group[] {
    const notInMember = this.availableGroups.filter(g => !this.memberGroups.find(mg => mg.id === g.id));
    if (!this.searchText) return notInMember;
    const search = this.searchText.toLowerCase();
    return notInMember.filter(g => g.name.includes(search));
  }

  onInputFocus(): void {
    this.showDropdown = true;
  }

  onInputBlur(): void {
    this.scheduleClose();
  }

  onCreateInputFocus(): void {
    this.cancelClose();
  }

  onCreateInputBlur(): void {
    this.scheduleClose();
  }

  private scheduleClose(): void {
    this.closeTimeout = setTimeout(() => {
      this.showDropdown = false;
      this.showCreateGroupInput = false;
      this.newGroupName = '';
    }, 200);
  }

  private cancelClose(): void {
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
      this.closeTimeout = null;
    }
  }

  toggleCreateGroup(): void {
    this.showCreateGroupInput = !this.showCreateGroupInput;
    if (!this.showCreateGroupInput) {
      this.newGroupName = '';
    }
  }

  createGroupAndAdd(): void {
    if (!this.member || !this.newGroupName.trim() || this.isCreating) return;

    this.isCreating = true;
    const groupName = this.newGroupName.trim();

    this.groupService.create({ name: groupName }).subscribe({
      next: (newGroup) => {
        this.memberGroupService.addToMember(this.member!.id, newGroup.id).subscribe({
          next: () => {
            this.memberGroups = [...this.memberGroups, newGroup];
            this.availableGroups = [...this.availableGroups, newGroup];
            this.newGroupName = '';
            this.showCreateGroupInput = false;
            this.showDropdown = false;
            this.searchText = '';
            this.isCreating = false;
          },
          error: () => {
            this.isCreating = false;
          }
        });
      },
      error: () => {
        this.isCreating = false;
      }
    });
  }

  addGroup(group: Group): void {
    if (!this.member) return;
    if (this.memberGroups.find(g => g.id === group.id)) return;

    this.memberGroupService.addToMember(this.member.id, group.id).subscribe(() => {
      this.memberGroups = [...this.memberGroups, group];
      this.searchText = '';
    });
  }

  removeGroup(group: Group): void {
    if (!this.member || this.removingGroupIds.has(group.id)) return;

    this.removingGroupIds.add(group.id);
    this.memberGroupService.removeFromMember(this.member.id, group.id).subscribe({
      next: () => {
        this.removingGroupIds.delete(group.id);
        this.memberGroups = this.memberGroups.filter(g => g.id !== group.id);
      },
      error: () => {
        this.removingGroupIds.delete(group.id);
      }
    });
  }

  isRemoving(groupId: string): boolean {
    return this.removingGroupIds.has(groupId);
  }
}
