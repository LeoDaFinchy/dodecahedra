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
  
  var geom = new THREE.SphereGeometry(0.1,8,4);
  app.globals.mat = new THREE.MeshLambertMaterial();
  var pointLight = new THREE.DirectionalLight(0xffffff);
  var ambLight = new THREE.AmbientLight(0x001122);
  app.globals.world = new app.worlds.world({x:2,y:2,z:2});
  
  // set its position
  pointLight.position.x = 50;
  pointLight.position.y = 50;
  pointLight.position.z = 50;
  
  app.globals.cameraRig.position = (new THREE.Vector3(0,2,10));
  
  for(i in app.globals.world.coords)
  {
    var wi = app.globals.world.coords[i];
    var sphere = new THREE.Mesh(geom, app.globals.mat);
    sphere.position = app.globals.world.coordsToPosition(new THREE.Vector3(wi.x,wi.y,wi.z));
    app.globals.world.nodes[wi.x][wi.y][wi.z].ball = sphere;
    sphere.material.color.setHex(0xffff00);
    app.globals.scene.add(sphere);
  }
  for(var i in app.globals.world.cells){
    var cell = app.globals.world.cells[i];
    var cellGeom;
    if(cell.profile == cell.profiles.down) //testing - for real, remove the if around this block
    {
      cellGeom = app.cellMeshes.selectMesh(cell);
      cell.mesh = new THREE.Mesh(cellGeom, app.globals.mat);
      cell.mesh.position = app.globals.world.coordsToPosition(new THREE.Vector3(cell.root.x,cell.root.y,cell.root.z));
      app.globals.scene.add(cell.mesh);
    }
  }
  app.globals.scene.add(pointLight);
  app.globals.scene.add(ambLight);
  
  app.monitor.trace.push(function(){return "X1:"+app.input.axes.X1;});
  app.monitor.trace.push(function(){return "Y1:"+app.input.axes.Y1;});
  app.monitor.trace.push(function(){return "X2:"+app.input.axes.X2;});
  app.monitor.trace.push(function(){return "Y2:"+app.input.axes.Y2;});
  app.monitor.trace.push(function(){return "Z1:"+app.input.axes.Z1;});
  app.monitor.trace.push(function(){return app.monitor.tabulateMatrix(app.globals.camera.matrixWorld);});
  
  $("#toggleUp").click(hideUpCells);
  $("#toggleDown").click(hideDownCells);
  $("#toggleInner").click(hideInnerCells);
  $("#toggleSolid").click(toggleSolid).toggleClass("lit");
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
function sceneClick(event){
  
}
function toggleSolid(event){
  app.globals.world.nodes[0][0][0].data.solid = !app.globals.world.nodes[0][0][0].data.solid;
  app.globals.world.nodes[0][0][0].refreshCells();
}
function hideUpCells(event){
  for(var i in app.globals.world.cells)
  {
    if(app.globals.world.cells[i].profile == app.worlds.cell.prototype.profiles.up){app.globals.scene.remove(app.globals.world.cells[i].mesh);}
  }
  $('#toggleUp').click(showUpCells).removeClass("lit");
}
function showUpCells(event){
  for(var i in app.globals.world.cells)
  {
    if(app.globals.world.cells[i].profile == app.worlds.cell.prototype.profiles.up){app.globals.scene.add(app.globals.world.cells[i].mesh);}
  }
  $('#toggleUp').click(hideUpCells).addClass("lit");
}

function hideDownCells(event){
  for(var i in app.globals.world.cells)
  {
    if(app.globals.world.cells[i].profile == app.worlds.cell.prototype.profiles.down){app.globals.scene.remove(app.globals.world.cells[i].mesh);}
  }
  $('#toggleDown').click(showDownCells).removeClass("lit");
}
function showDownCells(event){
  for(var i in app.globals.world.cells)
  {
    if(app.globals.world.cells[i].profile == app.worlds.cell.prototype.profiles.down){app.globals.scene.add(app.globals.world.cells[i].mesh);}
  }
  $('#toggleDown').click(hideDownCells).addClass("lit");
}

function hideInnerCells(event){
  for(var i in app.globals.world.cells)
  {
    if(app.globals.world.cells[i].profile == app.worlds.cell.prototype.profiles.inner){app.globals.scene.remove(app.globals.world.cells[i].mesh);}
  }
  $('#toggleInner').click(showInnerCells).removeClass("lit");
}
function showInnerCells(event){
  for(var i in app.globals.world.cells)
  {
    if(app.globals.world.cells[i].profile == app.worlds.cell.prototype.profiles.inner){app.globals.scene.add(app.globals.world.cells[i].mesh);}
  }
  $('#toggleInner').click(hideInnerCells).addClass("lit");
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