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

// add the camera to the scene
scene.add(camera);

// the camera starts at 0,0,0
// so pull it back
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 200;
camera.lookAt(new THREE.Vector3(0,0,0));

// start the renderer
renderer.setSize(WIDTH, HEIGHT);

var boxMaterial = new THREE.MeshLambertMaterial({
  color: 0xCC0000
});

var box = new THREE.Mesh(
  new THREE.CubeGeometry(50, 50, 50),
  boxMaterial
);

// add the box to the scene
scene.add(box);

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
function createBoid() {
  var boid = new Boid(
    new THREE.Mesh(new THREE.CubeGeometry(5, 5, 5), boxMaterial),
    flock);
  boid.position.set(Math.random() * 200 - 100
                  , Math.random() * 200 - 100
                  , Math.random() * 200 - 100)
  flock.push(boid);
  scene.add(boid.mesh);
}

for (var i = 0; i < 40; i++) {
  createBoid();
}


var previousFrame, frame, controller;

controller = new Leap.Controller();

function render() {
  frame = controller.frame();
  renderer.render(scene, camera);
  for (var i = 0, length = flock.length; i < length; i++) {
    flock[i].tick();
  }
  previousFrame = frame;
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

(function animloop(){
  requestAnimFrame(animloop);
  render();
})();
