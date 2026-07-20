// Central tuning constants. Everything gameplay-feel lives here.

export const CONFIG = {
  round: {
    durationSec: 90,
  },

  player: {
    walkSpeed: 4.2,          // m/s at 0 mugs
    speedPerMugPenalty: 0.14, // m/s lost per carried mug
    turnLerp: 10,            // how fast the body turns toward move direction
    radius: 0.35,            // collision radius
  },

  camera: {
    distance: 5.2,
    height: 3.0,
    lookAtHeight: 1.2,
    lerp: 5,
    minDistance: 0.05,      // defensive epsilon only — see updateCamera()
    collisionRadius: 0.3,   // margin kept between the camera and scenery;
                             // must stay below player.radius (0.35) or the
                             // spring-arm clamp can flip to the wrong side
                             // of the player when she's pressed against a wall
  },

  tray: {
    maxMugs: 8,
    // Tilt is a 2D vector; magnitude 1.0 = spill threshold.
    // The bubble drifts slowly; moving the mouse steers it the same
    // direction, so you nudge it back toward the bullseye.
    driftBase: 0.035,          // random drift per second at 1 mug, standing still
    driftPerMug: 0.030,        // extra drift per additional mug
    driftSpeedFactor: 0.14,    // extra drift scaled by walk speed fraction
    turnImpulse: 0.07,         // tilt kick from sharp turning (per rad/s, scaled)
    accelImpulse: 0.03,        // tilt kick from starting/stopping
    bumpImpulse: 0.35,         // tilt kick from guest collision
    mouseGain: 0.0045,         // bubble movement per pixel of mouse movement
    damping: 0.15,             // passive self-centering per second (weak!)
    spillThreshold: 1.0,
    spillResetTo: 0.35,        // tilt magnitude after a mug spills (weight lost)
    graceAfterSpillSec: 1.2,   // no double-spill window
    loadBaseSec: 0.35,         // fixed time to grab any order at the bar
    loadPerMugSec: 0.12,       // extra time per mug — bigger trays take longer to load
  },

  orders: {
    minMugs: 2,
    maxMugs: 8,
    basePayPerMug: 4.5,        // €
    tipMaxPerMug: 3.5,         // € extra if delivered instantly
    tipDecaySec: 45,           // tip linearly decays to 0 over this time
    bigGroupThreshold: 6,      // >= this: big group
    bigGroupTipMult: 1.8,      // bigger tips...
    bigGroupDecayMult: 0.6,    // ...but patience decays faster
    deliverRadius: 2.0,
    spillCost: 4.0,            // € you pay to replace each spilled Maß — balance can go negative (debt!)
  },

  guests: {
    seatedPerTable: 6,
    wanderers: 9,
    wandererSpeed: 1.25,
    bumpRadius: 0.75,
    bumpCooldownSec: 1.5,
    toastIntervalSec: [35, 60] as [number, number],
    toastDurationSec: 6,
    danceZoneRadius: 4.5,
    danceJostlePerSec: 0.22,   // extra tilt drift inside dance zone
    danceSlowFactor: 0.65,
  },

  difficulty: {
    // multipliers ramp linearly from 1.0 to these by end of round
    driftRampEnd: 1.8,
    wanderersRampExtra: 6,     // extra wanderers spawned over the round
    // selectable at shift start — scales tray drift speed and mouse
    // responsiveness together, so higher levels feel twitchier to balance.
    // Wahnsinn is meant to be a clear step past Zünftig, not a half-step.
    levels: [
      { name: 'Gemütlich', subtitle: 'Easy — steady tray', driftMult: 0.7, mouseGainMult: 0.9 },
      { name: 'Zünftig', subtitle: 'Medium', driftMult: 1.2, mouseGainMult: 1.05 },
      { name: 'Wahnsinn', subtitle: 'Hard — twitchy tray', driftMult: 2.3, mouseGainMult: 1.7 },
    ] as { name: string; subtitle: string; driftMult: number; mouseGainMult: number }[],
  },
};
