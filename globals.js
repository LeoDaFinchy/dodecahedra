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
  keys:{
    left:{code:37,state:0},
    up:{code:38,state:0},
    right:{code:39,state:0},
    down:{code:40,state:0},
    w:{code:87,state:0},
    a:{code:65,state:0},
    s:{code:83,state:0},
    d:{code:68,state:0},
    e:{code:69,state:0},
    q:{code:81,state:0},
  },
  axes:{
    X1:0,
    X2:0,
    Y1:0,
    Y2:0,
    Z1:0
  },
  trace:[]
};