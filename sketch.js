let population = [];
let target;
let counter = 0;      // Current frame count
let lifetime = 200;   // How many frames they live
let popSize = 50;     // Number of creatures

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
    fill(0, 255, 0);
    ellipse(target.x, target.y, 24, 24);

    if (counter < lifetime) {
        // WHILE ALIVE: Move and draw
        for (let i = 0; i < population.length; i++) {
            population[i].update();
            population[i].show();
        }
        counter++;
    } else {
        // WHEN DEAD: Evolve
        let matingPool = evaluate(); // Build the pool of winners
        reproduction(matingPool);    // Create the next generation
        counter = 0;                 // Reset the clock for Generation X+1
    }
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