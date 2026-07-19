import { CONFIG } from '../config';

export interface RoundStats {
  deliveries: number;
  spills: number;
  rejections: number;
  bestTip: number;
  earned: number;
  spillLosses: number;
}

export class Round {
  timeLeft = CONFIG.round.durationSec;
  money = 0;
  running = false;
  stats: RoundStats = { deliveries: 0, spills: 0, rejections: 0, bestTip: 0, earned: 0, spillLosses: 0 };

  start() {
    this.timeLeft = CONFIG.round.durationSec;
    this.money = 0;
    this.stats = { deliveries: 0, spills: 0, rejections: 0, bestTip: 0, earned: 0, spillLosses: 0 };
    this.running = true;
  }

  get difficulty01(): number {
    return 1 - this.timeLeft / CONFIG.round.durationSec;
  }

  get driftMult(): number {
    return 1 + this.difficulty01 * (CONFIG.difficulty.driftRampEnd - 1);
  }

  addMoney(amount: number) {
    this.money += amount;
    this.stats.earned = this.money;
  }

  /** returns true when the round just ended */
  update(dt: number): boolean {
    if (!this.running) return false;
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.running = false;
      return true;
    }
    return false;
  }
}
