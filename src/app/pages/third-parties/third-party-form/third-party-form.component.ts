import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-third-party-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-container">
      <h1>Third Party Form</h1>
      <p>Third party form component - Coming soon!</p>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 2rem;
      text-align: center;
    }
  `]
})
export class ThirdPartyFormComponent {}
