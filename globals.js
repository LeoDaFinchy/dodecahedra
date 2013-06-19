var THREE = THREE;
var app = app;

app.globals = {
  width:200,
  height:150,
  aspect:0,
  viewAngle:45,
  near:0.1,
  far:10000,
  camera:null,
  cameraRig:new THREE.Object3D(),
  scene:new THREE.Scene(),
  projector:new THREE.Projector(),
  $container:$('#container'),
  renderer:new THREE.WebGLRenderer(),
  init:function(){
    this.aspect = this.width/this.height;
    
    this.camera = new THREE.PerspectiveCamera(
      this.viewAngle,
      this.aspect,
      this.near,
      this.far
    );
    
    this.scene.add(this.camera);
    this.scene.add(this.cameraRig);
    this.cameraRig.add(this.camera);
    
    this.renderer.setSize(this.width, this.height);
    $('#container').append(this.renderer.domElement);
    
    this.trace.push(function(){return tabulateMatrix(app.globals.camera.matrixWorld);});
    this.trace.push(function(){return "X1:"+app.globals.axes.X1;});
    this.trace.push(function(){return "Y1:"+app.globals.axes.Y1;});
    this.trace.push(function(){return "X2:"+app.globals.axes.X2;});
    this.trace.push(function(){return "Y2:"+app.globals.axes.Y2;});
    this.trace.push(function(){return "Z1:"+app.globals.axes.Z1;});
  },
  trace:[]
};