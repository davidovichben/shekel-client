import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MemberService } from '../../../core/services/network/member.service';
import { Member } from '../../../core/entities/member.entity';

interface MemberListItem {
  id: string;
  name: string;
}

@Component({
  selector: 'app-member-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './member-autocomplete.html',
  styleUrl: './member-autocomplete.sass'
})
export class MemberAutocompleteComponent implements OnInit, OnChanges {
  private memberService = inject(MemberService);
  private elementRef = inject(ElementRef);
  private searchSubject = new Subject<string>();
  private initialMemberLoaded = false;

  @Input() placeholder = 'חיפוש...';
  @Input() memberId = '';
  @Input() memberName = '';
  @Input() memberType?: string; // Filter by member type (e.g., 'supplier')
  @Output() memberIdChange = new EventEmitter<string>();
  @Output() memberNameChange = new EventEmitter<string>();
  @Output() memberSelected = new EventEmitter<Member>();

  searchQuery = '';
  filteredMembers: MemberListItem[] = [];
  showDropdown = false;
  isLoading = false;

  ngOnInit(): void {
    this.searchQuery = this.memberName;

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchMembers(query);
    });

    // Load initial list
    this.searchMembers('');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['memberId'] && this.memberId && !this.initialMemberLoaded) {
      this.initialMemberLoaded = true;
      this.loadMemberById(this.memberId);
    }
  }

  private loadMemberById(id: string): void {
    this.isLoading = true;
    this.memberService.getOne(id).subscribe({
      next: (member) => {
        this.memberId = member.id;
        this.memberName = member.fullName;
        this.searchQuery = member.fullName;
        this.isLoading = false;
        this.memberSelected.emit(member);
      },
      error: (error) => {
        console.error('Error loading member:', error);
        this.isLoading = false;
        this.searchMembers('');
      }
    });
  }

  private searchMembers(query: string): void {
    this.isLoading = true;
    
    // If memberType is specified, use getAll to get full Member objects with type
    if (this.memberType) {
      const params: { type: string; page: number; limit: number; search?: string } = {
        type: this.memberType,
        page: 1,
        limit: 10
      };
      
      // Only add search if query is not empty
      if (query && query.trim()) {
        params.search = query.trim();
      }
      
      this.memberService.getAll(params).subscribe({
        next: (response) => {
          this.filteredMembers = response.rows.map(m => ({
            id: m.id,
            name: m.fullName
          }));
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading members:', error);
          this.isLoading = false;
          this.filteredMembers = [];
        }
      });
    } else {
      // Use list for better performance when no type filter is needed
      this.memberService.list(query).subscribe({
        next: (members) => {
          this.filteredMembers = members.slice(0, 10);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading members:', error);
          this.isLoading = false;
          this.filteredMembers = [];
        }
      });
    }
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery.trim());
    this.showDropdown = true;
  }

  selectMember(member: MemberListItem): void {
    this.memberId = member.id;
    this.memberName = member.name;
    this.searchQuery = member.name;
    this.showDropdown = false;
    this.memberIdChange.emit(member.id);
    this.memberNameChange.emit(member.name);

    // Fetch full member details
    this.isLoading = true;
    this.memberService.getOne(member.id).subscribe({
      next: (fullMember) => {
        this.isLoading = false;
        this.memberSelected.emit(fullMember);
      },
      error: (error) => {
        console.error('Error loading member details:', error);
        this.isLoading = false;
      }
    });
  }

  onFocus(): void {
    if (this.filteredMembers.length > 0) {
      this.showDropdown = true;
    } else {
      this.searchMembers(this.searchQuery.trim());
      this.showDropdown = true;
    }
  }

  onReset(): void {
    this.searchQuery = '';
    this.memberId = '';
    this.memberName = '';
    this.showDropdown = false;
    this.memberIdChange.emit('');
    this.memberNameChange.emit('');
    this.searchMembers('');
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }
}
