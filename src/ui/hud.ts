import type { Order } from '../game/orders';
import type { RoundStats } from '../game/round';
import type { TableInfo } from '../world/tables';
import { CONFIG } from '../config';

export interface HudState {
  money: number;
  timeLeft: number;
  order: Order | null;
  tipFraction: number;
  mugs: number;
  danger01: number;   // tilt magnitude 0..1
  tiltX: number;
  tiltY: number;
  inBarZone: boolean;
  toastActive: boolean;
  loading: { n: number; progress01: number } | null;
}

const CSS = `
  #hud * { box-sizing: border-box; user-select: none; }
  #hud {
    position: fixed; inset: 0; pointer-events: none;
    font-family: 'Trebuchet MS', Verdana, sans-serif; color: #f5f0e0;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.7);
  }
  .panel {
    background: linear-gradient(#3a2812, #241708);
    border: 3px solid #c8a850; border-radius: 6px;
    padding: 8px 14px;
  }
  #money { position: absolute; top: 14px; left: 14px; font-size: 28px; font-weight: bold;
    font-family: Impact, 'Arial Black', sans-serif; color: #ffd860; letter-spacing: 1px; }
  #money.debt { color: #ff5040; animation: blink 0.6s infinite alternate; }
  #timer { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); text-align: center; }
  #timerval { font-size: 30px; font-family: Impact, 'Arial Black', sans-serif; line-height: 1; }
  #timer.low #timerval { color: #ff5040; animation: blink 0.5s infinite alternate; }
  #pausehint { font-size: 10px; letter-spacing: 0.5px; opacity: 0.7; margin-top: 2px; }
  @keyframes blink { from { opacity: 1; } to { opacity: 0.4; } }
  #ticket { position: absolute; top: 14px; right: 14px; width: 200px; font-size: 16px; }
  #ticket .tbl { font-size: 24px; font-family: Impact, 'Arial Black', sans-serif; color: #ffd860; }
  #ticket .big { color: #ff9040; font-weight: bold; }
  #tipbarWrap { height: 10px; background: #1a1005; border: 1px solid #c8a850; margin-top: 6px; }
  #tipbar { height: 100%; background: linear-gradient(90deg, #ff5040, #ffd860); width: 100%; }
  #gauge { position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
    width: 120px; height: 120px; }
  #gaugelabel { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
    font-size: 11px; letter-spacing: 1px; color: #e8dfc8; opacity: 0.85;
    font-family: Verdana, sans-serif; display: none; }
  #mugcount { position: absolute; bottom: 30px; left: 20px; font-size: 22px;
    font-family: Impact, 'Arial Black', sans-serif; }
  #barhint { position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%);
    font-size: 20px; text-align: center; display: none; }
  #loadbarwrap { height: 10px; width: 180px; margin: 6px auto 0; background: #1a1005;
    border: 1px solid #c8a850; border-radius: 3px; overflow: hidden; }
  #loadbarfill { height: 100%; background: linear-gradient(90deg, #ffd860, #ff9040); width: 0%; }
  #minimap { position: absolute; bottom: 20px; right: 20px; border: 3px solid #c8a850;
    border-radius: 4px; background: #241708; }
  #toasts { position: absolute; top: 25%; left: 50%; transform: translateX(-50%);
    text-align: center; }
  .toastmsg { font-size: 26px; font-family: Impact, 'Arial Black', sans-serif;
    margin: 4px 0; animation: rise 2.2s forwards; }
  .toastmsg.good { color: #80e860; }
  .toastmsg.bad { color: #ff5040; }
  .toastmsg.neutral { color: #f5f0e0; }
  @keyframes rise { 0% { opacity: 0; transform: translateY(16px) scale(0.8); }
    12% { opacity: 1; transform: none; } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-24px); } }
  #prost { position: absolute; top: 38%; left: 50%; transform: translate(-50%,-50%);
    font-size: 64px; font-family: Impact, 'Arial Black', sans-serif; color: #ffd860;
    display: none; animation: prostpulse 0.6s infinite alternate; }
  @keyframes prostpulse { from { transform: translate(-50%,-50%) scale(1) rotate(-3deg); }
    to { transform: translate(-50%,-50%) scale(1.15) rotate(3deg); } }
  .screen {
    position: fixed; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 18px;
    background: rgba(20, 12, 4, 0.82); pointer-events: auto;
    font-family: 'Trebuchet MS', Verdana, sans-serif; color: #f5f0e0;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.7); text-align: center;
  }
  .screen h1 { font-family: Impact, 'Arial Black', sans-serif; font-size: 64px;
    color: #ffd860; margin: 0; letter-spacing: 2px; transform: rotate(-2deg); }
  .screen h2 { font-family: Impact, 'Arial Black', sans-serif; font-size: 40px; margin: 0; }
  .screen p { max-width: 560px; font-size: 17px; line-height: 1.5; margin: 0; }
  .screen button {
    pointer-events: auto; cursor: pointer; font-family: Impact, 'Arial Black', sans-serif;
    font-size: 26px; padding: 12px 40px; color: #241708;
    background: linear-gradient(#ffd860, #c8a030); border: 3px solid #f5f0e0;
    border-radius: 8px; letter-spacing: 1px;
  }
  .screen button:hover { filter: brightness(1.1); }
  .screen table { font-size: 18px; border-spacing: 18px 4px; }
  .screen td:last-child { text-align: right; color: #ffd860; font-weight: bold; }
  .screen .row { display: flex; gap: 14px; }
  #difficulty { display: flex; gap: 12px; }
  .diffbtn { pointer-events: auto; cursor: pointer; border: 3px solid #8a6a30; border-radius: 8px;
    padding: 10px 18px; background: rgba(36,23,8,0.6); min-width: 130px; transition: filter 0.15s, border-color 0.15s; }
  .diffbtn:hover { filter: brightness(1.2); }
  .diffbtn b { display: block; font-family: Impact, 'Arial Black', sans-serif; font-size: 16px;
    color: #f5f0e0; letter-spacing: 1px; }
  .diffbtn span { display: block; font-size: 12px; color: #d8c8a0; margin-top: 4px; }
  .diffbtn.selected { border-color: #ffd860; background: rgba(200,168,80,0.28); }
  .diffbtn.selected b { color: #ffd860; }
  .screen button.secondary { background: linear-gradient(#8a8880, #4a4840); font-size: 20px; padding: 10px 28px; }
  .screen button.danger { background: linear-gradient(#e87050, #a83820); font-size: 20px; padding: 10px 28px; }
`;

export class HUD {
  private root: HTMLDivElement;
  private money!: HTMLDivElement;
  private timer!: HTMLDivElement;
  private timerVal!: HTMLDivElement;
  private ticket!: HTMLDivElement;
  private tipbar!: HTMLDivElement;
  private gauge!: HTMLCanvasElement;
  private gaugeLabel!: HTMLDivElement;
  private mugcount!: HTMLDivElement;
  private barhint!: HTMLDivElement;
  private minimap!: HTMLCanvasElement;
  private toasts!: HTMLDivElement;
  private prost!: HTMLDivElement;
  private screenEl: HTMLDivElement | null = null;

  constructor(private tables: TableInfo[]) {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <div id="money" class="panel">€ 0.00</div>
      <div id="timer" class="panel"><div id="timerval">1:30</div><div id="pausehint">ESC ⏸ pause</div></div>
      <div id="ticket" class="panel">
        <div class="tbl">Table –</div>
        <div class="mugs">–</div>
        <div id="tipbarWrap"><div id="tipbar"></div></div>
      </div>
      <canvas id="gauge" width="120" height="120"></canvas>
      <div id="gaugelabel">MOUSE — KEEP LEVEL</div>
      <div id="mugcount" class="panel">🍺 × 0</div>
      <div id="barhint" class="panel"></div>
      <canvas id="minimap" width="170" height="200"></canvas>
      <div id="toasts"></div>
      <div id="prost">PROST! 🍻</div>
    `;
    document.body.appendChild(this.root);
    this.money = this.root.querySelector('#money')!;
    this.timer = this.root.querySelector('#timer')!;
    this.timerVal = this.root.querySelector('#timerval')!;
    this.ticket = this.root.querySelector('#ticket')!;
    this.tipbar = this.root.querySelector('#tipbar')!;
    this.gauge = this.root.querySelector('#gauge')!;
    this.gaugeLabel = this.root.querySelector('#gaugelabel')!;
    this.mugcount = this.root.querySelector('#mugcount')!;
    this.barhint = this.root.querySelector('#barhint')!;
    this.minimap = this.root.querySelector('#minimap')!;
    this.toasts = this.root.querySelector('#toasts')!;
    this.prost = this.root.querySelector('#prost')!;
    this.setVisible(false);
  }

  setVisible(v: boolean) {
    this.root.style.display = v ? 'block' : 'none';
  }

  toast(msg: string, kind: 'good' | 'bad' | 'neutral' = 'neutral') {
    const el = document.createElement('div');
    el.className = `toastmsg ${kind}`;
    el.textContent = msg;
    this.toasts.appendChild(el);
    setTimeout(() => el.remove(), 2300);
  }

  update(s: HudState, playerX: number, playerZ: number, playerHeading: number) {
    this.money.textContent =
      s.money < 0 ? `−€ ${Math.abs(s.money).toFixed(2)} DEBT` : `€ ${s.money.toFixed(2)}`;
    this.money.classList.toggle('debt', s.money < 0);
    const m = Math.floor(s.timeLeft / 60);
    const sec = Math.floor(s.timeLeft % 60);
    this.timerVal.textContent = `${m}:${sec.toString().padStart(2, '0')}`;
    this.timer.classList.toggle('low', s.timeLeft < 30);

    if (s.order) {
      this.ticket.querySelector('.tbl')!.textContent = `Table ${s.order.tableId}`;
      this.ticket.querySelector('.mugs')!.innerHTML =
        `${s.order.mugs} × Maß ${s.order.big ? '<span class="big">BIG GROUP!</span>' : ''}`;
      this.tipbar.style.width = `${s.tipFraction * 100}%`;
    }

    this.mugcount.textContent = `🍺 × ${s.mugs}`;

    if (s.inBarZone) {
      this.barhint.style.display = 'block';
      if (s.loading) {
        const pct = Math.round(s.loading.progress01 * 100);
        this.barhint.innerHTML =
          `<b>Grabbing ${s.loading.n} Maß…</b>` +
          `<div id="loadbarwrap"><div id="loadbarfill" style="width:${pct}%"></div></div>`;
      } else {
        this.barhint.innerHTML = s.order
          ? `<b>BAR</b> — press <b>1–8</b> to load mugs &nbsp;(order: <b>${s.order.mugs}</b>)`
          : `<b>BAR</b> — press <b>1–8</b> to load mugs`;
      }
    } else {
      this.barhint.style.display = 'none';
    }

    this.prost.style.display = s.toastActive ? 'block' : 'none';
    this.gaugeLabel.style.display = s.mugs > 0 ? 'block' : 'none';

    this.drawGauge(s);
    this.drawMinimap(s, playerX, playerZ, playerHeading);
  }

  private drawGauge(s: HudState) {
    const ctx = this.gauge.getContext('2d')!;
    ctx.clearRect(0, 0, 120, 120);
    if (s.mugs === 0) return;
    const cx = 60, cy = 60;
    // outer ring, color shifts with danger
    ctx.beginPath();
    ctx.arc(cx, cy, 52, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,12,4,0.65)';
    ctx.fill();
    const danger = s.danger01;
    ctx.strokeStyle = danger > 0.75 ? '#ff5040' : danger > 0.45 ? '#ffd860' : '#80e860';
    ctx.lineWidth = 5;
    ctx.stroke();
    // safe zone circle
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(245,240,224,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // crosshair
    ctx.strokeStyle = 'rgba(245,240,224,0.2)';
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy); ctx.lineTo(cx + 48, cy);
    ctx.moveTo(cx, cy - 48); ctx.lineTo(cx, cy + 48);
    ctx.stroke();
    // beer bubble at tilt position
    const bx = cx + s.tiltX * 48;
    const by = cy + s.tiltY * 48;
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#e8a020';
    ctx.fill();
    ctx.strokeStyle = '#f8f4e4';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawMinimap(s: HudState, px: number, pz: number, heading: number) {
    const ctx = this.minimap.getContext('2d')!;
    const W = 170, H = 200;
    ctx.clearRect(0, 0, W, H);
    // world x [-20,20] → canvas x, world z [-24,24] → canvas y
    const sx = (x: number) => ((x + 20) / 40) * (W - 10) + 5;
    const sy = (z: number) => ((z + 24) / 48) * (H - 10) + 5;
    ctx.fillStyle = 'rgba(60,40,18,0.9)';
    ctx.fillRect(0, 0, W, H);
    // bar
    ctx.fillStyle = '#8a6a30';
    ctx.fillRect(sx(-7), sy(18.4), sx(7) - sx(-7), 8);
    ctx.fillStyle = '#f5f0e0';
    ctx.font = '9px Verdana';
    ctx.fillText('BAR', sx(-1.5), sy(22.5));
    // stage
    ctx.fillStyle = '#6a4a8a';
    ctx.fillRect(sx(-6), sy(-23), sx(6) - sx(-6), 8);
    ctx.fillStyle = '#f5f0e0';
    ctx.fillText('BAND', sx(-2), sy(-19.5) - 6);
    // tables
    const t = performance.now() / 300;
    for (const tb of this.tables) {
      const isTarget = s.order && tb.id === s.order.tableId;
      ctx.fillStyle = isTarget
        ? (Math.sin(t) > 0 ? '#ffd860' : '#ff9040')
        : '#a88850';
      const x0 = sx(tb.aabb.minX), x1 = sx(tb.aabb.maxX);
      const y0 = sy(tb.aabb.minZ), y1 = sy(tb.aabb.maxZ);
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = isTarget ? '#241708' : '#f5f0e0';
      ctx.font = 'bold 10px Verdana';
      ctx.fillText(String(tb.id), (x0 + x1) / 2 - 3, (y0 + y1) / 2 + 4);
    }
    // player arrow
    const pxc = sx(px), pyc = sy(pz);
    ctx.save();
    ctx.translate(pxc, pyc);
    ctx.rotate(Math.PI - heading);
    ctx.fillStyle = '#60c8ff';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---- full-screen states ----

  private clearScreen() {
    this.screenEl?.remove();
    this.screenEl = null;
  }

  showMenu(onStart: (level: number) => void) {
    this.clearScreen();
    const el = document.createElement('div');
    el.className = 'screen';
    const diffButtons = CONFIG.difficulty.levels
      .map(
        (lvl, i) => `
      <div class="diffbtn${i === 1 ? ' selected' : ''}" data-level="${i}">
        <b>${lvl.name}</b><span>${lvl.subtitle}</span>
      </div>`,
      )
      .join('');
    el.innerHTML = `
      <h1>PROST!</h1>
      <h2 style="font-size:24px;color:#f5f0e0;">Oktoberfest Waitress Simulator</h2>
      <p>Carry Maß beers from the bar to the numbered tables before the shift ends.
      The more mugs you stack on the tray, the harder it is to keep level.</p>
      <p><b>WASD</b> — walk &nbsp;•&nbsp; <b>Mouse</b> — balance the tray &nbsp;•&nbsp;
      <b>1–8</b> at the bar — load mugs &nbsp;•&nbsp; <b>ESC</b> — pause</p>
      <p>Deliver fast for tips. Spill too much and the table refuses the round —
      and every spilled Maß comes out of your pay.</p>
      <div id="difficulty">${diffButtons}</div>
      <button id="startbtn">START SHIFT</button>
    `;
    document.body.appendChild(el);
    this.screenEl = el;
    let selected = 1;
    const btns = el.querySelectorAll<HTMLDivElement>('.diffbtn');
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        selected = parseInt(b.dataset.level!, 10);
        btns.forEach((x) => x.classList.remove('selected'));
        b.classList.add('selected');
      }),
    );
    el.querySelector('#startbtn')!.addEventListener('click', () => {
      this.clearScreen();
      onStart(selected);
    });
  }

  showPause(state: { money: number; timeLeft: number }, onResume: () => void, onEndShift: () => void, onQuit: () => void) {
    this.clearScreen();
    const el = document.createElement('div');
    el.className = 'screen';
    const moneyStr =
      state.money < 0 ? `−€ ${Math.abs(state.money).toFixed(2)} DEBT` : `€ ${state.money.toFixed(2)}`;
    const m = Math.floor(state.timeLeft / 60);
    const sec = Math.floor(state.timeLeft % 60);
    el.innerHTML = `
      <h2>PAUSED</h2>
      <p>${moneyStr} earned so far &nbsp;•&nbsp; ${m}:${sec.toString().padStart(2, '0')} left</p>
      <button id="resumebtn">RESUME</button>
      <div class="row">
        <button id="endbtn" class="danger">END SHIFT</button>
        <button id="quitbtn" class="secondary">QUIT TO MENU</button>
      </div>
    `;
    document.body.appendChild(el);
    this.screenEl = el;
    el.querySelector('#resumebtn')!.addEventListener('click', () => {
      this.clearScreen();
      onResume();
    });
    el.querySelector('#endbtn')!.addEventListener('click', () => {
      this.clearScreen();
      onEndShift();
    });
    el.querySelector('#quitbtn')!.addEventListener('click', () => {
      this.clearScreen();
      onQuit();
    });
  }

  showResults(stats: RoundStats, onRestart: () => void) {
    this.clearScreen();
    const el = document.createElement('div');
    el.className = 'screen';
    const inDebt = stats.earned < 0;
    el.innerHTML = `
      <h2>${inDebt ? 'SHIFT OVER — YOU OWE THE TENT!' : 'SHIFT OVER!'}</h2>
      <h1 style="${inDebt ? 'color:#ff5040' : ''}">${inDebt ? '−' : ''}€ ${Math.abs(stats.earned).toFixed(2)}</h1>
      <table>
        <tr><td>Deliveries</td><td>${stats.deliveries}</td></tr>
        <tr><td>Mugs spilled</td><td>${stats.spills}</td></tr>
        <tr><td>Spilled beer bill</td><td>−€ ${stats.spillLosses.toFixed(2)}</td></tr>
        <tr><td>Best tip</td><td>€ ${stats.bestTip.toFixed(2)}</td></tr>
      </table>
      ${inDebt ? '<p style="color:#ff8070">The Wirt is not amused. Work it off next shift.</p>' : ''}
      <button id="againbtn">ANOTHER SHIFT</button>
    `;
    document.body.appendChild(el);
    this.screenEl = el;
    el.querySelector('#againbtn')!.addEventListener('click', () => {
      this.clearScreen();
      onRestart();
    });
  }

  showClickToResume(show: boolean) {
    let el = document.getElementById('resumehint');
    if (show && !el) {
      el = document.createElement('div');
      el.id = 'resumehint';
      el.className = 'panel';
      el.style.cssText =
        'position:fixed;top:74px;left:50%;transform:translateX(-50%);' +
        'font-family:"Trebuchet MS",Verdana,sans-serif;font-size:15px;color:#f5f0e0;' +
        'text-shadow:2px 2px 0 rgba(0,0,0,0.7);pointer-events:none;text-align:center;';
      el.innerHTML = '🖱️ Move the mouse to keep the tray level — <b>click once</b> to capture the cursor';
      document.body.appendChild(el);
    } else if (!show && el) {
      el.remove();
    }
  }
}
