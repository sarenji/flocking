var $window = $(window),
    WIDTH   = $window.width(),
    HEIGHT  = $window.height();

// set some camera attributes
var VIEW_ANGLE = 45,
  ASPECT = WIDTH / HEIGHT,
  NEAR = 0.1,
  FAR = 10000;

// get the DOM element to attach to
var $container = $("#container");

// create a WebGL renderer, camera
// and a scene
var renderer = new THREE.WebGLRenderer();
var camera =
  new THREE.PerspectiveCamera(
    VIEW_ANGLE,
    ASPECT,
    NEAR,
    FAR);

var scene = new THREE.Scene();
scene.fog = new THREE.FogExp2( 0x418a93, 0.0004 );

// Debugging
var axes = new THREE.AxisHelper(1000);
scene.add(axes);

// the camera starts at 0,0,0
// so pull it back
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 2000;
camera.lookAt(new THREE.Vector3(0,0,0));

// var controls = new THREE.PointerLockControls(camera);
var controls = new THREE.TrackballControls(camera);
scene.add(camera);

// start the renderer
renderer.setSize(WIDTH, HEIGHT);

var boidMaterial = new THREE.MeshLambertMaterial({
  color: 0xCC0000
});

var highlightMaterial = new THREE.MeshLambertMaterial({
  color: 0xff0000
});

var highlightSphere = new THREE.Mesh(new THREE.SphereGeometry(50)
                                   , highlightMaterial);
scene.add(highlightSphere);

// Add point lighting
var pointLight = new THREE.PointLight(0xAABECF);
pointLight.position.x = 10;
pointLight.position.y = 2000;
pointLight.position.z = 630;
scene.add(pointLight);

// Add ambient lighting
var ambient = new THREE.AmbientLight(0x444654);
scene.add(ambient);

// attach the render-supplied DOM element
$container.append(renderer.domElement);

// Start adding boids
var flock = [];
function createBoid(mesh) {
  var boid = new Boid(mesh, flock);
  boid.position.set(Math.random() * 1000 - 500
                  , Math.random() * 1000 - 500
                  , Math.random() * 1000 - 500)
  // Avoid going past a certain bound.
  boid.addBehavior(function() {
    var distance
      , positionVector = new THREE.Vector3()
      , steerVector = new THREE.Vector3();
    steerVector.copy(boid.position);
    distance = 1000 - boid.position.length();
    steerVector.crossVectors(boid.position, boid.up);
    steerVector.multiplyScalar(1 / (distance * distance));

    // If the distance is less than zero, then we're past the bounds.
    // Add a vector toward the middle of the ball.
    if (distance < 0) {
      positionVector.copy(boid.position);
      positionVector.negate().normalize();
      steerVector.add(positionVector);
    }

    this.heading.add(steerVector);
    this.heading.normalize();
  });

  boid.addBehavior(function() {
    if (this.repel) {
      this.heading.add(this.repel).normalize();
      this.repel = null;
    }
  });

  flock.push(boid);
  scene.add(boid.mesh);
}

$(document).on('geometryLoaded', function(e, geometry) {
  for (var i = 0; i < 25; i++) {
    createBoid(new THREE.Mesh(geometry.clone(),
                              new THREE.MeshLambertMaterial(0x00FF00)));
  }
});


var previousFrame, controller;

controller = new Leap.Controller({ enableGestures: true });
controller.connect();

function render(dt) {
  controls.update(dt);
  renderer.render(scene, camera);
  for (var i = 0, length = flock.length; i < length; i++) {
    flock[i].tick(dt);
  }
  handleLeap(dt);
}

function handleLeap(dt) {
  var frame, gesture;
  var boid, boidRelPos, repelForce, handDirection, handPosition, distance;
  frame = controller.frame();

  // Discard invalid frames.
  if (!frame.valid) {
    return;
  }

  // Render sphere as a hand
  for (var i = 0, length = frame.hands.length; i < length; i++) {
    var hand = frame.hands[i];
    highlightSphere.position.x = 2000 * hand.palmPosition[0] / frame.interactionBox.size[0];
    highlightSphere.position.y = 2000 * hand.palmPosition[1] / frame.interactionBox.size[1] - 1000;
    highlightSphere.position.z = 2000 * hand.palmPosition[2] / frame.interactionBox.size[2];

    handPosition = highlightSphere.position;
    handDirection = hand.direction;
    handDirection = new THREE.Vector3(handDirection[0], handDirection[1], handDirection[2]);
    for (var j = 0; j < flock.length; j++) {
      boid = flock[j];

      // Get the boid's relative position from the hand.
      boidRelPos = new THREE.Vector3().subVectors(boid.position, handPosition);

      // Get the repel force. It is perpendicular to the direction of the hand.
      repelForce = new THREE.Vector3().copy(handDirection);
      repelForce.multiplyScalar(handDirection.dot(boidRelPos));
      repelForce.subVectors(boidRelPos, repelForce);

      // The magnitude of the repel force is dependent on distance.
      distance = boidRelPos.length();
      distance = (distance * distance);
      repelForce.normalize();
      // repelForce.multiplyScalar(Math.min(2 * boid.weight, 500 / distance));
      repelForce.multiplyScalar(50000 / distance);

      // If we're attracting rather than repelling, then negate the vector.
      if (!repel) {
        repelForce.negate();
      }

      // Store repel data as a property on the boid.
      boid.repel = repelForce;
    }
  }

  // Record previous frame.
  previousFrame = frame;
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function(callback) {
            window.setTimeout(callback, 1000 / 60);
          };
})();

(function animloop(dt){
  requestAnimFrame(animloop);
  render(dt);
})();


// Load fish
var loader = new THREE.JSONLoader();
loader.load("js/models/fish_a.js", fishLoaded);
loader.load("js/models/fish_b.js", fishLoaded);
loader.load("js/models/fish_c.js", fishLoaded);
loader.load("js/models/fish_d.js", fishLoaded);

function fishLoaded(geometry) {
  $(document).trigger('geometryLoaded', geometry);
}

var repel = true;
$(document).on('keypress', function(e) {
  switch (e.which) {
    case 116: // [t]
      if (repel) {
        repel = false;
        highlightSphere.material.color.setHex(0x00ff00);
      } else {
        repel = true;
        highlightSphere.material.color.setHex(0xff0000);
      }
      break;
  }
});
