class Creature {
    constructor(dna) {
      this.dna = dna; // DNA now contains 3 weights: [targetWeight, avoidWeight, maxSpeed]
      this.pos = createVector(50, height / 2); // Start on the left
      this.vel = createVector(0, 0);
      this.acc = createVector(0, 0);
      
      this.maxSpeed = 4; //map(this.dna.genes[2], 0, 1, 2, 8);
      this.maxForce = 1; // How quickly they can turn
      
      this.fitness = 0;
      this.crashed = false;
      this.completed = false;
    }
  
    // A helper function to steer toward a specific target vector
    steer(targetVec, weight) {
      let desired = p5.Vector.sub(targetVec, this.pos);
      desired.setMag(this.maxSpeed);
      
      // Steering = Desired - Velocity
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      return steer.mult(weight);
    }
  
    update() {
      if (!this.crashed && !this.completed) {
        // 1. SEEK THE GOAL (Attraction)
        let seekForce = this.steer(target, this.dna.genes[0] * 2);
        // DEBUG: Draw a line showing the attraction force
        stroke(0, 255, 0, 100);
        line(this.pos.x, this.pos.y, this.pos.x + seekForce.x * 100, this.pos.y + seekForce.y * 100);
        
        let noise = p5.Vector.random2D().mult(0.1);
        this.applyForce(noise);
  
        // 2. AVOID OBSTACLES (Repulsion)
        for (let obs of obstacles) {
          // Calculate center of obstacle
          let obsCenter = createVector(obs.pos.x + obs.w/2, obs.pos.y + obs.h/2);
          let d = dist(this.pos.x, this.pos.y, obsCenter.x, obsCenter.y);
          
          // If getting close to a wall, apply a "push-away" force
          if (d < 100) { 
            let avoidForce = this.steer(this.pos, this.dna.genes[1] * 3); 
            // Note: Steer toward self = moving away from the source
            this.applyForce(avoidForce);
          }
        }
  
        // Physics standard
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
  
        // Check for success or crash
        this.checkStatus();
      }
    }
  
    checkStatus() {
      // Check if hit target
      if (dist(this.pos.x, this.pos.y, target.x, target.y) < 15) {
        this.completed = true;
      }
      // Check if hit obstacle
      for (let obs of obstacles) {
        if (obs.contains(this.pos.x, this.pos.y)) {
          this.crashed = true;
        }
      }
      // Check if out of bounds
      if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
        this.crashed = true;
      }
    }
  
    applyForce(f) {
      this.acc.add(f);
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
        // CRITICAL: If they crashed, their fitness is severely reduced
        if (this.crashed) {
            this.fitness /= 10;
        }
    }

    isMouseOver() {
        let d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
        return d < 15; // Returns true if mouse is within 15 pixels
    }
}