var THREE = THREE;
var app = app || {VERSION:0.1};

function extend(destination, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      destination[k] = source[k];
    }
  }
  return destination; 
}
function onDocumentReady(){
  Math.TAU = Math.PI*2;
  $.getScript('./moduleLoader.js').done(onModuleLoaderReady);  
}
function onModuleLoaderReady(){
  app.moduleLoader.loadModule('default', run);
}
function run(){
  //This needs to go, really
  app.globals.init();
  
  var geom = new THREE.SphereGeometry(0.5,8,4);
  app.globals.mat = new THREE.MeshLambertMaterial();
  app.globals.sphereMat = new THREE.LineBasicMaterial();
  app.globals.sphereMat.wireframe = true;
  //app.globals.sphereMat.visible = false;
  app.globals.sphereMat.transparent = true;
  app.globals.sphereMat.opacity = 0.5;
  var pointLight = new THREE.DirectionalLight(0xffffff);
  //var ambLight = new THREE.AmbientLight(0x001122);
  var ambLight = new THREE.AmbientLight(0x222222);
  app.globals.world = new app.worlds.world({x:3,y:3,z:3});
  
  // set its position
  pointLight.position.x = 50;
  pointLight.position.y = 50;
  pointLight.position.z = 50;
  
  app.globals.cameraRig.position = (new THREE.Vector3(0,3,10));
  
  for(i in app.globals.world.coords)
  {
    var wi = app.globals.world.coords[i];
    if(app.globals.world.nodes[wi.x][wi.y][wi.z].data.solid === true){
      var sphere = new THREE.Mesh(geom, app.globals.sphereMat);
      sphere.position = app.globals.world.coordsToPosition(new THREE.Vector3(wi.x,wi.y,wi.z));
      app.globals.world.nodes[wi.x][wi.y][wi.z].ball = sphere;
      //sphere.material.color.setHex(app.globals.world.nodes[wi.x][wi.y][wi.z].data.colour.getHex());
      //sphere.material.ambient.setHex(app.globals.world.nodes[wi.x][wi.y][wi.z].data.colour.getHex());
      app.globals.scene.add(sphere);
    }
  }
  for(var i in app.globals.world.cells){
    var cell = app.globals.world.cells[i];
    var cellGeom;
    {
      cellGeom = app.cellMeshes.selectMesh(cell);
      cell.mesh = new THREE.Mesh(cellGeom, app.globals.mat);
      cell.mesh.position = app.globals.world.coordsToPosition(new THREE.Vector3(cell.root.x,cell.root.y,cell.root.z));
      app.globals.scene.add(cell.mesh);
    }
  }
  
  var lines = new THREE.Line(new THREE.Geometry(), new THREE.LineBasicMaterial({vertexColors:true}), THREE.LinePieces);
  lines.geometry.vertices.push(new THREE.Vector3(0,0,0));
  lines.geometry.vertices.push(app.globals.world.coordsToPosition(new THREE.Vector3(2,0,0)));
  lines.geometry.vertices.push(new THREE.Vector3(0,0,0));
  lines.geometry.vertices.push(app.globals.world.coordsToPosition(new THREE.Vector3(0,2,0)));
  lines.geometry.vertices.push(new THREE.Vector3(0,0,0));
  lines.geometry.vertices.push(app.globals.world.coordsToPosition(new THREE.Vector3(0,0,2)));
  lines.geometry.colors.push(new THREE.Color(0xff0000));
  lines.geometry.colors.push(new THREE.Color(0xff0000));
  lines.geometry.colors.push(new THREE.Color(0x00ff00));
  lines.geometry.colors.push(new THREE.Color(0x00ff00));
  lines.geometry.colors.push(new THREE.Color(0x0000ff));
  lines.geometry.colors.push(new THREE.Color(0x0000ff));
  lines.translateY(-1);
  
  app.globals.scene.add(lines);
  
  app.globals.scene.add(pointLight);
  app.globals.scene.add(ambLight);
  
  $("#container").click(sceneClick);
  
  $('body').keydown(app.input.onKeyDown).keyup(app.input.onKeyUp); 
  
  app.input.keys.left.down = function(){app.input.keys.left.state = 1; refreshAxes();};
  app.input.keys.right.down = function(){app.input.keys.right.state = 1; refreshAxes();};
  app.input.keys.up.down = function(){app.input.keys.up.state = 1; refreshAxes();};
  app.input.keys.down.down = function(){app.input.keys.down.state = 1; refreshAxes();};
  app.input.keys.w.down = function(){app.input.keys.w.state = 1; refreshAxes();};
  app.input.keys.a.down = function(){app.input.keys.a.state = 1; refreshAxes();};
  app.input.keys.s.down = function(){app.input.keys.s.state = 1; refreshAxes();};
  app.input.keys.d.down = function(){app.input.keys.d.state = 1; refreshAxes();};
  app.input.keys.e.down = function(){app.input.keys.e.state = 1; refreshAxes();};
  app.input.keys.q.down = function(){app.input.keys.q.state = 1; refreshAxes();};
  
  app.input.keys.left.up = function(){app.input.keys.left.state = 0; refreshAxes();};
  app.input.keys.right.up = function(){app.input.keys.right.state = 0; refreshAxes();};
  app.input.keys.up.up = function(){app.input.keys.up.state = 0; refreshAxes();};
  app.input.keys.down.up = function(){app.input.keys.down.state = 0; refreshAxes();};
  app.input.keys.w.up = function(){app.input.keys.w.state = 0; refreshAxes();};
  app.input.keys.a.up = function(){app.input.keys.a.state = 0; refreshAxes();};
  app.input.keys.s.up = function(){app.input.keys.s.state = 0; refreshAxes();};
  app.input.keys.d.up = function(){app.input.keys.d.state = 0; refreshAxes();};
  app.input.keys.e.up = function(){app.input.keys.e.state = 0; refreshAxes();};
  app.input.keys.q.up = function(){app.input.keys.q.state = 0; refreshAxes();};
  
  
  window.requestAnimationFrame(draw);
}
function sceneClick(event)
{
  var bounds = app.lens.viewports[0].bounds;
  var mouseX = (((event.clientX - bounds.min.x) / bounds.size().x) * 2) - 1;
  var mouseY = (((event.clientY - bounds.min.y) / bounds.size().y) * -2) + 1;
  var ray = app.globals.projector.pickingRay(new THREE.Vector3(mouseX, mouseY, 0), app.globals.camera);
  var objects = {o:[],balls:[]};
  for(var x in app.globals.world.nodes){
    for(var y in app.globals.world.nodes[x]){
      for(var z in app.globals.world.nodes[x][y]){
        objects.o.push(app.globals.world.nodes[x][y][z]);
        objects.balls.push(app.globals.world.nodes[x][y][z].ball);
      }
    }
  }
  var intersects = ray.intersectObjects(objects.balls);
  if(intersects[0])
  {
    var hit = objects.o[objects.balls.indexOf(intersects[0].object)];
    hit.data.solid = !hit.data.solid;
    if(hit.data.solid === false)
    {
      //app.globals.scene.remove(hit.ball);
      //delete hit.ball;
    }
    //hit.ball.material.color.setHex(hit.data.solid?hit.data.colour.getHex():0x000000);
    hit.refreshCells();
  }
}
function refreshAxes(){
  app.input.axes.X1 = app.input.keys.d.state - app.input.keys.a.state;
  app.input.axes.Y1 = app.input.keys.w.state - app.input.keys.s.state;
  app.input.axes.X2 = app.input.keys.right.state - app.input.keys.left.state;
  app.input.axes.Y2 = app.input.keys.up.state - app.input.keys.down.state;
  app.input.axes.Z1 = app.input.keys.e.state - app.input.keys.q.state;
}
function matrixUp(mat){
  return new THREE.Vector3(0,1,0).applyMatrix3(mat);
}
function draw(){
  $('#output').text("");
  var camMat = new THREE.Matrix4().getInverse(app.globals.camera.matrix.clone().transpose());
  app.globals.cameraRig.translateOnAxis(new THREE.Vector3(0,0,1).applyMatrix4(camMat),(-app.input.axes.Y1*0.1));
  app.globals.cameraRig.translateOnAxis(new THREE.Vector3(1,0,0).applyMatrix4(camMat),(app.input.axes.X1*0.1));
  app.globals.cameraRig.translateOnAxis(new THREE.Vector3(0,1,0), app.input.axes.Z1 * 0.1);
  app.globals.cameraRig.rotateOnAxis(new THREE.Vector3(0,1,0), -app.input.axes.X2*0.02); //object space
  app.globals.camera.rotateOnAxis(new THREE.Vector3(1,0,0), app.input.axes.Y2*0.01);
  for(var i in app.monitor.trace)
  {
    var str = (app.monitor.trace[i]());
    $('#output').append("<div>"+str+"</div>");
  }
  for(var v in app.lens.viewports)
  {
    app.lens.setRendererToPort(app.globals.renderer,v);
    app.lens.setCamToPort(app.globals.camera,v);
    app.globals.renderer.render(app.globals.scene,app.globals.camera);
  }
	window.requestAnimationFrame(draw);
}
$(document).ready(onDocumentReady);