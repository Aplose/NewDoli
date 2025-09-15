import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-third-parties',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="third-parties-container">
      <h1>Third Parties Management</h1>
      <p>Third parties management component - Coming soon!</p>
    </div>
  `,
  styles: [`
    .third-parties-container {
      padding: 2rem;
      text-align: center;
    }
  `]
})
export class ThirdPartiesComponent {}
