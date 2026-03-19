let population = [];
let target;
let counter = 0;      // Current frame count
let lifetime = 1000;   // How many frames they live
let popSize = 50;     // Number of creatures
let gen = 1;           // Generation counter
let isPaused = false;  // Pause toggle
let infoDiv;           // For the hover text
let obstacles = [];

function setup() {
    createCanvas(1800, 970);
    target = createVector(width-50, height / 2);
    generateMap();
    for (let i = 0; i < popSize; i++) {
        population[i] = new Creature(new DNA());
    }
}

function draw() {
    background(30);
    // Show the goal
    fill(255);
    textSize(16);
    text(`Generation: ${gen}`, 20, 30);
    text(`Time: ${counter} / ${lifetime}`, 20, 50);
    text(`Status: ${isPaused ? "PAUSED (Space to Resume)" : "RUNNING"}`, 20, 70);
    
    fill(0, 255, 0);
    ellipse(target.x, target.y, 24, 24);
    let allFinished = population.every(c => c.completed || c.crashed);

    for (let obs of obstacles){
        obs.show();
    }

    if (counter < lifetime && !allFinished) {
        let hoveredCreature = null;

        for (let c of population) {
            c.update();
            c.show();
          
          // Check for hover
            if (c.isMouseOver()) {
                hoveredCreature = c;
            }
        }
    
        // 2. Show Individual Stats on Hover
        if (hoveredCreature) {
            drawTooltip(hoveredCreature);
        }
    
        counter++;
    } else {
        // WHEN DEAD: Evolve
        let matingPool = evaluate(); // Build the pool of winners
        reproduction(matingPool);
        // Create the next generation
        generateMap();
        counter = 0;
        gen++; // Increment the generation counter
    }
}

function drawTooltip(c) {
    // Draw the tooltip background
    fill(255, 230);
    rect(mouseX + 10, mouseY + 10, 150, 60, 5);
    // Draw the tooltip text
    fill(0);
    textSize(12);
    // Calculate temporary fitness to show progress
    let d = floor(dist(c.pos.x, c.pos.y, target.x, target.y));
    text(`Distance: ${d}px`, mouseX + 20, mouseY + 30); // Show the distance to the target
    text(`Fitness: ${c.fitness.toFixed(4)}`, mouseX + 20, mouseY + 50); // Show the fitness of the creature
}

function reproduction(matingPool) {
    for (let i = 0; i < popSize; i++) {
      // Pick parents
      let parentA = random(matingPool).dna;
      let parentB = random(matingPool).dna;
      
      // Crossover & Mutate
      let childDNA = parentA.crossover(parentB);
      childDNA.mutate(0.05); // 2% chance for a random gene
      
      // Create NEW creature (This resets pos, vel, crashed, etc.)
      population[i] = new Creature(childDNA);
    }
  }

function evaluate() {
    let matingPool = [];
    let maxFit = 0;
  
    // 1. Calculate fitness for all and find the winner
    for (let c of population) {
      c.calcFitness();
      if (c.fitness > maxFit) maxFit = c.fitness;
    }
  
    // 2. Normalize: Scale everyone's fitness relative to the winner (0 to 1)
    for (let i = 0; i < population.length; i++) {
      // If the winner has 0.001 fitness, they now have 1.0
      let fitnessNormal = population[i].fitness / maxFit;
      
      // 3. Add to pool (the "Lottery")
      // A winner gets 100 tickets, a loser gets 1.
      let n = floor(fitnessNormal * 100) + 1; 
      for (let j = 0; j < n; j++) {
        matingPool.push(population[i]);
      }
    }
    return matingPool;
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