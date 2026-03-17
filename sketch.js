let population = [];
let target;
let counter = 0;      // Current frame count
let lifetime = 200;   // How many frames they live
let popSize = 50;     // Number of creatures

function setup() {
    createCanvas(800, 400);
    target = createVector(width - 50, height / 2);
    for (let i = 0; i < popSize; i++) {
        let dna = new DNA(2); // 2 genes: size and speed
        population[i] = new Creature(dna);
    }
}

function draw() {
    background(30);
    fill(0, 255, 0);
    noStroke();
    ellipse(target.x, target.y, 24, 24);

    for (let c of population) {
        c.update();
        c.show();
    }
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
        let n = floor(population[i].fitness * 100); 
        for (let j = 0; j < n; j++) {
            // Add the creature to the mating pool based on its fitness score
            matingPool.push(population[i]);
        }
        // Return the mating pool
    }
    return matingPool;
}