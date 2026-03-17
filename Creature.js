class Creature {
    constructor(dna) {
        this.dna = dna;
        this.pos = createVector(width / 2, height - 20); // Start at bottom
        this.vel = createVector();
        this.acc = createVector();
        this.geneCounter = 0; // Which "instruction" are we on?
        this.fitness = 0;
    }
    
    applyForce(force) {
        // Add the force to the acceleration
        this.acc.add(force);
    }

    update() {
        // 1. The Brain Logic: Apply the current gene as a force
        this.applyForce(this.dna.genes[this.geneCounter]);
        // Increment gene counter
        this.geneCounter++;

        // 2. Physics Engine: standard Euler integration
        // Update velocity with acceleration
        this.vel.add(this.acc);
        // Update position with velocity
        this.pos.add(this.vel);
        // Reset acceleration to 0
        this.acc.mult(0);
    }
  
    show() {
        noStroke();
        
        // Use the magnitude of velocity to make them "stretch"
        let speed = this.vel.mag();
        let stretch = map(speed, 0, 5, 0, 15);
        
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        
        // Outer soft glow
        fill(100, 200, 255, 50); 
        ellipse(0, 0, 30 + stretch, 20);
        
        // Inner core
        fill(255, 200); 
        ellipse(0, 0, 15 + stretch, 10);
        
        pop();
      }

    calcFitness() {
        let d = dist(this.pos.x, this.pos.y, target.x, target.y);
        
        // 1. Calculate base fitness (0 to 1)
        // We map it so that being at the target = 1, and being far = 0
        let score = map(d, 0, width, 1, 0);
        
        // 2. Apply the exponent
        // The higher the power, the more "picky" the evolution becomes
        this.fitness = pow(score, 4);

        // CRITICAL : Bonus for actually hitting the target
        if (d < 10){
            this.fitness *= 10;
        }
    }

    isMouseOver() {
        let d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
        return d < 15; // Returns true if mouse is within 15 pixels
    }
}