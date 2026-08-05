import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../local-storage.service';
import { ScorerComponent } from '../scorer/scorer.component';

interface TeamPlayerEntry {
  team: 'A' | 'B';
  players: string[];
}

@Component({
  selector: 'app-players-and-team',
  standalone: true,
  imports: [CommonModule, FormsModule, ScorerComponent],
  templateUrl: './players-and-team.component.html',
  styleUrl: './players-and-team.component.scss'
})
export class PlayersAndTeamComponent implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);

  teamAPlayers: string[] = ['', ''];
  teamBPlayers: string[] = ['', ''];
  battingFirstTeam: 'A' | 'B' = 'A';
  isLoading = true;
  matchStarted = false;
  readonly minPlayers = 2;
  readonly maxPlayers = 11;

  ngOnInit(): void {
    this.restoreSavedData();
  }

  addPlayer(): void {
    if (this.teamAPlayers.length < this.maxPlayers && this.teamBPlayers.length < this.maxPlayers) {
      this.teamAPlayers.push('');
      this.teamBPlayers.push('');
    }
  }

  removePlayer(): void {
    if (this.canRemovePlayer) {
      this.teamAPlayers.splice(this.teamAPlayers.length - 1, 1);
      this.teamBPlayers.splice(this.teamBPlayers.length - 1, 1);
    }
  }

  updatePlayer(team: 'A' | 'B', index: number, value: string): void {
    if (team === 'A') {
      this.teamAPlayers[index] = value;
    } else {
      this.teamBPlayers[index] = value;
    }
  }

  private restoreSavedData(): void {
    const savedTeams = this.localStorageService.getObject<TeamPlayerEntry[]>('team__player_details');
    const savedBattingFirst = this.localStorageService.getObject<'A' | 'B'>('team__batting_first');
    const matchStarted = this.localStorageService.getObject<boolean>('match__started');

    if (savedTeams && savedTeams.length >= 2) {
      const teamA = savedTeams.find((team) => team.team === 'A');
      const teamB = savedTeams.find((team) => team.team === 'B');

      this.teamAPlayers = teamA?.players?.length ? [...teamA.players] : ['', ''];
      this.teamBPlayers = teamB?.players?.length ? [...teamB.players] : ['', ''];
    }

    if (savedBattingFirst) {
      this.battingFirstTeam = savedBattingFirst;
    }

    if (matchStarted) {
      this.matchStarted = matchStarted;
    }
    this.isLoading = false;
  }

  get canAddPlayer(): boolean {
    return this.teamAPlayers.length < this.maxPlayers && this.teamBPlayers.length < this.maxPlayers;
  }

  get canRemovePlayer(): boolean {
    return this.teamAPlayers.length > this.minPlayers && this.teamBPlayers.length > this.minPlayers;
  }

  startMatch(): void {
    if (this.teamAPlayers.length !== this.teamBPlayers.length) {
      return;
    }

    // Validate that at least 2 players have names in each team
    const teamAValidPlayers = this.teamAPlayers.filter(p => p.trim().length > 0);
    const teamBValidPlayers = this.teamBPlayers.filter(p => p.trim().length > 0);

    if (teamAValidPlayers.length < 2 || teamBValidPlayers.length < 2) {
      alert('Please enter at least 2 player names for each team');
      return;
    }

    const teams: TeamPlayerEntry[] = [
      { team: 'A', players: this.teamAPlayers },
      { team: 'B', players: this.teamBPlayers }
    ];

    this.localStorageService.setObject('team__player_details', teams);
    this.localStorageService.setObject('team__batting_first', this.battingFirstTeam);
    this.localStorageService.setObject('match__started', true);
    this.matchStarted = true;
  }
}
