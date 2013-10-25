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
    this.heading = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    this.heading.normalize();
    this.up = this.mesh.up;
    this.up.x = Math.random();
    this.up.y = Math.random();
    this.up.z = Math.random();
    this.up.normalize();
    this.sightRadius = options.sightRadius || 50;
    this.turnSpeed = options.turnSpeed || 50;
    this.maxTurnAngle = options.maxTurnAngle || 30;
    this.weight = options.weight || Math.random() / 2 + .5;
    this.callbacks = [];
    this.addBehavior(this._flock);
  }

  Boid.prototype.lookAt = function() {
    this.mesh.lookAt.apply(this.mesh, arguments);
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
    var i, length = this.callbacks.length, heading;
    for (i = 0; i < length; i++) {
      this.callbacks[i].call(this);
    }
    // Finally, add the heading to the position.
    heading = new THREE.Vector3();
    heading.copy(this.heading);
    heading.multiplyScalar(this.weight);
    this.position.add(heading);
  };

  Boid.prototype.addBehavior = function(func) {
    this.callbacks.push(func);
  };

  Boid.prototype._flock = function() {
    var separationVector = new THREE.Vector3(0, 0, 0)
      , alignmentVector = new THREE.Vector3(0, 0, 0)
      , cohesionVector = new THREE.Vector3()
      , tempVector = new THREE.Vector3()
      , steerVector = new THREE.Vector3()
      , i, distance, cohesionLength;

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
    cohesionVector.copy(this.position);
    cohesionLength = 1;
    this.iterateNeighbors(function(neighbor) {
      cohesionVector.add(neighbor.position);
      cohesionLength++;
    });
    cohesionVector.divideScalar(cohesionLength);
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
  };

  return Boid;
}).call(this);

}).call(this);
