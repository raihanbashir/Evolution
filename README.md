# Evolution (Darwinian Learning Simulator)

A visual evolution simulator built with **p5.js**. A population of “creatures” evolves across generations to reach a target while avoiding obstacles. Fitness is based on progress toward the goal and successful completion, and each generation is produced via selection + crossover + mutation.

## Demo

- **Target**: glowing green point on the right side
- **Creatures**: blue “comets” that learn over generations
- **Walls**: rounded obstacles (maze-like)

## Features

- **Genetic algorithm loop**: evaluate fitness → select parents → crossover → mutation → next generation
- **Anticipatory obstacle avoidance**: simple look-ahead steering to reduce wall collisions
- **Stats overlay**: generation/time, best min-distance, completions, best fitness
- **Hover inspection**: hover a creature to see live distance/fitness
- **Controls panel**:
  - Restart / New map
  - Sliders: population, lifetime, mutation rate
  - Seed: apply a numeric seed (reproducible runs) or randomize
  - Save/Load “best DNA” using `localStorage`
- **Responsive canvas**: scales to fit your browser window

## Controls

- **Space**: pause / resume
- **Hover**: inspect a creature
- **Right panel**: adjust simulation parameters and manage seeds / saved DNA

## Getting started (local)

Because browsers often block local file access, run a local server:

### Option A: VS Code / Cursor “Live Server”

- Open this folder
- Start Live Server
- Visit the served `index.html`

### Option B: Python

```bash
cd Evolution
python -m http.server 8000
```

Then open `http://localhost:8000`.

### Option C: Node

```bash
npx serve .
```

## Deploy (GitHub Pages)

1. Put the `Evolution/` folder in a public repo (or keep it at repo root).
2. In GitHub: **Settings → Pages**
3. Set source to your default branch and the folder containing `index.html`.
4. Save and wait for the page to publish.

## Reproducibility + saving progress

- **Seed**: the seed is applied to both `random()` and `noise()` so map generation and behavior randomness are repeatable.
- **Best DNA**: the simulator tracks the best-performing DNA and saves it (best effort) in your browser’s `localStorage`.

## Tech

- **p5.js** for rendering + simulation
- Plain JavaScript (no build step)
