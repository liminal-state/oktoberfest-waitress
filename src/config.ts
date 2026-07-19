// Central tuning constants. Everything gameplay-feel lives here.

export const CONFIG = {
  round: {
    durationSec: 180,
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
  },

  tray: {
    maxMugs: 8,
    // Tilt is a 2D vector; magnitude 1.0 = spill threshold.
    driftBase: 0.030,          // random drift per second at 1 mug, standing still
    driftPerMug: 0.030,        // extra drift per additional mug
    driftSpeedFactor: 0.16,    // extra drift scaled by walk speed fraction
    turnImpulse: 0.11,         // tilt kick from sharp turning (per rad/s, scaled)
    accelImpulse: 0.045,       // tilt kick from starting/stopping
    bumpImpulse: 0.5,          // tilt kick from guest collision
    mouseGain: 0.0035,         // tilt correction per pixel of mouse movement
    damping: 0.25,             // passive self-centering per second (weak!)
    spillThreshold: 1.0,
    spillResetTo: 0.45,        // tilt magnitude after a mug spills (weight lost)
    graceAfterSpillSec: 0.8,   // no double-spill window
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
    rejectShortfall: 0.5,      // deliver < 50% of ordered mugs -> rejected
    deliverRadius: 2.0,
  },

  guests: {
    seatedPerTable: 6,
    wanderers: 5,
    wandererSpeed: 1.1,
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
    driftRampEnd: 1.5,
    wanderersRampExtra: 3,     // extra wanderers spawned over the round
  },
};
