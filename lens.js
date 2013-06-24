var app = app;
var THREE = THREE;

app.lens = {
  viewports:[
    {
      bounds:new THREE.Box2(new THREE.Vector2(0,0), new THREE.Vector2(200,150)),
      aspect:0,
      viewAngle:45,
      near:0.1,
      far:10000,
      clear:0x6699cc,
    },
    {
      bounds:new THREE.Box2(new THREE.Vector2(200,0), new THREE.Vector2(300,150)),
      aspect:0,
      viewAngle:45,
      near:0.1,
      far:10000,
      clear:0x6699cc,
    }
  ],
  setCamToPort:function(cam, port){
    var viewport = this.viewports[port];
    viewport.aspect = viewport.bounds.size().x/viewport.bounds.size().y;
    cam.viewAngle = viewport.viewAngle;
    cam.aspect = viewport.aspect;
    cam.near = viewport.near;
    cam.far = viewport.far;
    cam.updateProjectionMatrix();
  },
  setRendererToPort:function(renderer, port){
    var viewport = this.viewports[port];
    renderer.setViewport(viewport.bounds.min.x,viewport.bounds.min.y,viewport.bounds.size().x,viewport.bounds.size().y);
    renderer.setScissor(viewport.bounds.min.x,viewport.bounds.min.y,viewport.bounds.size().x,viewport.bounds.size().y);
    renderer.enableScissorTest(true);
    renderer.setClearColor(viewport.clear,1);
  },
  setRendererSizeToAllPorts:function(renderer){
    var union = new THREE.Box2();
    for(var v in this.viewports)
    {
      union = union.union(this.viewports[v].bounds);
    }
    renderer.setSize(union.size().x,union.size().y);
  }
};