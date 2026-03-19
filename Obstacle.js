class Obstacle {
    constructor(x, y, w, h) {
      this.pos = createVector(x, y); // Position of the obstacle
      this.w = w; // Width of the obstacle
      this.h = h; // Height of the obstacle
    }
  
    show() {
      push();
      // Soft wall with subtle highlight
      noStroke();
      fill(60, 74, 110, 235);
      rect(this.pos.x, this.pos.y, this.w, this.h, 10);

      // Inner highlight edge
      stroke(255, 255, 255, 40);
      noFill();
      rect(this.pos.x + 1, this.pos.y + 1, this.w - 2, this.h - 2, 9);

      // Outer shadow edge
      stroke(0, 0, 0, 90);
      noFill();
      rect(this.pos.x, this.pos.y, this.w, this.h, 10);
      pop();
    }
  
    contains(px, py) {
      return (px > this.pos.x && px < this.pos.x + this.w &&
              py > this.pos.y && py < this.pos.y + this.h);
    }
}