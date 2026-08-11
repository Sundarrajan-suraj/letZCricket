import { Component, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PlayersAndTeamComponent } from './players-and-team/players-and-team.component';
import { LocalStorageService } from './local-storage.service';
import { ResetOptionsModal } from './reset-options-modal/reset-options-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PlayersAndTeamComponent, ResetOptionsModal, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('letZCricket');

  showModal = false;
  resetChoice: 'same' | 'new' | null = null;

  constructor(protected readonly localStorage: LocalStorageService) {}
  resetMatch() {
    this.showModal = true;
  }

  handleModalClose(choice: 'same' | 'new' | null) {
    this.showModal = false;
    if (!choice) {
      return;
    }

    if (choice === 'same') {
      this.clearMatchData();
    } else if (choice === 'new') {
      this.localStorage.clearAll();
    }

    window.location.reload();
  }

  private clearMatchData() {
    // Clear only match-related data
    const matchKeys = ['match__started', 'match__state', 'match__score']; // example keys
    matchKeys.forEach(key => this.localStorage.deleteObject(key));
  }
}