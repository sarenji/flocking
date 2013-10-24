;(function() {

this.Boid = (function() {
  function Boid(mesh, flock, options) {
    if (!options) {
      options = {};
    }
    this.mesh = mesh;
    this.flock = flock;
    this.position = this.mesh.position;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = new THREE.Vector3(0, 0, 0);
    this.sightRadius = options.sightRadius || 50;
    this.turnSpeed = options.turnSpeed || 50;
    this.weight = options.weight || Math.random();
  }

  Boid.prototype.iterateNeighbors = function(func) {
    var i, length, neighbor;
    for (i = 0, length = this.flock.length; i < length; i++) {
      neighbor = this.flock[i];
      if (neighbor === this ||
          neighbor.position.distanceTo(this.position) > this.sightRadius) {
        continue;
      }
      func.call(this, neighbor);
    }
  };

  // 1. Collision avoidance (separation)
  // 2. Velocity matching (alignment)
  // 3. Flock centering (cohesion)
  Boid.prototype.tick = function(dt) {
    var length = this.flock.length
      , separationVector = new THREE.Vector3(0, 0, 0)
      , alignmentVector = new THREE.Vector3(0, 0, 0)
      , cohesionVector = new THREE.Vector3(0, 0, 0)
      , tempVector = new THREE.Vector3()
      , steerVector = new THREE.Vector3()
      , i, distance;

    // 1. Separation
    // Get the inverse square distance between all flockmates, sum them, and
    // normalize the result. An inverse cube distance can also be used.
    this.iterateNeighbors(function(neighbor) {
      tempVector.copy(this.position);
      tempVector.sub(neighbor.position);
      distance = neighbor.position.distanceToSquared(this.position);
      tempVector.multiplyScalar(1 / distance);
      separationVector.add(tempVector);
    });
    separationVector.normalize();

    // 2. Alignment
    // We simply sum up all neighbor heading vectors and normalize the result.
    this.iterateNeighbors(function(neighbor) {
      alignmentVector.add(neighbor.heading);
    });
    alignmentVector.normalize();

    // 3. Cohesion
    // We average all neighbor position vectors, subtract from the boid's
    // position, then normalize the result to get the direction toward the
    // center of the flock.
    this.iterateNeighbors(function(neighbor) {
      cohesionVector.add(neighbor.position);
    });
    cohesionVector.divideScalar(length);
    cohesionVector.sub(this.position);
    cohesionVector.normalize();

    // Add them all together to get a steering vector.
    steerVector.copy(separationVector);
    steerVector.add(alignmentVector);
    steerVector.add(cohesionVector);
    steerVector.normalize();

    // Apply steering vector to the heading.
    steerVector.multiplyScalar(this.weight);
    this.heading.add(steerVector);
    this.heading.normalize();
    this.position.add(this.heading);
  };

  return Boid;
}).call(this);

}).call(this);
