import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlayersAndTeamComponent } from './players-and-team/players-and-team.component';
import { LocalStorageService } from './local-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PlayersAndTeamComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('letZCricket');

  constructor(protected readonly localStorage: LocalStorageService) {}

  resetMatch(): void {
    const confirmed = window.confirm('Are you sure, want to Reset Match?');

    if (!confirmed) {
      return;
    }

    this.localStorage.clearAll();
    window.location.reload();
  }
}
