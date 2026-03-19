let population = [];
let target;
let counter = 0;      // Current frame count
let lifetime = 900;   // How many frames they live
let popSize = 120;     // Number of creatures
let gen = 1;           // Generation counter
let isPaused = false;  // Pause toggle
let obstacles = [];
let lastGenStats = null;
let bgLayer;
let trailLayer;
let canvasElt;
let ui = null;
let baseMutationRate = 0.03;
let eliteCount = 6;
let tournamentK = 5;
let runSeed = null;
let bestEver = null; // { genes, fitness, gen, seed }
let statusUntilMs = 0;

const DESIGN_W = 1885;
const DESIGN_H = 970;

const MAP_CHANGES_EVERY_GENERATION = false;
const STORAGE_BEST_KEY = "evo.bestDNA.v1";
const STORAGE_SEED_KEY = "evo.seed.v1";

function $(id) {
  return document.getElementById(id);
}

function setStatus(msg, ms = 2000) {
  if (ui?.statusText) ui.statusText.textContent = msg;
  statusUntilMs = millis() + ms;
}

function parseSeed(s) {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return Math.floor(n);
}

function applySeed(seed) {
  runSeed = seed;
  randomSeed(runSeed);
  noiseSeed(runSeed);
  try {
    localStorage.setItem(STORAGE_SEED_KEY, String(runSeed));
  } catch (_) {}
}

function randomizeSeed() {
  // Keep within 32-bit to be consistent across browsers
  const s = Math.floor(Math.random() * 2147483647);
  applySeed(s);
  if (ui?.seedInput) ui.seedInput.value = String(s);
  setStatus(`Seed set to ${s}`);
}

function loadSeedFromStorage() {
  try {
    const s = localStorage.getItem(STORAGE_SEED_KEY);
    const n = parseSeed(s ?? "");
    return n ?? null;
  } catch (_) {
    return null;
  }
}

function loadBestFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_BEST_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.genes) || data.genes.length < 3) return null;
    return {
      genes: data.genes.map(Number),
      fitness: Number(data.fitness) || 0,
      gen: Number(data.gen) || 0,
      seed: Number.isFinite(Number(data.seed)) ? Number(data.seed) : null,
      savedAt: data.savedAt ?? null,
    };
  } catch (_) {
    return null;
  }
}

function saveBestToStorage(best) {
  try {
    localStorage.setItem(
      STORAGE_BEST_KEY,
      JSON.stringify({
        genes: best.genes,
        fitness: best.fitness,
        gen: best.gen,
        seed: best.seed,
        savedAt: new Date().toISOString(),
      })
    );
    return true;
  } catch (_) {
    return false;
  }
}

function resetSimulation({ newMap = false, keepSeed = true } = {}) {
  if (!keepSeed) randomizeSeed();
  if (runSeed === null) {
    const stored = loadSeedFromStorage();
    if (stored !== null) applySeed(stored);
    else randomizeSeed();
  } else {
    applySeed(runSeed);
  }

  target = createVector(width - 50, height / 2);
  if (newMap || obstacles.length === 0) generateMap();

  // reset state
  population = [];
  for (let i = 0; i < popSize; i++) population[i] = new Creature(new DNA());
  counter = 0;
  gen = 1;
  lastGenStats = null;
  trailLayer?.clear?.();
}

function applyLoadedBest(genes) {
  // Create a new population around the loaded DNA
  const base = new DNA([...genes]);
  population = [];
  for (let i = 0; i < popSize; i++) {
    const dna = new DNA([...base.genes]);
    // keep a few exact copies, diversify the rest
    if (i >= min(eliteCount, 8)) dna.mutate(baseMutationRate * 1.2);
    population.push(new Creature(dna));
  }
  counter = 0;
  gen = 1;
  lastGenStats = null;
  trailLayer?.clear?.();
}

function initUI() {
  ui = {
    btnRestart: $("btnRestart"),
    btnNewMap: $("btnNewMap"),
    popSlider: $("popSize"),
    lifeSlider: $("lifetime"),
    mutSlider: $("mutation"),
    seedInput: $("seed"),
    btnApplySeed: $("btnApplySeed"),
    btnRandomSeed: $("btnRandomSeed"),
    btnSaveBest: $("btnSaveBest"),
    btnLoadBest: $("btnLoadBest"),
    valPop: $("valPop"),
    valLife: $("valLife"),
    valMut: $("valMut"),
    statusText: $("statusText"),
  };

  if (ui.popSlider) ui.popSlider.value = String(popSize);
  if (ui.lifeSlider) ui.lifeSlider.value = String(lifetime);
  if (ui.mutSlider) ui.mutSlider.value = String(baseMutationRate);
  if (ui.valPop) ui.valPop.textContent = String(popSize);
  if (ui.valLife) ui.valLife.textContent = String(lifetime);
  if (ui.valMut) ui.valMut.textContent = baseMutationRate.toFixed(3);

  const storedSeed = loadSeedFromStorage();
  if (ui.seedInput && storedSeed !== null) ui.seedInput.value = String(storedSeed);

  bestEver = loadBestFromStorage();
  if (bestEver) setStatus(`Loaded saved best (fitness ${bestEver.fitness.toFixed?.(3) ?? bestEver.fitness})`, 2500);

  ui.btnRestart?.addEventListener("click", () => {
    resetSimulation({ newMap: false, keepSeed: true });
    setStatus("Restarted");
  });

  ui.btnNewMap?.addEventListener("click", () => {
    resetSimulation({ newMap: true, keepSeed: true });
    setStatus("Generated new map");
  });

  ui.popSlider?.addEventListener("input", () => {
    popSize = Number(ui.popSlider.value);
    if (ui.valPop) ui.valPop.textContent = String(popSize);
  });
  ui.popSlider?.addEventListener("change", () => {
    resetSimulation({ newMap: false, keepSeed: true });
    setStatus(`Population set to ${popSize}`);
  });

  ui.lifeSlider?.addEventListener("input", () => {
    lifetime = Number(ui.lifeSlider.value);
    if (ui.valLife) ui.valLife.textContent = String(lifetime);
  });
  ui.lifeSlider?.addEventListener("change", () => {
    resetSimulation({ newMap: false, keepSeed: true });
    setStatus(`Lifetime set to ${lifetime}`);
  });

  ui.mutSlider?.addEventListener("input", () => {
    baseMutationRate = Number(ui.mutSlider.value);
    if (ui.valMut) ui.valMut.textContent = baseMutationRate.toFixed(3);
  });
  ui.mutSlider?.addEventListener("change", () => {
    setStatus(`Mutation set to ${baseMutationRate.toFixed(3)}`);
  });

  ui.btnApplySeed?.addEventListener("click", () => {
    const n = parseSeed(ui.seedInput?.value ?? "");
    if (n === null) return setStatus("Enter a valid numeric seed", 2500);
    applySeed(n);
    resetSimulation({ newMap: true, keepSeed: true });
    setStatus(`Applied seed ${n} (new map)`, 2500);
  });

  ui.btnRandomSeed?.addEventListener("click", () => {
    randomizeSeed();
    resetSimulation({ newMap: true, keepSeed: true });
  });

  ui.btnSaveBest?.addEventListener("click", () => {
    if (!bestEver) return setStatus("No best DNA captured yet", 2500);
    const ok = saveBestToStorage(bestEver);
    setStatus(ok ? "Saved best DNA" : "Failed to save (storage blocked?)", 2500);
  });

  ui.btnLoadBest?.addEventListener("click", () => {
    const b = loadBestFromStorage();
    if (!b) return setStatus("No saved best DNA found", 2500);
    bestEver = b;
    // optional: apply seed used when it was saved
    if (typeof b.seed === "number") {
      applySeed(b.seed);
      if (ui.seedInput) ui.seedInput.value = String(b.seed);
    }
    resetSimulation({ newMap: true, keepSeed: true });
    applyLoadedBest(b.genes);
    setStatus("Loaded best DNA into population", 2500);
  });
}

function setup() {
    const { w, h } = computeCanvasSize();
    const c = createCanvas(w, h);
    canvasElt = c;
    const frame = document.querySelector(".frame");
    if (frame) frame.prepend(c.elt);

    pixelDensity(1);
    bgLayer = createGraphics(width, height);
    trailLayer = createGraphics(width, height);
    trailLayer.clear();
    buildBackground(bgLayer);

    initUI();
    resetSimulation({ newMap: true, keepSeed: true });
}

function computeCanvasSize() {
  const pad = 40; // matches frame/app padding roughly
  const vw = max(320, windowWidth - pad);
  const vh = max(240, windowHeight - pad);
  const scale = min(vw / DESIGN_W, vh / DESIGN_H, 1);
  return { w: floor(DESIGN_W * scale), h: floor(DESIGN_H * scale) };
}

function rebuildLayers() {
  bgLayer = createGraphics(width, height);
  trailLayer = createGraphics(width, height);
  trailLayer.clear();
  buildBackground(bgLayer);
  target = createVector(width - 50, height / 2);
  generateMap();
}

function windowResized() {
  const { w, h } = computeCanvasSize();
  resizeCanvas(w, h);
  rebuildLayers();
  resetSimulation({ newMap: false, keepSeed: true });
}

function buildBackground(g) {
  g.noFill();
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const c1 = color(8, 10, 18);
    const c2 = color(18, 26, 54);
    const c3 = color(8, 12, 20);
    const top = lerpColor(c2, c1, t);
    const col = lerpColor(top, c3, pow(t, 2.2));
    g.stroke(col);
    g.line(0, y, width, y);
  }

  // Subtle grid
  g.push();
  g.stroke(255, 255, 255, 12);
  g.strokeWeight(1);
  for (let x = 0; x < width; x += 60) g.line(x, 0, x, height);
  for (let y = 0; y < height; y += 60) g.line(0, y, width, y);
  g.pop();

  // Vignette
  g.push();
  g.noStroke();
  for (let i = 0; i < 16; i++) {
    g.fill(0, 0, 0, 12);
    g.rect(i * 8, i * 6, width - i * 16, height - i * 12, 18);
  }
  g.pop();
}

function drawTarget() {
  push();
  noStroke();
  // glow
  for (let i = 0; i < 6; i++) {
    fill(90, 255, 190, 28 - i * 3.2);
    ellipse(target.x, target.y, 90 - i * 10, 90 - i * 10);
  }
  // core
  fill(140, 255, 220, 245);
  ellipse(target.x, target.y, 20, 20);
  fill(255, 255, 255, 220);
  ellipse(target.x, target.y, 8, 8);
  pop();
}

function drawHUD() {
  push();
  textFont("ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial");
  textSize(15);
  textAlign(LEFT, TOP);

  const pad = 14;
  const x = 16;
  const y = 16;
  const w = 310;
  const h = lastGenStats ? 152 : 112;

  noStroke();
  fill(0, 0, 0, 110);
  rect(x, y, w, h, 14);
  stroke(255, 255, 255, 28);
  noFill();
  rect(x, y, w, h, 14);

  noStroke();
  fill(235, 245, 255, 235);
  text(`Generation: ${gen}`, x + pad, y + 14);
  fill(235, 245, 255, 200);
  text(`Time: ${counter} / ${lifetime}`, x + pad, y + 36);
  text(`Status: ${isPaused ? "PAUSED" : "RUNNING"}`, x + pad, y + 58);
  text(`Seed: ${runSeed ?? "-"}`, x + pad, y + 80);
  if (lastGenStats) {
    fill(235, 245, 255, 180);
    text(`Best min distance: ${lastGenStats.bestMinDist}px`, x + pad, y + 104);
    text(`Completed last gen: ${lastGenStats.completedCount}`, x + pad, y + 124);
    text(`Best fitness: ${lastGenStats.bestFitness.toFixed(3)}`, x + pad, y + 144);
  }
  pop();
}

function draw() {
    if (ui?.statusText && statusUntilMs && millis() > statusUntilMs) {
      ui.statusText.textContent = "";
      statusUntilMs = 0;
    }
    image(bgLayer, 0, 0);

    // fade trails smoothly
    trailLayer.noStroke();
    trailLayer.fill(0, 0, 0, 18);
    trailLayer.rect(0, 0, width, height);

    let allFinished = population.every(c => c.completed || c.crashed);

    // draw trails first so walls/target stay crisp on top
    image(trailLayer, 0, 0);

    for (let obs of obstacles){
        obs.show();
    }

    drawTarget();

    if (counter < lifetime && !allFinished) {
        let hoveredCreature = null;

        for (let c of population) {
            c.update();
            c.show(trailLayer);
          
          // Check for hover
            if (c.isMouseOver()) {
                hoveredCreature = c;
            }
        }
    
        // 2. Show Individual Stats on Hover
        if (hoveredCreature) {
            drawTooltip(hoveredCreature);
        }

        drawHUD();
    
        counter++;
    } else {
        // WHEN DEAD: Evolve
        let evalResult = evaluate();
        lastGenStats = evalResult.stats;
        reproduction(evalResult);
        // Create the next generation
        if (MAP_CHANGES_EVERY_GENERATION) generateMap();
        counter = 0;
        gen++; // Increment the generation counter
    }
}

function drawTooltip(c) {
    // Draw the tooltip background
    fill(0, 0, 0, 190);
    stroke(255, 255, 255, 40);
    rect(mouseX + 10, mouseY + 10, 170, 66, 10);
    // Draw the tooltip text
    noStroke();
    fill(235, 245, 255);
    textSize(12);
    // Calculate temporary fitness to show progress
    let d = floor(dist(c.pos.x, c.pos.y, target.x, target.y));
    text(`Distance: ${d}px`, mouseX + 20, mouseY + 30);
    text(`Fitness: ${c.fitness.toFixed(4)}`, mouseX + 20, mouseY + 48);
    if (typeof c.minDist === "number") text(`Best: ${floor(c.minDist)}px`, mouseX + 20, mouseY + 66);
}

function pickRoulette(sortedPopulation, totalFitness) {
  let r = random(totalFitness);
  for (let c of sortedPopulation) {
    r -= c.fitness;
    if (r <= 0) return c;
  }
  return sortedPopulation[sortedPopulation.length - 1];
}

function pickTournament(sortedPopulation) {
  // Tournament selection increases selection pressure without needing fitness scaling.
  let best = null;
  for (let i = 0; i < tournamentK; i++) {
    let c = random(sortedPopulation);
    if (!best || c.fitness > best.fitness) best = c;
  }
  return best;
}

function reproduction({ sortedPopulation, totalFitness, bestFitness }) {
  let next = [];

  // Elitism: carry over top performers unchanged
  for (let i = 0; i < min(eliteCount, sortedPopulation.length); i++) {
    next.push(new Creature(new DNA([...sortedPopulation[i].dna.genes])));
  }

  // Adaptive mutation: lower mutation when population is already doing well
  let mutationRate = baseMutationRate;
  if (bestFitness > 5) mutationRate *= 0.7;
  if (bestFitness > 15) mutationRate *= 0.5;
  mutationRate = constrain(mutationRate, 0.005, 0.08);

  while (next.length < popSize) {
    // Hybrid: tournament for exploitation, roulette for diversity
    let parentA = (random(1) < 0.7 ? pickTournament(sortedPopulation) : pickRoulette(sortedPopulation, totalFitness)).dna;
    let parentB = (random(1) < 0.7 ? pickTournament(sortedPopulation) : pickRoulette(sortedPopulation, totalFitness)).dna;

    let childDNA = parentA.crossover(parentB);
    childDNA.mutate(mutationRate);
    next.push(new Creature(childDNA));
  }

  population = next;
}

function evaluate() {
    let bestFitness = 0;
    let totalFitness = 0;
    let completedCount = 0;
    let bestMinDist = Infinity;

    // Calculate fitness for all
    for (let c of population) {
      c.calcFitness();
      if (c.completed) completedCount++;
      if (typeof c.minDist === "number") bestMinDist = min(bestMinDist, floor(c.minDist));
      if (c.fitness > bestFitness) bestFitness = c.fitness;
      totalFitness += c.fitness;
    }

    // Guard: if everything is 0, avoid NaNs and randomize selection uniformly
    if (totalFitness <= 0) {
      totalFitness = population.length;
      for (let c of population) c.fitness = 1;
      bestFitness = 1;
    }

    let sortedPopulation = [...population].sort((a, b) => b.fitness - a.fitness);
    let stats = { completedCount, bestMinDist: isFinite(bestMinDist) ? bestMinDist : -1, bestFitness };
    if (completedCount > 0) console.log(`Gen ${gen}: completed=${completedCount}, bestMinDist=${stats.bestMinDist}, bestFitness=${bestFitness}`);

    // Track best-ever DNA for Save/Load
    const best = sortedPopulation[0];
    if (best?.dna?.genes && (bestEver === null || best.fitness > (bestEver.fitness ?? 0))) {
      bestEver = { genes: [...best.dna.genes], fitness: best.fitness, gen, seed: runSeed };
      // auto-save silently (best effort)
      saveBestToStorage(bestEver);
    }
    return { sortedPopulation, totalFitness, bestFitness, stats };
  }

function keyPressed() {
    if (key === ' ') { // Spacebar
        isPaused = !isPaused;
        // Pause or resume the simulation
        if (isPaused) noLoop();
        else loop();
    }
}

function generateMap() {
    obstacles = [];
    let obstacleCount = 8; // More obstacles for a "maze" feel
  
    // Define Safe Zones (x, y, width, height)
    let startSafe = { x: 0, y: 0, w: 150, h: height };
    let targetSafe = { x: target.x - 60, y: target.y - 60, w: 120, h: 120 };
  
    for (let i = 0; i < obstacleCount; i++) {
      let w, h, x, y;
      
      // Randomly decide if it's a vertical or horizontal wall
      if (random(1) > 0.5) {
        w = random(20, 40);
        h = random(100, 250);
      } else {
        w = random(100, 250);
        h = random(20, 40);
      }
  
      x = random(100, width - 200);
      y = random(0, height - h);
  
      // Check if this new obstacle overlaps with Safe Zones
      let inStartSafe = (x < startSafe.w);
      let inTargetSafe = (x + w > targetSafe.x && x < targetSafe.x + targetSafe.w &&
                          y + h > targetSafe.y && y < targetSafe.y + targetSafe.w);
  
      if (!inStartSafe && !inTargetSafe) {
        obstacles.push(new Obstacle(x, y, w, h));
      } else {
        // If it hit a safe zone, skip this one and try again
        i--; 
      }
    }
  }