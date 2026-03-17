let population = [];
let target;
let counter = 0;      // Current frame count
let lifetime = 200;   // How many frames they live
let popSize = 50;     // Number of creatures
let gen = 1;           // Generation counter
let isPaused = false;  // Pause toggle
let infoDiv;           // For the hover text
let obstacles = [];

function setup() {
    createCanvas(800, 400);
    target = createVector(width - 50, height / 2);
    for (let i = 0; i < popSize; i++) {
        let dna = new DNA(lifetime); // Each DNA needs 200 vectors (one for each frame of life)
        population[i] = new Creature(dna);
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

    for (let obs of obstacles){
        obs.show();
    }

    if (counter < lifetime) {
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
        reproduction(matingPool);    // Create the next generation
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
    let nextGeneration = [];
    // 1. Pick two random parents from the pool
    // Because better creatures are in the pool more often, 
    // they have a higher chance of being picked.
    for (let i = 0; i < popSize; i++) {
        let parentA = random(matingPool);
        let parentB = random(matingPool);
        // 2. Create a child DNA by crossing over the parents
        let childDNA = parentA.dna.crossover(parentB.dna);
        // 3. Mutate (add random noise to prevent "stagnation")
        childDNA.mutate(0.01); // 1% mutation rate
        // 4. Fill the new generation array
        nextGeneration[i] = new Creature(childDNA);
    }
    // 5. Replace the old population with the new one
    population = nextGeneration;
}

function evaluate() {
    let matingPool = [];
    
    // Calculate fitness for all
    for (let c of population) {
        c.calcFitness();
    }
  
    // Add to pool based on fitness score
    for (let i = 0; i < population.length; i++) {
      // Multiply fitness to get a whole number of "tickets"
        let n = floor(population[i].fitness * 100) + 1; 
        // Add the creature to the mating pool based on its fitness score
        for (let j = 0; j < n; j++) {
            matingPool.push(population[i]);
        }
    }
    // Return the mating pool
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

function generateMap(){
    obstacles = [];
    let obstacleCount = floor(random(1, 10));

    for(let i = 0; i < obstacleCount; i++){
        let w = random(20,150);
        let h = random(20,150);
        // Dont spawn walls on top of the Start or Target
        let x = random(100, width - 200);
        let y = random(50, height - 50);
        obstacles.push(new Obstacle(x,y,w,h));
    }
}