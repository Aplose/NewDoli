import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-container">
      <h1>User Form</h1>
      <p>User form component - Coming soon!</p>
    </div>
  `,
  styles: [`
    .form-container {
      padding: 2rem;
      text-align: center;
    }
  `]
})
export class UserFormComponent {}
