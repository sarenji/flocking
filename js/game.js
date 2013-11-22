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

// the camera starts at 0,0,0
// so pull it back
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 200;
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
  color: 0x33FF00,
  transparent: true,
  opacity: 0.5
});

var highlightSphere = new THREE.Mesh(new THREE.SphereGeometry(5)
                                   , highlightMaterial);

var pointLight = new THREE.PointLight(0xFFFFFF);

// set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 130;

// add to the scene
scene.add(pointLight);

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
      , steerVector = new THREE.Vector3();
    steerVector.copy(boid.position);
    distance = 200 - boid.position.length();
    steerVector.crossVectors(boid.position, boid.up);
    steerVector.multiplyScalar(1 / (distance * distance));
    this.heading.add(steerVector);
    this.heading.normalize();
  });

  boid.addBehavior(function() {
    this.lookAt(new THREE.Vector3(0, 0, 0));
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


var previousFrame, frame, controller;

controller = new Leap.Controller();

function render(dt) {
  frame = controller.frame();
  controls.update(dt);
  renderer.render(scene, camera);
  for (var i = 0, length = flock.length; i < length; i++) {
    flock[i].tick(dt);
  }
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
