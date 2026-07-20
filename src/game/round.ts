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
  private levelIdx = 1;

  start(levelIdx = 1) {
    this.levelIdx = levelIdx;
    this.timeLeft = CONFIG.round.durationSec;
    this.money = 0;
    this.stats = { deliveries: 0, spills: 0, rejections: 0, bestTip: 0, earned: 0, spillLosses: 0 };
    this.running = true;
  }

  get level() {
    return CONFIG.difficulty.levels[this.levelIdx];
  }

  get difficulty01(): number {
    return 1 - this.timeLeft / CONFIG.round.durationSec;
  }

  get driftMult(): number {
    // difficulty-level base multiplier, ramped up further as the shift goes on
    return this.level.driftMult * (1 + this.difficulty01 * (CONFIG.difficulty.driftRampEnd - 1));
  }

  get mouseGainMult(): number {
    return this.level.mouseGainMult;
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
