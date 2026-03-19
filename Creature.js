class Creature {
    constructor(dna) {
      this.dna = dna; // DNA now contains 3 weights: [targetWeight, avoidWeight, maxSpeed]
      this.pos = createVector(50, height / 2); // Start on the left
      this.vel = createVector(0, 0);
      this.acc = createVector(0, 0);
      
      this.maxSpeed = this.dna?.genes?.[2] ?? 4;
      this.maxForce = 1; // How quickly they can turn
      
      this.fitness = 0;
      this.crashed = false;
      this.completed = false;
      this.finishTime = null;

      this.minDist = dist(this.pos.x, this.pos.y, target.x, target.y);
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
  
    steerAway(fromVec, weight) {
      // Desired direction is away from fromVec
      let desired = p5.Vector.sub(this.pos, fromVec);
      if (desired.magSq() === 0) return createVector(0, 0);
      desired.setMag(this.maxSpeed);
      let steer = p5.Vector.sub(desired, this.vel);
      steer.limit(this.maxForce);
      return steer.mult(weight);
    }

    clamp(v, lo, hi) {
      return max(lo, min(hi, v));
    }

    expandedContainsRect(obs, px, py, margin) {
      return (
        px > obs.pos.x - margin &&
        px < obs.pos.x + obs.w + margin &&
        py > obs.pos.y - margin &&
        py < obs.pos.y + obs.h + margin
      );
    }

    closestPointOnRect(obs, px, py) {
      let cx = this.clamp(px, obs.pos.x, obs.pos.x + obs.w);
      let cy = this.clamp(py, obs.pos.y, obs.pos.y + obs.h);
      return createVector(cx, cy);
    }

    predictDir() {
      // Prefer current motion; if nearly stopped, aim toward target.
      if (this.vel.magSq() > 0.01) return this.vel.copy().normalize();
      let toTarget = p5.Vector.sub(target, this.pos);
      if (toTarget.magSq() === 0) return createVector(1, 0);
      return toTarget.normalize();
    }
  
    update() {
      if (!this.crashed && !this.completed) {
        // 1. SEEK THE GOAL (Attraction)
        let seekForce = this.steer(target, this.dna.genes[0] * 2);
        
        // A tiny exploration term so early generations don't get stuck
        let noise = p5.Vector.random2D().mult(0.05);
        this.applyForce(noise);
  
        // 2. LOOKAHEAD AVOIDANCE (anticipate collisions)
        let dir = this.predictDir();
        let lookahead = this.clamp(40 + this.vel.mag() * 25, 40, 140);
        let future = p5.Vector.add(this.pos, p5.Vector.mult(dir, lookahead));

        let avoidWeight = this.dna.genes[1] * 3;
        let margin = 18;

        for (let obs of obstacles) {
          if (!this.expandedContainsRect(obs, future.x, future.y, margin)) continue;
          // Push away from the nearest point on the wall rectangle (more accurate than center)
          let nearest = this.closestPointOnRect(obs, future.x, future.y);
          let away = this.steerAway(nearest, avoidWeight);

          let d = dist(future.x, future.y, nearest.x, nearest.y);
          let factor = this.clamp(1.8 - (d / 60), 0.3, 1.8);
          this.applyForce(away.mult(factor));
        }

        // 3. FALLBACK: near-field repulsion (weaker than lookahead)
        for (let obs of obstacles) {
          // If getting close to a wall, apply a "push-away" force from nearest point
          let nearestNow = this.closestPointOnRect(obs, this.pos.x, this.pos.y);
          let dNow = dist(this.pos.x, this.pos.y, nearestNow.x, nearestNow.y);
          if (dNow < 35) {
            let avoidForce = this.steerAway(nearestNow, (this.dna.genes[1] * 3) * 0.6);
            let factor = this.clamp(1.2 - (dNow / 35), 0.2, 1.2);
            this.applyForce(avoidForce.mult(factor));
          }
        }

        // 4. Avoid screen edges using lookahead
        let edgeMargin = 35;
        if (future.x < edgeMargin) this.applyForce(createVector(this.maxForce * 1.2, 0));
        if (future.x > width - edgeMargin) this.applyForce(createVector(-this.maxForce * 1.2, 0));
        if (future.y < edgeMargin) this.applyForce(createVector(0, this.maxForce * 1.2));
        if (future.y > height - edgeMargin) this.applyForce(createVector(0, -this.maxForce * 1.2));
  
        // Physics standard
        this.vel.add(this.acc);
        this.vel.limit(this.maxSpeed);
        this.pos.add(this.vel);
        this.acc.mult(0);
  
        this.minDist = min(this.minDist, dist(this.pos.x, this.pos.y, target.x, target.y));

        // Check for success or crash
        this.checkStatus();
      }
    }
  
    checkStatus() {
      // Check if hit target
      if (dist(this.pos.x, this.pos.y, target.x, target.y) < 15) {
        this.completed = true;
        if (this.finishTime === null && typeof counter === "number") this.finishTime = counter;
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
  
    show(g) {
        const ctx = g ?? this;
        ctx.noStroke();
        
        // Use the magnitude of velocity to make them "stretch"
        let speed = this.vel.mag();
        let stretch = map(speed, 0, 5, 0, 15);
        
        ctx.push();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.vel.heading());
        
        // Outer soft glow
        ctx.fill(80, 190, 255, 35); 
        ctx.ellipse(0, 0, 34 + stretch, 22);
        
        // Inner core
        ctx.fill(245, 250, 255, 170); 
        ctx.ellipse(0, 0, 16 + stretch, 10);

        // Accent "nose" dot
        ctx.fill(60, 255, 200, 160);
        ctx.ellipse(8 + stretch * 0.35, 0, 3, 3);
        
        ctx.pop();
      }

    calcFitness() {
        let d = dist(this.pos.x, this.pos.y, target.x, target.y);
        let maxD = dist(0, 0, width, height);
        
        // 1. Calculate base fitness (0 to 1)
        // We map it so that being at the target = 1, and being far = 0
        let score = 1 - (d / maxD);
        score = constrain(score, 0, 1);
        
        // 2. Apply the exponent
        // The higher the power, the more "picky" the evolution becomes
        this.fitness = pow(score, 4);

        // Reward making consistent progress (not just final distance)
        let progressScore = 1 - (this.minDist / maxD);
        progressScore = constrain(progressScore, 0, 1);
        this.fitness *= (1 + progressScore);

        // Big bonus for actually hitting the target, with time bonus for earlier hits
        if (this.completed){
            let t = (this.finishTime === null || typeof lifetime !== "number") ? 1 : (1 + (lifetime - this.finishTime) / lifetime);
            this.fitness *= 25 * t;
        }

        // If they crashed, their fitness is severely reduced
        if (this.crashed) {
            this.fitness /= 50;
        }
    }

    isMouseOver() {
        let d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
        return d < 15; // Returns true if mouse is within 15 pixels
    }
}