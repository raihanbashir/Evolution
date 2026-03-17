class DNA {
    constructor(length) {
        this.genes = [];
        // Initialize with random values between 0 and 1 using p5.Vector.random2D()
        for (let i = 0; i < length; i++) {
            this.genes[i] = p5.Vector.random2D();
            // Set the magnitude of the gene to 0.2
            this.genes[i].setMag(0.2);
        }
    }
  
    // Combine two parents to create a child
    crossover(partner) {
        let childDNA = new DNA(this.genes.length);
        // Choose a random midpoint to crossover
        let midpoint = floor(random(this.genes.length));
        // If the gene is after the midpoint, inherit from the first parent
        for (let i = 0; i < this.genes.length; i++) {
            if (i > midpoint) childDNA.genes[i] = this.genes[i];
            // If the gene is before the midpoint, inherit from the second parent
            else childDNA.genes[i] = partner.genes[i];
        }
        // Return the child DNA
        return childDNA;
    }
  
    // Randomly nudge genes to allow for "evolution"
    mutate(rate) {
        for (let i = 0; i < this.genes.length; i++) {
            // If the random number is less than the mutation rate, mutate the gene
            if (random(1) < rate) {
                this.genes[i] = random(0, 1);
            }
        }
    }
}