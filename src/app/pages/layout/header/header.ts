import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.sass'
})
export class HeaderComponent implements OnInit {
  private http = inject(HttpClient);

  searchText = '';

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
}
