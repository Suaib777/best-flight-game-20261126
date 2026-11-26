// Deterministic screenshot scenes (?shot=title|play|combat|victory&seed=N).
// Each one plays the real rules forward from a fresh world for a fixed number
// of steps, steered by a simple autopilot (chase the nearest ring, shoot the
// nearest drone, climb over centre buildings), so the frame is what a short
// real game looks like and the same seed always gives the same frame.
import { createHero, createDrone, updateHero, heroFire, updateEntities, ringPassed, nearHero, addScore } from './entities.js';
import { createWorld, createRing } from './world.js';

const STEP = 1 / 60;

function autopilotInput(game, hero) {
  // Steer toward the nearest ring; otherwise toward the nearest drone; fire
  // whenever a drone is roughly ahead.
  let tx = hero.x;
  let ty = hero.y;
  let fire = false;
  let best = null;
  for (const e of game.entities) {
    if (e.kind === 'ring' && !e.passed && (!best || e.z < best.z)) best = e;
  }
  if (best) {
    tx = best.x;
    ty = best.y;
  } else {
    let drone = null;
    for (const e of game.entities) {
      if (e.kind === 'drone' && !e.dead && (!drone || e.z < drone.z)) drone = e;
    }
    if (drone) {
      tx = drone.x;
      ty = drone.y;
      fire = Math.abs(drone.x - hero.x) < 0.2;
    }
  }
  // Climb over a centre building dead ahead.
  for (const b of game.world.buildings) {
    if (b.z > 0 && b.z < 0.35 && Math.abs(b.x) < 0.3 && Math.abs(b.x - hero.x) < 0.14 && hero.y < 0.36) {
      ty = 0.6;
    }
  }
  return { tx, ty, fire };
}

// Drive one frame with the autopilot instead of the real input.
export function autopilotStep(game, hero, dt) {
  const { tx, ty, fire } = autopilotInput(game, hero);
  const fake = {
    mouseX: (tx + 1) / 2,
    mouseY: (1 - ty) / 1.35,
    mouseDown: fire,
    steerX: 0,
    steerY: 0,
    throttleUp: false,
    throttleDown: false,
    fire,
    poll() {},
    consume() { return false; },
    clearPressed() {},
  };
  updateHero(hero, fake, dt);
  if (fire) heroFire(hero);
}

export function applyShotScene(game, scene, seed) {
  const hero = createHero();
  game.hero = hero;
  game.world = createWorld(game.rng);
  game.entities = [];
  game.state = 'playing';
  game.missionIndex = 0;
  game.mission = game.missions[0];
  game.spawnedRings = 0;
  game.spawnedDrones = 0;
  game.spawnTimer = 0;
  game.droneTimer = 0;
  game.missileTimer = 0;
  game.banner = null;
  game.time = 0;

  if (scene === 'title') {
    game.state = 'title';
    game.world = createWorld(game.rng);
    return;
  }

  if (scene === 'victory') {
    // Play mission 3 to the gate, then freeze on the victory screen.
    game.missionIndex = 2;
    game.mission = game.missions[2];
    game.hero.rings = 8;
    game.hero.kills = 10;
    game.hero.score = 2840;
    runFor(game, 60 * 14, true);
    game.entities.push(createRing(hero.x, hero.y, true));
    runFor(game, 60 * 3, true);
    return;
  }

  if (scene === 'combat') {
    game.missionIndex = 1;
    game.mission = game.missions[1];
    game.hero.score = 1150;
    game.hero.combo = 3;
    game.hero.comboTimer = 4;
    // Two drones already closing in, so the frame shows the fight at once.
    const d1 = createDrone(game.rng, -0.25, 0.55);
    d1.z = 0.55;
    const d2 = createDrone(game.rng, 0.3, 0.4);
    d2.z = 0.7;
    game.entities.push(d1, d2);
    game.spawnedDrones = 2;
    runFor(game, 60 * 8, true);
    // If the fight cleared the sky, bring one drone in close so the frame
    // shows the enemy the score came from.
    const anyNear = game.entities.some((e) => e.kind === 'drone' && !e.dead && e.z > 0.2 && e.z < 0.8);
    if (!anyNear) {
      const d3 = createDrone(game.rng, game.hero.x + 0.18, 0.55);
      d3.z = 0.5;
      game.entities.push(d3);
    }
    return;
  }

  // Default: 'play' — mission 1 ring run, autopilot threading rings.
  // Seven seconds keeps rings still ahead in the frame.
  runFor(game, 60 * 7, true);
}

function runFor(game, steps, autopilot) {
  for (let i = 0; i < steps; i += 1) {
    if (game.state !== 'playing') break;
    if (autopilot) autopilotStep(game, game.hero, STEP);
    game.tick(STEP, true);
  }
}
