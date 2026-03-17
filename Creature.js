class Creature {
    constructor(dna) {
        this.dna = dna;
        this.pos = createVector(width / 2, height / 2);
        this.fitness = 0;
      
      // Map DNA (0-1) to actual physical traits
        this.size = map(this.dna.genes[0], 0, 1, 10, 50);
        this.speed = map(this.dna.genes[1], 0, 1, 2, 10);
    }
  
    update() {
      // Simple logic: move right
        this.pos.x += this.speed;
    }
  
    show() {
        fill(255, 100);
        stroke(255);
        ellipse(this.pos.x, this.pos.y, this.size);
    }

    calcFitness() {
        let d = dist(this.pos.x, this.pos.y, target.x, target.y);
        
        // 1. Calculate base fitness (0 to 1)
        // We map it so that being at the target = 1, and being far = 0
        let score = map(d, 0, width, 1, 0);
        
        // 2. Apply the exponent
        // The higher the power, the more "picky" the evolution becomes
        this.fitness = pow(score, 4); 
    }
}