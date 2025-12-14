import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsData, StatsType } from '../../../core/entities/stats.entity';

export type { StatsData, StatsType } from '../../../core/entities/stats.entity';

@Component({
  selector: 'app-stats-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats-panel.html',
  styleUrl: './stats-panel.sass'
})
export class StatsPanelComponent {
  @Input() stats: StatsData | null = null;
  @Input() type: StatsType = 'expenses';
  @Input() isLoading = false;

  // Color constants
  private readonly primaryBlue = '#0b1a51'; // Dark blue for highest percentage
  private readonly lightBlue = '#bfc7da';   // Light gray-blue for lowest percentage (chart-gray-light)

  /**
   * Get sorted categories by percentage (highest to lowest)
   */
  getSortedCategories(): Array<{ type: string; label: string; amount: string; percentage: number; rank: number }> {
    if (!this.stats?.categoryDistribution) return [];
    
    const sorted = [...this.stats.categoryDistribution].sort((a, b) => b.percentage - a.percentage);
    return sorted.map((cat, index) => ({ ...cat, rank: index }));
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 11, g: 26, b: 81 }; // Fallback to primary blue
  }

  /**
   * Interpolate between two colors
   * @param color1 Start color (hex)
   * @param color2 End color (hex)
   * @param factor Interpolation factor (0 = color1, 1 = color2)
   * @returns Interpolated color as hex string
   */
  private interpolateColor(color1: string, color2: string, factor: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    
    return `#${[r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  }

  /**
   * Get color for a category based on its rank
   * Uses solid color interpolation from primary blue to light blue
   */
  getCategoryColor(categoryType: string, rank: number, totalCategories: number): string {
    if (totalCategories <= 1) return this.primaryBlue;
    
    // Factor: 0 = primaryBlue (highest percentage), 1 = lightBlue (lowest percentage)
    const factor = rank / (totalCategories - 1);
    return this.interpolateColor(this.primaryBlue, this.lightBlue, factor);
  }

  getCategoryDashArray(category: any): string {
    const circumference = 2 * Math.PI * 32;
    const overlap = 2; // 2px overlap for seamless connection
    const dashLength = (circumference * category.percentage) / 100 + overlap;
    const gap = circumference - dashLength;
    return `${dashLength} ${gap}`;
  }

  getCategoryDashOffset(category: any, sortedCategories: any[], currentIndex: number): number {
    if (currentIndex === 0) return 0;
    
    const circumference = 2 * Math.PI * 32;
    const overlap = 2; // Same overlap as in dash array
    let offset = 0;
    for (let i = 0; i < currentIndex; i++) {
      const prevCategory = sortedCategories[i];
      if (prevCategory) {
        // Calculate where previous segment ends (including its overlap)
        // Then subtract overlap so next segment starts slightly before, creating overlap
        offset += (circumference * prevCategory.percentage) / 100;
      }
    }
    // Subtract the offset to position the segment correctly
    // The overlap in dashLength will create the visual overlap
    return -offset;
  }

  getTrendBarHeight(amount: string): string {
    if (!this.stats?.trend || this.stats.trend.length === 0) return '30px';
    
    const amounts = this.stats.trend.map(t => parseFloat(t.amount));
    const maxAmount = Math.max(...amounts);
    const currentAmount = parseFloat(amount);
    
    if (maxAmount === 0) return '30px';
    
    const percentage = (currentAmount / maxAmount) * 100;
    const minHeight = 30;
    const maxHeight = 100; // Reduced from 150 to make bars shorter
    const height = minHeight + (percentage / 100) * (maxHeight - minHeight);
    
    return `${height}px`;
  }

  formatMonth(month: string): string {
    const parts = month.split('-');
    if (parts.length === 2) {
      return `${parts[1]}/${parts[0].slice(-2)}`;
    }
    return month;
  }

  getUnpaidPercentage(): number {
    if (this.type === 'expenses') {
      return this.stats?.unpaidExpenses?.percentage || 0;
    } else {
      // Handle both uncollectedReceipts (from API) and uncollectedIncome (mapped)
      return this.stats?.uncollectedIncome?.percentage || (this.stats as any)?.uncollectedReceipts?.percentage || 0;
    }
  }

  getReversedTrend(): any[] {
    if (!this.stats?.trend) return [];
    return [...this.stats.trend].reverse();
  }

  getRingDashArray(): string {
    const circumference = 2 * Math.PI * 42;
    const unpaidPercent = this.getUnpaidPercentage();
    const dashLength = (circumference * unpaidPercent) / 100;
    return `${dashLength} ${circumference}`;
  }

  getRingDashOffset(): number {
    return 0;
  }

  getCurrentMonthHebrew(): string {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    const today = new Date();
    return months[today.getMonth()];
  }

  getUnpaidTotal(): string {
    if (this.type === 'expenses') {
      return this.stats?.unpaidExpenses?.total || '0';
    } else {
      // Handle both uncollectedReceipts (from API) and uncollectedIncome (mapped)
      return this.stats?.uncollectedIncome?.total || (this.stats as any)?.uncollectedReceipts?.total || '0';
    }
  }
}

