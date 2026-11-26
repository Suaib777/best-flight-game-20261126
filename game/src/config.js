// Avengers Doomsday — Mahjong Skies: tuning and the Mahjong palette.
// Jade green, ivory, gold and red: the whole game is drawn in this palette.
export const PALETTE = {
  jadeDeep: '#07281f',
  jade: '#0e5c46',
  jadeMid: '#177a5c',
  jadeLight: '#2fae83',
  ivory: '#f3ead3',
  ivoryDim: '#e2d5b4',
  gold: '#d8a93b',
  goldBright: '#f2c94c',
  goldDark: '#8a6a1d',
  red: '#c0392b',
  redBright: '#e74c3c',
  ink: '#1d2b26',
  skyTop: '#0b3d33',
  skyMid: '#1d6a52',
  skyLow: '#c97e2e',
  sun: '#e74c3c',
  thruster: '#7fd4ff',
};

export const VIEW = { width: 1280, height: 800, horizon: 300 };

export const HERO = {
  startFuel: 100,
  startHull: 100,
  maxSpeedKmh: 620,
  minSpeedKmh: 180,
  fuelDrainCruise: 1.1, // per second at throttle 0.55
  fuelDrainFull: 2.3,
  fuelDrainLow: 0.6,
  ringFuel: 25,
  killFuel: 5,
  orbDamage: 12,
  missileDamage: 20,
  grazeDamage: 15,
};

export const MISSIONS = [
  { id: 1, name: 'RING RUN', goal: 'Fly through 8 gold rings', rings: 8, drones: 0 },
  { id: 2, name: 'VOID SWARM', goal: 'Destroy 10 void drones', rings: 0, drones: 10 },
  { id: 3, name: 'DOOMSDAY GATE', goal: 'Reach the gate through the barrage', rings: 1, drones: 6 },
];

export const SCORE = { ring: 100, drone: 150, gate: 500, missionBonus: 250 };
