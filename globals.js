var THREE = THREE;
var app = app;

app.globals = {
  camera:new THREE.PerspectiveCamera(),
  cameraRig:new THREE.Object3D(),
  scene:new THREE.Scene(),
  projector:new THREE.Projector(),
  $container:$('#container'),
  renderer:new THREE.WebGLRenderer(),
  init:function(){
    
    this.scene.add(this.camera);
    this.scene.add(this.cameraRig);
    this.cameraRig.add(this.camera);
    
    app.lens.setRendererSizeToAllPorts(this.renderer);
    
    $('#container').append(this.renderer.domElement);
  }
};