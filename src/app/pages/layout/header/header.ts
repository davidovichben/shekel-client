import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../core/services/local/user.service';
import { GenericService, SearchResults, SearchResultItem } from '../../../core/services/network/generic.service';
import { MemberService } from '../../../core/services/network/member.service';
import { IncomeService } from '../../../core/services/network/income.service';
import { MemberViewComponent } from '../../community/member-view/member-view';
import { DebtFormComponent } from '../../debts/debt-form/debt-form';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.sass'
})
export class HeaderComponent implements OnInit {
  private http = inject(HttpClient);
  private genericService = inject(GenericService);
  private memberService = inject(MemberService);
  private incomeService = inject(IncomeService);
  private dialog = inject(MatDialog);
  userService = inject(UserService);

  searchText = '';
  searchResults: SearchResults = { members: [], debts: [], receipts: [] };
  showDropdown = false;

  gregorianDate = '';
  hebrewDate = '';
  dayOfWeek = '';
  parasha = '';

  private hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  private hebrewNumbers = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳', 'י״א', 'י״ב', 'י״ג', 'י״ד', 'ט״ו', 'ט״ז', 'י״ז', 'י״ח', 'י״ט', 'כ׳', 'כ״א', 'כ״ב', 'כ״ג', 'כ״ד', 'כ״ה', 'כ״ו', 'כ״ז', 'כ״ח', 'כ״ט', 'ל׳'];

  ngOnInit(): void {
    this.updateDates();
    this.fetchParasha();
  }

  private updateDates(): void {
    const today = new Date();

    // Gregorian date
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    this.gregorianDate = `${day}/${month}/${year}`;

    // Day of week
    this.dayOfWeek = `יום ${this.hebrewDays[today.getDay()]}`;

    // Hebrew date using Intl API
    this.hebrewDate = this.getHebrewDate(today);
  }

  private getHebrewDate(date: Date): string {
    try {
      const hebrewFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        day: 'numeric',
        month: 'long'
      });
      const parts = hebrewFormatter.formatToParts(date);
      const dayPart = parts.find(p => p.type === 'day');
      const monthPart = parts.find(p => p.type === 'month');

      if (dayPart && monthPart) {
        const dayNum = parseInt(dayPart.value, 10);
        const hebrewDay = this.hebrewNumbers[dayNum] || dayPart.value;
        return `${hebrewDay} ${monthPart.value}`;
      }

      return hebrewFormatter.format(date);
    } catch {
      return '';
    }
  }

  private fetchParasha(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const url = `https://www.hebcal.com/shabbat?cfg=json&geonameid=293397&M=on&gy=${year}&gm=${month}&gd=${day}`;

    this.http.get<{ items: Array<{ category: string; hebrew?: string }> }>(url).subscribe({
      next: (response) => {
        const parashaItem = response.items?.find(item => item.category === 'parashat');
        if (parashaItem?.hebrew) {
          this.parasha = parashaItem.hebrew;
        }
      },
      error: () => {
        this.parasha = 'פרשת השבוע';
      }
    });
  }

  onSearch(query: string): void {
    this.searchText = query;
    if (query.trim().length > 1) {
      this.genericService.search(query).subscribe({
        next: (results) => {
          this.searchResults = results;
          this.showDropdown = this.hasResults();
        },
        error: () => {
          this.searchResults = {
            members: [{ id: '1', name: query + ' - חבר לדוגמה' }],
            debts: [{ id: '2', name: query + ' - חוב לדוגמה' }],
            receipts: []
          };
          this.showDropdown = true;
        }
      });
    } else {
      this.searchResults = { members: [], debts: [], receipts: [] };
      this.showDropdown = false;
    }
  }

  hasResults(): boolean {
    return this.searchResults.members.length > 0 ||
           this.searchResults.debts.length > 0 ||
           this.searchResults.receipts.length > 0;
  }

  onSearchFocus(): void {
    if (this.hasResults()) {
      this.showDropdown = true;
    }
  }

  clearSearch(): void {
    this.searchText = '';
    this.searchResults = { members: [], debts: [], receipts: [] };
    this.showDropdown = false;
  }

  onResultClick(item: SearchResultItem, type: 'member' | 'debt' | 'receipt'): void {
    this.showDropdown = false;
    this.clearSearch();

    switch (type) {
      case 'member':
        this.memberService.getOne(item.id).subscribe({
          next: (member) => {
            this.dialog.open(MemberViewComponent, {
              width: '95vw',
              maxWidth: '1400px',
              height: '720px',
              panelClass: 'member-view-dialog',
              autoFocus: false,
              data: { memberId: item.id, member }
            });
          }
        });
        break;
      case 'debt':
        this.dialog.open(DebtFormComponent, {
          data: { debt: { id: item.id } },
          width: '600px'
        });
        break;
      case 'receipt':
        this.incomeService.downloadReceipt(item.id).subscribe({
          next: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt_${item.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          },
          error: () => {
            // Do nothing if download fails
          }
        });
        break;
    }
  }

  hideDropdown(): void {
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }
}
