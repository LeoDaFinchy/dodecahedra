
var THREE = THREE;
//var globals = globals;
var app = app || {VERSION:0.1};

var world = {
  nodes:[],
  dimensions:null,
  coords:[],
  cells:[],
  matrix:new THREE.Matrix4(),
  createNew:function(dimensions){
    this.nodes = [];
    this.coords = [];
    this.dimensions = dimensions;
    for(var x = 0; x < dimensions.x; x++)
    {
      var long = [];
      for(var y = 0; y < dimensions.y; y++)
      {
        var lat = [];
        for(var z = 0; z < dimensions.z; z++)
        {
          var alt = node();
          lat.push(alt);
          alt.coords = {x:x,y:y,z:z};
          this.coords.push({x:x,y:y,z:z});
          if(cells.downCellProfile.validateRootCoordinate({x:x,y:y,z:z},
                                                          {x:this.dimensions.x,y:this.dimensions.y,z:this.dimensions.z}))
          {
            var downCell = cell();
            downCell.root = {x:x,y:y,z:z};
            downCell.profile = cells.profiles.down;
            this.cells.push(downCell);
          }
          if(cells.upCellProfile.validateRootCoordinate({x:x,y:y,z:z},
                                                          {x:this.dimensions.x,y:this.dimensions.y,z:this.dimensions.z}))
          {
            var upCell = cell();
            upCell.root = {x:x,y:y,z:z};
            upCell.profile = cells.profiles.up;
            this.cells.push(upCell);
          }
          if(cells.innerCellProfile.validateRootCoordinate({x:x,y:y,z:z},
                                                          {x:this.dimensions.x,y:this.dimensions.y,z:this.dimensions.z}))
          {
            var innerCell = cell();
            innerCell.root = {x:x,y:y,z:z};
            innerCell.profile = cells.profiles.inner;
            this.cells.push(innerCell);
          }
        }
        long.push(lat);
      }
      this.nodes.push(long);
    }
    var skew30 = Math.tan(Math.TAU/12);
    var skew15 = Math.tan(Math.TAU/24);
    this.matrix = new THREE.Matrix4(
      skew30,-skew30,0,0,
      skew30,skew30,skew30,0,
      -skew15,-skew15,skew30,0,
      0,0,0,1);
  },
  coordsToPosition:function(coords)
  {
    return coords.clone().applyMatrix4(this.matrix);
  },
  adjacents:{
    12:{x:0,y:1,z:0},
    1:{x:1,y:0,z:-1},
    2:{x:1,y:-1,z:-1},
    3:{x:1,y:0,z:0},
    4:{x:0,y:1,z:1},
    5:{x:0,y:0,z:1},
    6:{x:0,y:-1,z:0},
    7:{x:-1,y:0,z:1},
    8:{x:-1,y:1,z:1},
    9:{x:-1,y:0,z:0},
    10:{x:0,y:-1,z:-1},
    11:{x:0,y:0,z:-1}
  }
};
function node(){
  return {
    solid:false,
    ball:null,
    coords:{x:0,y:0,z:0},
    adjacents:function()
    {
      var adjs = {};
      for(var i in world.adjacents)
      {
        var adj = world.adjacents[i];
        var adjx = this.coords.x+adj.x;
        var adjy = this.coords.y+adj.y;
        var adjz = this.coords.z+adj.z;
        if((0 <= adjx && adjx < world.dimensions.x) &&
           (0 <= adjy && adjy < world.dimensions.y) &&
           (0 <= adjz && adjz < world.dimensions.z))
        {
          adjs[i] = {x:this.coords.x+adj.x,y:this.coords.y+adj.y,z:this.coords.z+adj.z};
        }
      }
      return adjs;
    }
  };
}
var cells = {
  downCellProfile:{
    coords:[
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(0,1,0),
      new THREE.Vector3(0,0,1)
      ],
    validateRootCoordinate:function(root, bounds)
    {
      return (root.x < bounds.x - 1) && (root.x >= 0) &&
        (root.y < bounds.y - 1) && (root.y >= 0) &&
        (root.z < bounds.z - 1) && (root.z >= 0);
    }
  },
  upCellProfile:{
    coords:[
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(-1,0,0),
      new THREE.Vector3(0,-1,0),
      new THREE.Vector3(0,0,-1)
      ],
    validateRootCoordinate:function(root, bounds)
    {
      return (root.x < bounds.x) && (root.x >= 1) &&
        (root.y < bounds.y) && (root.y >= 1) &&
        (root.z < bounds.z) && (root.z >= 1);
    }
  },
  innerCellProfile:{
    coords:[
      new THREE.Vector3(0,0,0),
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(0,1,0),
      new THREE.Vector3(1,0,-1),
      new THREE.Vector3(0,1,-1),
      new THREE.Vector3(1,1,-1)
    ],
    validateRootCoordinate:function(root, bounds)
    {
      return (root.x < bounds.x - 1) && (root.x >= 0) &&
        (root.y < bounds.y - 1) && (root.y >= 0) &&
        (root.z < bounds.z) && (root.z >= 1);
    }
  },
  profiles:{
    down:0,
    up:1,
    inner:2,
  },
  meshes:{
    down:{
      0:{
        vertices:[
        ],
        faces:[
        ]
      },
      1:{
        vertices:[
          world.coordsToPosition(new THREE.Vector3(0,0,0)),
          world.coordsToPosition(new THREE.Vector3(0.5,0,0)),
          world.coordsToPosition(new THREE.Vector3(0,0.5,0)),
          world.coordsToPosition(new THREE.Vector3(0,0,0.5))
        ],
        faces:[
          new THREE.Face3(0,1,3),
          new THREE.Face3(0,2,1),
          new THREE.Face3(0,3,2),
          new THREE.Face3(3,1,2)
        ]
      },
      2:{
        vertices:[
          world.coordsToPosition(new THREE.Vector3(0.5,0,0)),
          world.coordsToPosition(new THREE.Vector3(1,0,0)),
          world.coordsToPosition(new THREE.Vector3(0.5,0.5,0)),
          world.coordsToPosition(new THREE.Vector3(0.5,0,0.5))
        ],
        faces:[
          new THREE.Face3(0,1,3),
          new THREE.Face3(0,2,1),
          new THREE.Face3(0,3,2),
          new THREE.Face3(3,1,2)
        ]
      },
      3:{
        vertices:[
          world.coordsToPosition(new THREE.Vector3(0,0,0)),
          world.coordsToPosition(new THREE.Vector3(1,0,0)),
        ],
        faces:[
        ]
      },
      4:{
        vertices:[
          world.coordsToPosition(new THREE.Vector3(0,0.5,0)),
          world.coordsToPosition(new THREE.Vector3(0.5,0.5,0)),
          world.coordsToPosition(new THREE.Vector3(0,1,0)),
          world.coordsToPosition(new THREE.Vector3(0,0.5,0.5))
        ],
        faces:[
          new THREE.Face3(0,1,3),
          new THREE.Face3(0,2,1),
          new THREE.Face3(0,3,2),
          new THREE.Face3(3,1,2)
        ]
      },
      5:{
        vertices:[
        ],
        faces:[
        ]
      },
      6:{
        vertices:[
        ],
        faces:[
        ]
      },
      7:{
        vertices:[
        ],
        faces:[
        ]
      },
      8:{
        vertices:[
          world.coordsToPosition(new THREE.Vector3(0,0,0.5)),
          world.coordsToPosition(new THREE.Vector3(0.5,0,0.5)),
          world.coordsToPosition(new THREE.Vector3(0,0.5,0.5)),
          world.coordsToPosition(new THREE.Vector3(0,0,1))
        ],
        faces:[
          new THREE.Face3(0,1,3),
          new THREE.Face3(0,2,1),
          new THREE.Face3(0,3,2),
          new THREE.Face3(3,1,2)
        ]
      },
      9:{
        vertices:[
        ],
        faces:[
        ]
      },
      10:{
        vertices:[
        ],
        faces:[
        ]
      },
      11:{
        vertices:[
        ],
        faces:[
        ]
      },
      12:{
        vertices:[
        ],
        faces:[
        ]
      },
      13:{
        vertices:[
        ],
        faces:[
        ]
      },
      14:{
        vertices:[
        ],
        faces:[
        ]
      },
      15:{
        vertices:[
        ],
        faces:[
        ]
      },
    },
    up:[
    ],
    inner:[
    ],
  }
};
function cell(){
  return {
    root:{x:0,y:0,z:0},
    mesh:null,
    profile:null
  };
}

function onDocumentReady(){
  var i;
  Math.TAU = Math.PI*2;
  $.getScript('./moduleLoader.js').done(onModuleLoaderReady);  
}
function onModuleLoaderReady(){
  app.moduleLoader.loadModule('input',globalsLoaded);
}
function globalsLoaded(){
  
  app.globals.init();
  var geom = new THREE.SphereGeometry(0.1,8,4);
  var mat = new THREE.MeshLambertMaterial();
  world.createNew({x:3,y:3,z:3});
  var pointLight = new THREE.DirectionalLight(0xffffff);
  var ambLight = new THREE.AmbientLight(0x001122);
  
	// set its position
	pointLight.position.x = 50;
	pointLight.position.y = 50;
    pointLight.position.z = 50;
  
  app.globals.cameraRig.position = (new THREE.Vector3(0,2,10));
  
  for(i in world.coords)
  {
    var wi = world.coords[i];
    var sphere = new THREE.Mesh(geom, mat.clone());
    sphere.position = world.coordsToPosition(new THREE.Vector3(wi.x,wi.y,wi.z));
    world.nodes[wi.x][wi.y][wi.z].ball = sphere;
    sphere.material.color.setHex(0xffff00);
    app.globals.scene.add(sphere);
  }
  world.nodes[1][1][1].ball.material.color.setHex(0xff0000);
  var adjs = world.nodes[1][1][1].adjacents();
  for(i in adjs)
  {
    world.nodes[adjs[i].x][adjs[i].y][adjs[i].z].ball.material.color.setHex(0x0000ff);
  }
  
  var downCellGeom = new THREE.Geometry();
  downCellGeom.vertices = [
    world.coordsToPosition(new THREE.Vector3(0,0,0)),
    world.coordsToPosition(new THREE.Vector3(1,0,0)),
    world.coordsToPosition(new THREE.Vector3(0,1,0)),
    world.coordsToPosition(new THREE.Vector3(0,0,1))
    ];
  downCellGeom.faces = [
    new THREE.Face3(0,1,3),
    new THREE.Face3(0,2,1),
    new THREE.Face3(0,3,2),
    new THREE.Face3(3,1,2)
    ];
  downCellGeom.computeFaceNormals();
  
  var upCellGeom = new THREE.Geometry();
  upCellGeom.vertices = [
    world.coordsToPosition(new THREE.Vector3(0,0,0)),
    world.coordsToPosition(new THREE.Vector3(-1,0,0)),
    world.coordsToPosition(new THREE.Vector3(0,-1,0)),
    world.coordsToPosition(new THREE.Vector3(0,0,-1))
    ];
  upCellGeom.faces = [
    new THREE.Face3(0,1,2),
    new THREE.Face3(0,2,3),
    new THREE.Face3(0,3,1),
    new THREE.Face3(3,2,1)
    ];
  upCellGeom.computeFaceNormals();
  
  var innerCellGeom = new THREE.Geometry();
  innerCellGeom.vertices = [
    world.coordsToPosition(new THREE.Vector3(0,0,0)),
    world.coordsToPosition(new THREE.Vector3(1,0,0)),
    world.coordsToPosition(new THREE.Vector3(0,1,0)),
    world.coordsToPosition(new THREE.Vector3(1,0,-1)),
    world.coordsToPosition(new THREE.Vector3(0,1,-1)),
    world.coordsToPosition(new THREE.Vector3(1,1,-1))
    ];
  innerCellGeom.faces = [
    new THREE.Face3(0,1,2),
    new THREE.Face3(0,3,1),
    new THREE.Face3(0,4,3),
    new THREE.Face3(0,2,4),
    new THREE.Face3(5,2,1),
    new THREE.Face3(5,1,3),
    new THREE.Face3(5,3,4),
    new THREE.Face3(5,4,2)
    ];
  innerCellGeom.computeFaceNormals();
  
  for(var i in world.cells){
    var cell = world.cells[i];
    if(cell.profile == cells.profiles.down){
      cell.mesh = new THREE.Mesh(downCellGeom, mat);
    cell.mesh.position = world.coordsToPosition(new THREE.Vector3(cell.root.x, cell.root.y, cell.root.z));
    app.globals.scene.add(cell.mesh);
    }
    else if(cell.profile == cells.profiles.up)
    {
      cell.mesh = new THREE.Mesh(upCellGeom, mat);
    cell.mesh.position = world.coordsToPosition(new THREE.Vector3(cell.root.x, cell.root.y, cell.root.z));
    app.globals.scene.add(cell.mesh);
    }
    else if(cell.profile == cells.profiles.inner)
    {
      cell.mesh = new THREE.Mesh(innerCellGeom, mat);
    cell.mesh.position = world.coordsToPosition(new THREE.Vector3(cell.root.x, cell.root.y, cell.root.z));
    app.globals.scene.add(cell.mesh);
    }
  }
  app.globals.scene.add(pointLight);
  app.globals.scene.add(ambLight);
  
  $("#toggleUp").click(hideUpCells);
  $("#toggleDown").click(hideDownCells);
  $("#toggleInner").click(hideInnerCells);
  
	window.requestAnimationFrame(draw);
  $('body').keydown(onKeyDown).keyup(onKeyUp); 
}

function hideUpCells(event){
  for(var i in world.cells)
  {
    if(world.cells[i].profile == cells.profiles.up){app.globals.scene.remove(world.cells[i].mesh);}
  }
  $('#toggleUp').click(showUpCells).removeClass("lit");
}
function showUpCells(event){
  for(var i in world.cells)
  {
    if(world.cells[i].profile == cells.profiles.up){app.globals.scene.add(world.cells[i].mesh);}
  }
  $('#toggleUp').click(hideUpCells).addClass("lit");
}

function hideDownCells(event){
  for(var i in world.cells)
  {
    if(world.cells[i].profile == cells.profiles.down){app.globals.scene.remove(world.cells[i].mesh);}
  }
  $('#toggleDown').click(showDownCells).removeClass("lit");
}
function showDownCells(event){
  for(var i in world.cells)
  {
    if(world.cells[i].profile == cells.profiles.down){app.globals.scene.add(world.cells[i].mesh);}
  }
  $('#toggleDown').click(hideDownCells).addClass("lit");
}

function hideInnerCells(event){
  for(var i in world.cells)
  {
    if(world.cells[i].profile == cells.profiles.inner){app.globals.scene.remove(world.cells[i].mesh);}
  }
  $('#toggleInner').click(showInnerCells).removeClass("lit");
}
function showInnerCells(event){
  for(var i in world.cells)
  {
    if(world.cells[i].profile == cells.profiles.inner){app.globals.scene.add(world.cells[i].mesh);}
  }
  $('#toggleInner').click(hideInnerCells).addClass("lit");
}

function onKeyDown(event){
  var key = event.which;
  if(key == app.globals.keys.left.code){app.globals.keys.left.state = 1; refreshAxes();}
  if(key == app.globals.keys.right.code){app.globals.keys.right.state = 1; refreshAxes();}
  if(key == app.globals.keys.up.code){app.globals.keys.up.state = 1; refreshAxes();}
  if(key == app.globals.keys.down.code){app.globals.keys.down.state = 1; refreshAxes();}
  if(key == app.globals.keys.w.code){app.globals.keys.w.state = 1; refreshAxes();}
  if(key == app.globals.keys.a.code){app.globals.keys.a.state = 1; refreshAxes();}
  if(key == app.globals.keys.s.code){app.globals.keys.s.state = 1; refreshAxes();}
  if(key == app.globals.keys.d.code){app.globals.keys.d.state = 1; refreshAxes();}
  if(key == app.globals.keys.e.code){app.globals.keys.e.state = 1; refreshAxes();}
  if(key == app.globals.keys.q.code){app.globals.keys.q.state = 1; refreshAxes();}
  event.stopImmediatePropagation();
}
function onKeyUp(event){
  var key = event.which;
  if(key == app.globals.keys.left.code){app.globals.keys.left.state = 0; refreshAxes();}
  if(key == app.globals.keys.right.code){app.globals.keys.right.state = 0; refreshAxes();}
  if(key == app.globals.keys.up.code){app.globals.keys.up.state = 0; refreshAxes();}
  if(key == app.globals.keys.down.code){app.globals.keys.down.state = 0; refreshAxes();}
  if(key == app.globals.keys.w.code){app.globals.keys.w.state = 0; refreshAxes();}
  if(key == app.globals.keys.a.code){app.globals.keys.a.state = 0; refreshAxes();}
  if(key == app.globals.keys.s.code){app.globals.keys.s.state = 0; refreshAxes();}
  if(key == app.globals.keys.d.code){app.globals.keys.d.state = 0; refreshAxes();}
  if(key == app.globals.keys.e.code){app.globals.keys.e.state = 0; refreshAxes();}
  if(key == app.globals.keys.q.code){app.globals.keys.q.state = 0; refreshAxes();}
  event.stopPropagation();
}
function refreshAxes(){
  app.globals.axes.X1 = app.globals.keys.d.state - app.globals.keys.a.state;
  app.globals.axes.Y1 = app.globals.keys.w.state - app.globals.keys.s.state;
  app.globals.axes.X2 = app.globals.keys.right.state - app.globals.keys.left.state;
  app.globals.axes.Y2 = app.globals.keys.up.state - app.globals.keys.down.state;
  app.globals.axes.Z1 = app.globals.keys.e.state - app.globals.keys.q.state;
}
function tabulateMatrix(mat){
  var str = "<table><tr>";
  str += "<td>"+mat.elements[0]+"</td>";
  str += "<td>"+mat.elements[1]+"</td>";
  str += "<td>"+mat.elements[2]+"</td>";
  str += "<td>"+mat.elements[3]+"</td>";
  str += "</tr><tr>";
  str += "<td>"+mat.elements[4]+"</td>";
  str += "<td>"+mat.elements[5]+"</td>";
  str += "<td>"+mat.elements[6]+"</td>";
  str += "<td>"+mat.elements[7]+"</td>";
  str += "</tr><tr>";
  str += "<td>"+mat.elements[8]+"</td>";
  str += "<td>"+mat.elements[9]+"</td>";
  str += "<td>"+mat.elements[10]+"</td>";
  str += "<td>"+mat.elements[11]+"</td>";
  str += "</tr><tr>";
  str += "<td>"+mat.elements[12]+"</td>";
  str += "<td>"+mat.elements[13]+"</td>";
  str += "<td>"+mat.elements[14]+"</td>";
  str += "<td>"+mat.elements[15]+"</td>";
  str += "</tr></table>";
  return str;
}
function matrixUp(mat){
  return new THREE.Vector3(0,1,0).applyMatrix3(mat);
}
function draw(){
  $('#output').text("");
  var camMat = new THREE.Matrix4().getInverse(app.globals.camera.matrix.clone().transpose());
  app.globals.cameraRig.translateOnAxis(new THREE.Vector3(0,0,1).applyMatrix4(camMat),(-app.globals.axes.Y1*0.1));
  app.globals.cameraRig.translateOnAxis(new THREE.Vector3(1,0,0).applyMatrix4(camMat),(app.globals.axes.X1*0.1));
  app.globals.cameraRig.translateOnAxis(new THREE.Vector3(0,1,0), app.globals.axes.Z1 * 0.1);
  app.globals.cameraRig.rotateOnAxis(new THREE.Vector3(0,1,0), -app.globals.axes.X2*0.02); //object space
  app.globals.camera.rotateOnAxis(new THREE.Vector3(1,0,0), app.globals.axes.Y2*0.01);
  for(var i in app.globals.trace)
  {
    var str = (app.globals.trace[i]());
    $('#output').append("<div>"+str+"</div>");
  }
  app.globals.renderer.render(app.globals.scene,app.globals.camera);
	window.requestAnimationFrame(draw);
}
$(document).ready(onDocumentReady);