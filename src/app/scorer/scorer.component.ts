import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../local-storage.service';

interface TeamPlayerEntry {
  team: 'A' | 'B';
  players: string[];
}

interface PlayerStats {
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissal?: string;
}

interface BowlerStats {
  name: string;
  ballsBowled: number;
  runsGiven: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

interface BallResult {
  runs: number;
  type: 'dot' | 'single' | 'double' | 'triple' | 'four' | 'six' | 'wide' | 'noball' | 'wicket';
}

interface OverHistory {
  over: number;
  balls: BallResult[];
  runsInOver: number;
}

interface MatchState {
  currentInnings: 'A' | 'B';
  battingTeam: 'A' | 'B';
  bowlingTeam: 'A' | 'B';
  totalScore: number;
  wickets: number;
  overs: number;
  balls: number;
  ballsInOver: BallResult[];
  history: BallResult[];
  overHistory: OverHistory[];
  strikerIndex: number;
  nonStrikerIndex: number;
  bowlerIndex: number;
  batsmenStats: { [team: string]: PlayerStats[] };
  bowlersStats: { [team: string]: BowlerStats[] };
  maxWickets: number;
  firstInningsScore: number;
  firstInningsOvers: number;
  firstInningsBalls: number;
  isSecondInnings: boolean;
  runsRequired: number;
  ballsRemaining: number;
  targetOvers: number;
}

@Component({
  selector: 'app-scorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scorer.component.html',
  styleUrl: './scorer.component.scss'
})
export class ScorerComponent implements OnInit {
  private readonly localStorageService = inject(LocalStorageService);

  teamData: TeamPlayerEntry[] = [];
  battingFirstTeam: 'A' | 'B' = 'A';
  showScoreboard = false;

  endofinnings = false;

  // Dialog/Selection properties
  showTargetOversDialog = false;
  showBatsmanSelectionDialog = false;
  showBowlerSelectionDialog = false;
  
  targetOversInput = 20;
  availableBatsmen: PlayerStats[] = [];
  availableBowlers: BowlerStats[] = [];
  selectedBatsmanIndex: number | null = null;
  selectedBowlerIndex: number | null = null;

  matchState: MatchState = {
    currentInnings: 'A',
    battingTeam: 'A',
    bowlingTeam: 'B',
    totalScore: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    ballsInOver: [],
    history: [],
    overHistory: [],
    strikerIndex: 0,
    nonStrikerIndex: 1,
    bowlerIndex: 0,
    batsmenStats: {},
    bowlersStats: {},
    maxWickets: 10,
    firstInningsScore: 0,
    firstInningsOvers: 0,
    firstInningsBalls: 0,
    isSecondInnings: false,
    runsRequired: 0,
    ballsRemaining: 0,
    targetOvers: 20
  };

  ngOnInit(): void {
    this.loadMatchData();
    this.restoreMatchState();
  }

  private loadMatchData(): void {
    const teams = this.localStorageService.getObject<TeamPlayerEntry[]>('team__player_details');
    const battingFirst = this.localStorageService.getObject<'A' | 'B'>('team__batting_first');
    const striker = this.localStorageService.getObject<string>('striker');
    const nonstriker = this.localStorageService.getObject<string>('nonstriker');
    const bowler = this.localStorageService.getObject<string>('bowler');
    const targetOversInput = this.localStorageService.getObject<number>('no-of-overs') ?? 0;

    if (teams) {
      this.teamData = teams;
      this.matchState.battingTeam = battingFirst || 'A';
      this.matchState.bowlingTeam = battingFirst === 'A' ? 'B' : 'A';
      this.matchState.currentInnings = battingFirst || 'A';
      this.targetOversInput = targetOversInput;

      this.matchState.strikerIndex = this.teamData[(battingFirst === 'A' ? 0 : 1)].players.findIndex(p => p === striker);
      this.matchState.nonStrikerIndex = this.teamData[(battingFirst === 'A' ? 0 : 1)].players.findIndex(p => p === nonstriker);
      this.matchState.bowlerIndex = this.teamData[(battingFirst === 'A' ? 1 : 0)].players.findIndex(p => p === bowler);

      // Calculate max wickets based on player count (total players - 1)
      const playerCount = teams[0]?.players?.length || 11;
      this.matchState.maxWickets = playerCount - 1;

      // Initialize player stats
      this.initializePlayerStats(teams);
    }
  }

  private initializePlayerStats(teams: TeamPlayerEntry[]): void {
    teams.forEach(team => {
      this.matchState.batsmenStats[team.team] = team.players.map(name => ({
        name,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        isOut: false
      }));

      this.matchState.bowlersStats[team.team] = team.players.map(name => ({
        name,
        ballsBowled: 0,
        runsGiven: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0
      }));
    });
  }

  private restoreMatchState(): void {
    const savedState = this.localStorageService.getObject<MatchState>('match__state');

    if (savedState) {
      // Store the maxWickets calculated from loadMatchData
      const currentMaxWickets = this.matchState.maxWickets;
      this.matchState = { ...this.matchState, ...savedState };
      // Restore the correct maxWickets based on current player count
      this.matchState.maxWickets = currentMaxWickets;
    }
  }

  getStrikerName(): string {
    const batsmen = this.matchState.batsmenStats[this.matchState.battingTeam];
    return batsmen ? batsmen[this.matchState.strikerIndex]?.name || 'Striker' : 'Striker';
  }

  getNonStrikerName(): string {
    const batsmen = this.matchState.batsmenStats[this.matchState.battingTeam];
    return batsmen ? batsmen[this.matchState.nonStrikerIndex]?.name || 'Non-Striker' : 'Non-Striker';
  }

  getBowlerName(): string {
    const bowlers = this.matchState.bowlersStats[this.matchState.bowlingTeam];
    return bowlers ? bowlers[this.matchState.bowlerIndex]?.name || 'Bowler' : 'Bowler';
  }

  recordRun(runs: number, type: BallResult['type']): void {
    const ballResult: BallResult = { runs, type };

    if (type === 'wide' || type === 'noball') {
      this.matchState.totalScore += runs;
      this.matchState.history.push(ballResult);

      const bowlerStats = this.matchState.bowlersStats[this.matchState.bowlingTeam][this.matchState.bowlerIndex];
      if (bowlerStats) {
        bowlerStats.runsGiven += runs;
        if (type === 'wide') {
          bowlerStats.wides++;
        } else {
          bowlerStats.noBalls++;
        }
      }
    } else if (type === "wicket") {
      this.matchState.totalScore += runs;
      this.matchState.ballsInOver.push(ballResult);
      this.matchState.balls++;
      this.matchState.history.push(ballResult);

    } else {
      this.matchState.totalScore += runs;
      this.matchState.ballsInOver.push(ballResult);
      this.matchState.balls++;
      this.matchState.history.push(ballResult);

      // Update striker stats
      const strikerStats = this.matchState.batsmenStats[this.matchState.battingTeam][this.matchState.strikerIndex];
      if (strikerStats) {
        strikerStats.runs += runs;
        strikerStats.ballsFaced++;
        if (type === 'four') strikerStats.fours++;
        if (type === 'six') strikerStats.sixes++;
      }
    }

    if(type != 'wide' && type != 'noball') {
        // Update bowler stats
        const bowlerStats = this.matchState.bowlersStats[this.matchState.bowlingTeam][this.matchState.bowlerIndex];
        if (bowlerStats) {
            bowlerStats.ballsBowled++;
            bowlerStats.runsGiven += runs;
        }

        // Rotate strike if runs are odd
        if (runs % 2 === 1) {
            this.rotateStrike();
        }

        if (this.matchState.balls === 6) {
            this.completeOver();
        }
    }

    const maxovers = this.localStorageService.getObject<number>('no-of-overs') ?? 0;

    // Check if all wickets are down
    if (this.matchState.wickets === this.matchState.maxWickets || this.matchState.overs === maxovers || (this.matchState.isSecondInnings && this.matchState.totalScore >= this.matchState.firstInningsScore + 1)) {
      // Close any open dialogs
      this.endofinnings = true;

      this.showBatsmanSelectionDialog = false;
      this.showBowlerSelectionDialog = false;
      this.availableBatsmen = [];
      this.availableBowlers = [];

      if (!this.matchState.isSecondInnings) {
        // End of first innings - prepare for second innings
        alert(`First Innings Over!\n\nTeam ${this.matchState.battingTeam} - ${this.matchState.totalScore}/${this.matchState.wickets} (${this.matchState.overs}.${this.matchState.balls})\n\nTeam ${this.matchState.bowlingTeam} to chase!`);
        this.showTargetOversDialog = true;
        this.targetOversInput = this.matchState.overs; // Default to same overs as first innings
      } else {
        // Match over
        const winner = this.matchState.totalScore > this.matchState.firstInningsScore ? this.matchState.battingTeam : this.matchState.bowlingTeam;
        this.toggleScoreboard();
        alert(`Match Over!\n\nTeam ${this.matchState.bowlingTeam} - ${this.matchState.firstInningsScore} (${this.matchState.firstInningsOvers}.${this.matchState.firstInningsBalls})\nTeam ${this.matchState.battingTeam} - ${this.matchState.totalScore}/${this.matchState.wickets} (${this.matchState.overs}.${this.matchState.balls})\n\nTeam ${winner} Wins!`);
      }
      return; // Don't show batsman selection when innings is over
    }

    this.saveMatchState();
  }

  private rotateStrike(): void {
    const temp = this.matchState.strikerIndex;
    this.matchState.strikerIndex = this.matchState.nonStrikerIndex;
    this.matchState.nonStrikerIndex = temp;
  }

  private completeOver(): void {
    this.matchState.overs++;
    this.matchState.balls = 0;
    this.matchState.ballsInOver = [];
    this.rotateStrike();

    // Check if target overs reached
    if (this.matchState.isSecondInnings && this.matchState.overs > this.matchState.targetOvers) {
      const winner = this.matchState.firstInningsScore > this.matchState.totalScore ? this.matchState.bowlingTeam : this.matchState.battingTeam;
      alert(`Match Over - Overs Completed!\n\nTeam ${this.matchState.bowlingTeam} - ${this.matchState.firstInningsScore} (${this.matchState.firstInningsOvers}.${this.matchState.firstInningsBalls})\nTeam ${this.matchState.battingTeam} - ${this.matchState.totalScore}/${this.matchState.wickets} (${this.matchState.overs}.${this.matchState.balls})\n\nTeam ${winner} Wins!`);
      return;
    }

    // Show bowler selection dialog
    this.showBowlerSelectionDialog = true;
    this.availableBowlers = this.matchState.bowlersStats[this.matchState.bowlingTeam];
  }

  selectBowler(bowler: BowlerStats): void {
    // Find the index of the selected bowler
    const bowlerIndex = this.matchState.bowlersStats[this.matchState.bowlingTeam].findIndex(
      b => b.name === bowler.name
    );

    if (bowlerIndex !== -1) {
      this.matchState.bowlerIndex = bowlerIndex;
    }

    this.showBowlerSelectionDialog = false;
    this.availableBowlers = [];
    this.saveMatchState();
  }

  confirmTargetOvers(): void {
    this.matchState.targetOvers = this.targetOversInput;
    this.saveMatchState();
    this.showScoreboard = true;
    this.showTargetOversDialog = false;
  }

  recordWicket(): void {
    this.matchState.wickets++;

    const strikerStats = this.matchState.batsmenStats[this.matchState.battingTeam][this.matchState.strikerIndex];
    if (strikerStats) {
      strikerStats.isOut = true;
    }

    const bowlerStats = this.matchState.bowlersStats[this.matchState.bowlingTeam][this.matchState.bowlerIndex];
    if (bowlerStats) {
      bowlerStats.wickets++;
    }

    this.saveMatchState();

    const maxovers = this.localStorageService.getObject<number>('no-of-overs') ?? 0;
    

    // Check if all wickets are down
    if (this.matchState.wickets === this.matchState.maxWickets || this.matchState.overs === maxovers || (this.matchState.isSecondInnings && this.matchState.totalScore >= this.matchState.firstInningsScore + 1)) {
      // Close any open dialogs
      this.endofinnings = true;

      this.showBatsmanSelectionDialog = false;
      this.showBowlerSelectionDialog = false;
      this.availableBatsmen = [];
      this.availableBowlers = [];

      if (!this.matchState.isSecondInnings) {
        // End of first innings - prepare for second innings
        alert(`First Innings Over!\n\nTeam ${this.matchState.battingTeam} - ${this.matchState.totalScore}/${this.matchState.wickets} (${this.matchState.overs}.${this.matchState.balls})\n\nTeam ${this.matchState.bowlingTeam} to chase!`);
        this.showTargetOversDialog = true;
        this.targetOversInput = this.matchState.overs; // Default to same overs as first innings
      } else {
        // Match over
        const winner = this.matchState.totalScore > this.matchState.firstInningsScore ? this.matchState.battingTeam : this.matchState.bowlingTeam;
        alert(`Match Over!\n\nTeam ${this.matchState.bowlingTeam} - ${this.matchState.firstInningsScore} (${this.matchState.firstInningsOvers}.${this.matchState.firstInningsBalls})\nTeam ${this.matchState.battingTeam} - ${this.matchState.totalScore}/${this.matchState.wickets} (${this.matchState.overs}.${this.matchState.balls})\n\nTeam ${winner} Wins!`);
      }
      return; // Don't show batsman selection when innings is over
    }

    // Show batsman selection dialog for next batsman (only if not all wickets down)
    this.showBatsmanSelectionDialog = true;
    this.availableBatsmen = this.matchState.batsmenStats[this.matchState.battingTeam].filter(
      (batsman, idx) => !batsman.isOut && idx !== this.matchState.nonStrikerIndex
    );
  }

  selectBatsman(batsman: PlayerStats): void {
    // Find the index of the selected batsman
    const batsmanIndex = this.matchState.batsmenStats[this.matchState.battingTeam].findIndex(
      b => b.name === batsman.name
    );

    if (batsmanIndex !== -1) {
      this.matchState.strikerIndex = batsmanIndex;
    }

    this.showBatsmanSelectionDialog = false;
    this.availableBatsmen = [];
    this.saveMatchState();
  }

  public switchInnings(): void {
    // Store first innings data
    if (!this.matchState.isSecondInnings) {
      this.matchState.firstInningsScore = this.matchState.totalScore;
      this.matchState.firstInningsOvers = this.matchState.overs;
      this.matchState.firstInningsBalls = this.matchState.balls;
    }

    // Swap teams
    const temp = this.matchState.battingTeam;
    this.matchState.battingTeam = this.matchState.bowlingTeam;
    this.matchState.bowlingTeam = temp;

    // Reset current innings score
    this.matchState.totalScore = 0;
    this.matchState.wickets = 0;
    this.matchState.overs = 0;
    this.matchState.balls = 0;
    this.matchState.ballsInOver = [];
    this.matchState.history = [];
    this.matchState.overHistory = [];

    // Reset player indices
    this.matchState.strikerIndex = 0;
    this.matchState.nonStrikerIndex = 1;
    this.matchState.bowlerIndex = 0;

    // Mark as second innings
    this.matchState.isSecondInnings = true;

    // Calculate runs required and balls remaining
    this.matchState.runsRequired = this.matchState.firstInningsScore + 1;
    this.matchState.ballsRemaining = (this.matchState.firstInningsOvers + 1) * 6 - (this.matchState.firstInningsBalls + 1);
  
    this.saveMatchState();
    this.showScoreboard = false;
    this.endofinnings = false;
  }

  undoLastBall(): void {
    if (this.matchState.history.length > 0) {
      const lastBall = this.matchState.history.pop();

      if (lastBall) {
        this.matchState.totalScore -= lastBall.runs;

        // Undo striker stats
        const strikerStats = this.matchState.batsmenStats[this.matchState.battingTeam][this.matchState.strikerIndex];
        if (strikerStats && (lastBall.type !== 'wide' && lastBall.type !== 'noball')) {
          strikerStats.runs -= lastBall.runs;
          strikerStats.ballsFaced--;
          if (lastBall.type === 'four') strikerStats.fours--;
          if (lastBall.type === 'six') strikerStats.sixes--;
          if (lastBall.type === 'wicket') strikerStats.isOut = false;
        }

        // Undo bowler stats
        const bowlerStats = this.matchState.bowlersStats[this.matchState.bowlingTeam][this.matchState.bowlerIndex];
        if (bowlerStats) {
          bowlerStats.runsGiven -= lastBall.runs;
          if (lastBall.type !== 'wide' && lastBall.type !== 'noball') {
            bowlerStats.ballsBowled--;
            if(lastBall.type === 'wicket') bowlerStats.wickets--;
          }
        }

        if (lastBall.type !== 'wide' && lastBall.type !== 'noball') {
          this.matchState.ballsInOver.pop();
          this.matchState.balls--;
          if(lastBall.type == "wicket") {
            this.matchState.wickets--;
          }

          if (this.matchState.balls < 0) {
            this.matchState.balls = 5;
            this.matchState.overs--;
          }
        }
      }
    }

    this.saveMatchState();
  }

  getBallDisplay(ball: BallResult): string {
    switch (ball.type) {
      case 'dot': return 'D';
      case 'single': return '1';
      case 'double': return '2';
      case 'triple': return '3';
      case 'four': return '4';
      case 'six': return '6';
      case 'wide': return 'w';
      case 'noball': return 'NB';
      case 'wicket': return 'W';
      default: return '';
    }
  }

  getRunHistoryByOver(): OverHistory[] {
    const overMap = new Map<number, BallResult[]>();
    let currentOver = 0;
    let ballCount = 0;

    this.matchState.history.forEach(ball => {
      if (ball.type !== 'wide' && ball.type !== 'noball') {
        if (ballCount === 6) {
          currentOver++;
          ballCount = 0;
        }
        if (!overMap.has(currentOver)) {
          overMap.set(currentOver, []);
        }
        overMap.get(currentOver)!.push(ball);
        ballCount++;
      } else {
        if (!overMap.has(currentOver)) {
          overMap.set(currentOver, []);
        }
        overMap.get(currentOver)!.push(ball);
      }
    });

    const result: OverHistory[] = [];
    overMap.forEach((balls, over) => {
      const runsInOver = balls.reduce((sum, ball) => sum + ball.runs, 0);
      result.push({ over, balls, runsInOver });
    });

    return result.sort((a, b) => a.over - b.over);
  }

  getRunsRequired(): number {
    if (!this.matchState.isSecondInnings) return 0;
    return Math.max(0, this.matchState.firstInningsScore + 1 - this.matchState.totalScore);
  }

  getBallsRemaining(): number {
    if (!this.matchState.isSecondInnings) return 0;
    // Assuming same number of overs as first innings
    const totalBalls = (this.matchState.firstInningsOvers + 1) * 6;
    return Math.max(0, totalBalls - (this.matchState.overs * 6 + this.matchState.balls));
  }

  toggleScoreboard(): void {
    this.showScoreboard = !this.showScoreboard;
  }

  getTeamColor(team: 'A' | 'B'): string {
    return team === 'A' ? 'red' : 'blue';
  }

  private saveMatchState(): void {
    this.localStorageService.setObject('match__state', this.matchState);
  }

  public goHome(): void {
    this.localStorageService.setObject('match__started', false);
    this.clearMatchData();
    window.location.reload();
  }

  private clearMatchData() {
    // Clear only match-related data
    const matchKeys = ['match__started', 'match__state', 'match__score']; // example keys
    matchKeys.forEach(key => this.localStorageService.deleteObject(key));
  }
}

