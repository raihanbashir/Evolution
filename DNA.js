class DNA {
    constructor(length) {
      this.genes = [];
      // Initialize with random values between 0 and 1
      for (let i = 0; i < length; i++) {
        this.genes[i] = random(0, 1);
      }
    }
  
    // Combine two parents to create a child
    crossover(partner) {
      let childDNA = new DNA(this.genes.length);
      let midpoint = floor(random(this.genes.length));
      
      for (let i = 0; i < this.genes.length; i++) {
        if (i > midpoint) childDNA.genes[i] = this.genes[i];
        else childDNA.genes[i] = partner.genes[i];
      }
      return childDNA;
    }
  
    // Randomly nudge genes to allow for "evolution"
    mutate(rate) {
      for (let i = 0; i < this.genes.length; i++) {
        if (random(1) < rate) {
          this.genes[i] = random(0, 1);
        }
      }
    }
  }