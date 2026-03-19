class DNA {
    constructor(genes) {
      if (genes) {
        this.genes = genes;
      } else {
        this.genes = [];
        this.genes[0] = random(0.1, 2.0); // Target Attraction Weight
        this.genes[1] = random(0.1, 5.0); // Obstacle Avoidance Weight
        this.genes[2] = random(2, 6); // Speed Preference
      }
    }
    
    // Crossover now only swaps 3 values
    crossover(partner) {
      let newGenes = [];
      let mid = floor(random(this.genes.length));
      for (let i = 0; i < this.genes.length; i++) {
        newGenes[i] = i > mid ? this.genes[i] : partner.genes[i];
      }
      return new DNA(newGenes);
    }
  
    mutate(rate) {
        for (let i = 0; i < this.genes.length; i++) {
            if (random(1) < rate) {
                if (i === 0) this.genes[i] = random(0.1, 2.0); // Target
                if (i === 1) this.genes[i] = random(0.1, 5.0); // Avoid
                if (i === 2) this.genes[i] = random(2, 6);     // Speed
            }
        }
    }
}