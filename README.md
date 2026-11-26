# Avengers Doomsday — Mahjong Skies

A flight game for make.fun's **best-flight-game** bounty. Fly AEGIS-7, an
armored hero, over a dusk city under attack in a Doomsday scenario: thread
the gold Mahjong rings, blast the Void drones, and reach the Doomsday Gate.

The whole game is drawn in a Mahjong style — jade green, ivory, gold and
red; HUD panels shaped like Mahjong tiles with gold trim; target rings
styled like circle-suit tiles; the combo shown as bamboo sticks; the drones
as dark tiles with a red dragon glyph. All art and sounds are original and
drawn/synthesized in code; no assets are copied or downloaded.

## How to play

- **Mouse / Arrow keys** — steer
- **W / S or Up / Down** — throttle (faster burns more fuel)
- **Space / Click** — fire the blaster
- **P** — pause, **M** — mute, **R** — restart

Three sorties in one run:

1. **Ring Run** — fly through 8 gold rings (each refuels +25)
2. **Void Swarm** — destroy 10 Void drones
3. **Doomsday Gate** — reach the giant gate ring through a missile barrage

Rings and kills build a combo (shown as bamboo sticks) that multiplies the
score. Watch fuel and hull: running dry or taking too many hits ends the
run. Flying too low over the centre buildings grazes the hull.

## Run it

```sh
node serve.ts        # serves game/ on http://localhost:8080
node shots.mjs       # playtests and takes the 4 screenshots
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts   # hand-in build
```

Node 22, standard library only; the game is plain static files under
`game/` with no network requests.
