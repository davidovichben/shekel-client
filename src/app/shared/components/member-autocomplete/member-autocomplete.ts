import { Component, Input, Output, EventEmitter, OnInit, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/network/member.service';
import { Member } from '../../../core/entities/member.entity';

@Component({
  selector: 'app-member-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-autocomplete.html',
  styleUrl: './member-autocomplete.sass'
})
export class MemberAutocompleteComponent implements OnInit {
  private memberService = inject(MemberService);
  private elementRef = inject(ElementRef);

  @Input() placeholder = 'חיפוש...';
  @Input() memberId = '';
  @Input() memberName = '';
  @Output() memberIdChange = new EventEmitter<string>();
  @Output() memberNameChange = new EventEmitter<string>();
  @Output() memberSelected = new EventEmitter<Member>();

  searchQuery = '';
  allMembers: Member[] = [];
  filteredMembers: Member[] = [];
  showDropdown = false;
  isLoading = false;

  ngOnInit(): void {
    this.searchQuery = this.memberName;
    this.loadAllMembers();
  }

  private loadAllMembers(): void {
    this.isLoading = true;
    this.memberService.getAll({ limit: 10000 }).subscribe({
      next: (response) => {
        this.allMembers = response.rows;
        this.filteredMembers = this.allMembers.slice(0, 10);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    const query = this.searchQuery.toLowerCase().trim();
    if (query.length > 0) {
      this.filteredMembers = this.allMembers.filter(member =>
        member.fullName?.toLowerCase().includes(query) ||
        member.firstName?.toLowerCase().includes(query) ||
        member.lastName?.toLowerCase().includes(query)
      ).slice(0, 10);
    } else {
      this.filteredMembers = this.allMembers.slice(0, 10);
    }
    this.showDropdown = this.filteredMembers.length > 0;
  }

  selectMember(member: Member): void {
    this.memberId = member.id;
    this.memberName = member.fullName;
    this.searchQuery = member.fullName;
    this.showDropdown = false;
    this.memberIdChange.emit(member.id);
    this.memberNameChange.emit(member.fullName);
    this.memberSelected.emit(member);
  }

  onFocus(): void {
    if (this.allMembers.length > 0) {
      if (this.searchQuery.trim().length > 0) {
        this.onSearch();
      } else {
        this.filteredMembers = this.allMembers.slice(0, 10);
      }
      this.showDropdown = this.filteredMembers.length > 0;
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
