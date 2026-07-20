import * as THREE from 'three';
import { CONFIG } from '../config';
import type { TableInfo } from '../world/tables';

export interface Order {
  tableId: number;
  mugs: number;
  age: number;
  big: boolean;
}

export type DeliveryResult =
  | { type: 'none' }
  | { type: 'delivered'; pay: number; tip: number; mugsUsed: number; tableId: number }
  | { type: 'insufficient'; tableId: number; have: number; need: number };

export class OrderSystem {
  current: Order | null = null;

  constructor(private tables: TableInfo[]) {}

  newOrder(difficulty01: number) {
    const cfg = CONFIG.orders;
    const prevTable = this.current?.tableId;
    let table: TableInfo;
    do {
      table = this.tables[Math.floor(Math.random() * this.tables.length)];
    } while (table.id === prevTable && this.tables.length > 1);
    // orders skew bigger as the round progresses
    const min = cfg.minMugs + Math.floor(difficulty01 * 2);
    const mugs = Math.min(cfg.maxMugs, min + Math.floor(Math.random() * (cfg.maxMugs - min + 1)));
    this.current = { tableId: table.id, mugs, age: 0, big: mugs >= cfg.bigGroupThreshold };
  }

  targetTable(): TableInfo | null {
    if (!this.current) return null;
    return this.tables.find((t) => t.id === this.current!.tableId) ?? null;
  }

  update(dt: number) {
    if (this.current) this.current.age += dt;
  }

  // 1 → full tip, 0 → patience gone
  tipFraction(): number {
    if (!this.current) return 0;
    const cfg = CONFIG.orders;
    const decay = cfg.tipDecaySec * (this.current.big ? cfg.bigGroupDecayMult : 1);
    return Math.max(0, 1 - this.current.age / decay);
  }

  tryDeliver(playerPos: THREE.Vector3, mugsOnTray: number): DeliveryResult {
    const cfg = CONFIG.orders;
    const order = this.current;
    if (!order || mugsOnTray <= 0) return { type: 'none' };
    const table = this.targetTable();
    if (!table) return { type: 'none' };
    const d = Math.hypot(playerPos.x - table.position.x, playerPos.z - table.position.z);
    if (d > cfg.deliverRadius + 1.55) return { type: 'none' }; // 1.55 ≈ table half depth w/ benches

    // must bring the full order — short trays are turned away, not accepted at a discount
    if (mugsOnTray < order.mugs) {
      return { type: 'insufficient', tableId: order.tableId, have: mugsOnTray, need: order.mugs };
    }

    const counted = order.mugs;
    const extras = mugsOnTray - order.mugs;
    const pay = counted * cfg.basePayPerMug + extras * cfg.basePayPerMug * 0.5;
    const tipMult = order.big ? cfg.bigGroupTipMult : 1;
    const tip = counted * cfg.tipMaxPerMug * tipMult * this.tipFraction();
    return { type: 'delivered', pay, tip: Math.round(tip * 10) / 10, mugsUsed: mugsOnTray, tableId: order.tableId };
  }
}
