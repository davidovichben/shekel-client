import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.html',
  styleUrl: './splash.sass'
})
export class SplashComponent implements OnInit {
  private router = inject(Router);
  fadeOut = false;

  ngOnInit(): void {
    // Start fade out after 2.5 seconds
    setTimeout(() => {
      this.fadeOut = true;
    }, 2500);

    // Navigate after 3 seconds
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 3000);
  }
}
