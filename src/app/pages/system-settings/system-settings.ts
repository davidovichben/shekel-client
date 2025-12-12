import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './system-settings.html',
  styleUrl: './system-settings.sass'
})
export class SystemSettingsComponent {
  tabs = [
    { id: 'general', label: 'כללי', route: 'general' },
    { id: 'categories', label: 'ניהול קטגוריות', route: 'categories' },
    { id: 'packages', label: 'מנוי ושדרוג תכנית', route: 'packages' },
    { id: 'notifications', label: 'התראות והודעות', route: 'notifications' },
    { id: 'security', label: 'אבטחה ושחזור', route: 'security' }
  ];
}
