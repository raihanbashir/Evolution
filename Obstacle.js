class Obstacle {
    constructor(x, y, w, h) {
      this.pos = createVector(x, y); // Position of the obstacle
      this.w = w; // Width of the obstacle
      this.h = h; // Height of the obstacle
    }
  
    show() {
      fill(150, 50, 50); // Reddish-brown for walls
      noStroke();
      rect(this.pos.x, this.pos.y, this.w, this.h);
    }
  
    contains(px, py) {
      return (px > this.pos.x && px < this.pos.x + this.w &&
              py > this.pos.y && py < this.pos.y + this.h);
    }
}