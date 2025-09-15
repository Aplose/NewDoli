import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="groups-container">
      <h1>Groups Management</h1>
      <p>Groups management component - Coming soon!</p>
    </div>
  `,
  styles: [`
    .groups-container {
      padding: 2rem;
      text-align: center;
    }
  `]
})
export class GroupsComponent {}
