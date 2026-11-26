// Avengers Doomsday — Mahjong Skies. Game loop and state machine.
// Title -> playing (3 sorties: Ring Run, Void Swarm, Doomsday Gate) ->
// victory, or game over on hull/fuel loss. ?shot=title|play|combat|victory
// renders a deterministic scene for screenshots.
import { PALETTE, VIEW, HERO, MISSIONS, SCORE } from './config.js';
import { mulberry32, range } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createWorld, createRing } from './world.js';
import {
  createHero, createDrone, createMissile, createOrb, createParticles,
  updateHero, heroFire, addScore, updateEntities, nearHero, ringPassed,
} from './entities.js';
import { render } from './render.js';
import { applyShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '20261126');
const rng = mulberry32(seed);

const game = {
  state: 'title',
  time: 0,
  rng,
  world: createWorld(rng),
  hero: createHero(),
  entities: [],
  particles: createParticles(),
  missions: MISSIONS,
  missionIndex: 0,
  mission: MISSIONS[0],
  spawnedRings: 0,
  spawnedDrones: 0,
  spawnTimer: 0,
  droneTimer: 0,
  missileTimer: 0,
  banner: null,
  bannerTimer: 0,
  overReason: '',
  audio: createAudio(),
  input: createInput(canvas),
};

game.progressText = () => {
  const m = game.mission;
  if (m.id === 1) return `RINGS ${game.hero.rings}/${m.rings}`;
  if (m.id === 2) return `DRONES ${game.hero.kills}/${m.drones}`;
  return game.hero.rings >= 9 ? 'GATE REACHED' : 'REACH THE GATE';
};

function showBanner(text) {
  game.banner = { text, alpha: 1 };
  game.bannerTimer = 3;
}

function startMission(index) {
  game.missionIndex = index;
  game.mission = MISSIONS[index];
  game.entities = game.entities.filter((e) => e.kind === 'bolt');
  game.spawnedRings = 0;
  game.spawnedDrones = 0;
  game.spawnTimer = 0;
  game.droneTimer = 1;
  game.missileTimer = 4;
  if (index === 0) showBanner('MISSION 1 — RING RUN');
  else if (index === 1) showBanner('MISSION 2 — VOID SWARM');
  else showBanner('MISSION 3 — DOOMSDAY GATE');
}

function startGame() {
  game.hero = createHero();
  game.world = createWorld(mulberry32((Math.random() * 1e9) | 0));
  game.entities = [];
  game.particles = createParticles();
  game.state = 'playing';
  game.time = 0;
  game.audio.unlock();
  startMission(0);
}

function endGame(reason) {
  game.state = 'gameover';
  game.overReason = reason;
  game.audio.hit();
}

function winGame() {
  game.state = 'victory';
  game.hero.score += SCORE.missionBonus;
  game.audio.fanfare();
}

function damageHero(amount, x, y) {
  const hero = game.hero;
  if (hero.invulnerable > 0 || game.state !== 'playing') return;
  hero.hull -= amount;
  hero.invulnerable = 0.8;
  hero.shake = 1;
  hero.combo = 0;
  hero.comboTimer = 0;
  game.audio.hit();
  game.particles.burst(x, y, '#e74c3c', 16, 260);
  if (hero.hull <= 0) endGame('AEGIS-7 was shot down over the city.');
}

function spawnRing(big = false) {
  const x = range(rng, -0.7, 0.7);
  const y = range(rng, 0.3, 0.75);
  game.entities.push(createRing(x, y, big));
  game.spawnedRings += 1;
}

function spawnDrone() {
  const x = range(rng, -0.7, 0.7);
  const y = range(rng, 0.3, 0.8);
  game.entities.push(createDrone(rng, x, y));
  game.spawnedDrones += 1;
}

function spawnMissile() {
  game.entities.push(createMissile(range(rng, -0.6, 0.6), range(rng, 0.3, 0.7)));
  if (game.missionIndex === 2) game.audio.warning();
}

// One simulation step. `silent` skips audio (used by screenshot scenes).
game.tick = (dt, silent = false) => {
  const hero = game.hero;
  game.time += dt;
  if (game.bannerTimer > 0) {
    game.bannerTimer -= dt;
    if (game.banner) game.banner.alpha = Math.min(1, game.bannerTimer);
    if (game.bannerTimer <= 0) game.banner = null;
  }
  const speed = 0.25 + hero.throttle * 0.75;
  game.world.update(dt, speed);

  // Spawning by mission.
  game.spawnTimer -= dt;
  if (game.mission.id === 1) {
    if (game.spawnTimer <= 0 && game.spawnedRings < game.mission.rings) {
      spawnRing();
      game.spawnTimer = 1.1;
    }
  } else if (game.mission.id === 2) {
    game.droneTimer -= dt;
    if (game.droneTimer <= 0 && game.spawnedDrones < game.mission.drones + 2) {
      spawnDrone();
      game.droneTimer = 1.4;
    }
  } else {
    game.missileTimer -= dt;
    if (game.missileTimer <= 0) {
      spawnMissile();
      game.missileTimer = 2.2;
    }
    if (game.spawnTimer <= 0 && game.spawnedRings === 0) {
      spawnRing(true);
      game.spawnTimer = 999;
    }
    game.droneTimer -= dt;
    if (game.droneTimer <= 0 && game.spawnedDrones < game.mission.drones) {
      spawnDrone();
      game.droneTimer = 2.6;
    }
  }

  // Rings approach; passing through one scores.
  for (const e of game.entities) {
    if (e.kind === 'ring') {
      e.z -= dt * (0.3 + speed * 0.55);
      if (e.z <= 0 && !e.passed) {
        e.passed = true;
        if (ringPassed(e, hero)) {
          hero.rings += 1;
          hero.fuel = Math.min(100, hero.fuel + HERO.ringFuel);
          addScore(hero, e.big ? SCORE.gate : SCORE.ring);
          if (!silent) game.audio.ring(hero.combo);
          const p = { x: 640 + hero.x * 260, y: 560 - hero.y * 180 };
          game.particles.burst(p.x, p.y, '#f2c94c', 22, 300);
          if (e.big) { winGame(); return; }
          if (game.mission.id === 1 && hero.rings >= game.mission.rings) {
            hero.score += SCORE.missionBonus;
            startMission(1);
          }
        } else {
          hero.combo = 0;
          hero.comboTimer = 0;
        }
      }
    }
  }

  // Drones, missiles, orbs, bolts (the hero's shots ride along).
  const events = updateEntities(game.entities.concat(hero.shots), hero, dt, rng, speed);
  for (const ev of events) {
    if (ev.type === 'droneShot') {
      const d = ev.from;
      const dx = (hero.x - d.x) * 0.35;
      const dy = (hero.y - d.y) * 0.35;
      game.entities.push(createOrb(d.x, d.y, Math.max(0.05, d.z - 0.05), dx, dy));
    } else if (ev.type === 'droneKilled') {
      hero.kills += 1;
      hero.fuel = Math.min(100, hero.fuel + HERO.killFuel);
      addScore(hero, SCORE.drone);
      if (!silent) game.audio.explode();
      const p = { x: 640 + ev.drone.x * 260, y: 560 - ev.drone.y * 180 };
      game.particles.burst(p.x, p.y, '#e74c3c', 18, 280);
      if (game.mission.id === 2 && hero.kills >= game.mission.drones) {
        hero.score += SCORE.missionBonus;
        startMission(2);
      }
    } else if (ev.type === 'missileArrived') {
      if (nearHero(ev.missile, hero, 0.09)) {
        damageHero(HERO.missileDamage, 640 + hero.x * 260, 560 - hero.y * 180);
      }
    } else if (ev.type === 'orbArrived') {
      if (nearHero(ev.orb, hero, 0.075)) {
        damageHero(HERO.orbDamage, 640 + hero.x * 260, 560 - hero.y * 180);
      }
    } else if (ev.type === 'dronePassed') {
      if (nearHero(ev.drone, hero, 0.1)) {
        damageHero(HERO.grazeDamage, 640 + hero.x * 260, 560 - hero.y * 180);
      }
    }
  }

  // Centre buildings graze the hero when flown too low over them.
  for (const b of game.world.buildings) {
    if (b.z > -0.05 && b.z < 0.08 && Math.abs(b.x) < 0.3 && Math.abs(b.x - hero.x) < 0.11 && hero.y < 0.32) {
      damageHero(HERO.grazeDamage, 640 + hero.x * 260, 560 - hero.y * 180);
      b.z = -0.2;
    }
  }

  game.entities = game.entities.filter((e) => !e.dead && (e.kind !== 'ring' || e.z > -0.3));
  hero.shots = hero.shots.filter((b) => !b.dead);
  game.particles.update(dt);

  if (hero.fuel <= 0 && game.state === 'playing') {
    endGame('Out of fuel — AEGIS-7 glided into the river.');
  }
};

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - (frame.last || now)) / 1000 || 0.016);
  frame.last = now;
  const input = game.input;

  if (game.state === 'title') {
    if (input.consume('enter') || input.mouseDown) startGame();
    game.time += dt;
    game.world.update(dt, 0.4);
  } else if (game.state === 'playing') {
    if (input.consume('p') || input.consume('escape')) { game.state = 'paused'; input.clearPressed(); return; }
    if (input.consume('m')) game.audio.toggleMute();
    updateHero(game.hero, input, dt);
    if (input.fire) heroFire(game.hero);
    if (!game.audio.muted && input.fire && game.hero.fireCooldown > 0.18) game.audio.shoot();
    game.tick(dt);
  } else if (game.state === 'paused') {
    if (input.consume('p') || input.consume('escape')) { game.state = 'playing'; input.clearPressed(); }
  } else if (game.state === 'gameover' || game.state === 'victory') {
    if (input.consume('r') || input.consume('enter')) startGame();
  }
  render(ctx, game);
  input.clearPressed();
}

// Screenshot scenes run before the loop starts; the frame then renders once.
const shot = params.get('shot');
if (shot) {
  applyShotScene(game, shot, seed);
  render(ctx, game);
  window.__doom = { game, state: () => game.state, hero: () => game.hero };
} else {
  window.__doom = { game, state: () => game.state, hero: () => game.hero, start: startGame };
  requestAnimationFrame(frame);
}
