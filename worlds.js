var app = app;
var THREE = THREE;
/**
 * Only for use in unit test
 */
function extend(destination, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      destination[k] = source[k];
    }
  }
  return destination; 
}

app.worlds = {
  node:function(){
    /**
     * This needs to be placed here, otherwise the populateNodes function in the
     * cell prototype will add the cells to this.prototype.cells instead of
     * this.cells (causing all cells to be added to a shared array used by all nodes)
     */
    this.cells = [];
    this.data = {};
  },
  world:function(dimensions)
  {
    var skew30 = Math.tan(Math.TAU/12);
    var skew15 = Math.tan(Math.TAU/24);
    this.matrix = new THREE.Matrix4(
      skew30,-skew30,0,0,
      skew30,skew30,skew30,0,
      -skew15,-skew15,skew30,0,
      0,0,0,1);
    this.dimensions = dimensions;
    
    /**
     * FINE FOR NOW
     */
    for(var x = 0; x < dimensions.x; x++)
    {
      var long = [];
      for(var y = 0; y < dimensions.y; y++)
      {
        var lat = [];
        for(var z = 0; z < dimensions.z; z++)
        {
          var alt = new app.worlds.node();
          lat.push(alt);
          alt.data.coords = {x:x,y:y,z:z};
          alt.data.solid = true;
          this.coords.push({x:x,y:y,z:z});
          
          if(app.worlds.cell.prototype.downCellProfile.validateRootCoordinate({x:x,y:y,z:z},
                                                          {x:this.dimensions.x,y:this.dimensions.y,z:this.dimensions.z}))
          {
            var downCell = new app.worlds.cell();
            downCell.root = {x:x,y:y,z:z};
            downCell.profile = app.worlds.cell.prototype.profiles.down;
            this.cells.push(downCell);
          }
          if(app.worlds.cell.prototype.upCellProfile.validateRootCoordinate({x:x,y:y,z:z},
                                                          {x:this.dimensions.x,y:this.dimensions.y,z:this.dimensions.z}))
          {
            var upCell = new app.worlds.cell();
            upCell.root = {x:x,y:y,z:z};
            upCell.profile = app.worlds.cell.prototype.profiles.up;
            this.cells.push(upCell);
          }
          if(app.worlds.cell.prototype.innerCellProfile.validateRootCoordinate({x:x,y:y,z:z},
                                                          {x:this.dimensions.x,y:this.dimensions.y,z:this.dimensions.z}))
          {
            var innerCell = new app.worlds.cell();
            innerCell.root = {x:x,y:y,z:z};
            innerCell.profile = app.worlds.cell.prototype.profiles.inner;
            this.cells.push(innerCell);
          }
        }
        long.push(lat);
      }
      this.nodes.push(long);
    }
    for(var n in this.cells)
    {
      this.cells[n].populateNodes(this);
    }
    /**
     * FINE FOR NOW END
     */
  },
  /**
   * FINE FOR NOW
   */
  cell:function(){
    /**
     * This needs to be placed here, otherwise the populateNodes function in the
     * prototype will add the nodes to this.prototype.nodes instead of
     * this.nodes (causing all nodes to be added to a shared array used by all cells)
     */
    this.nodes = [];
  },
  /**
   * FINE FOR NOW END
   */
};

extend(app.worlds.node.prototype,app.graph.node.prototype);

app.worlds.node.prototype = 
{
  _type:"worlds.node",
  refreshCells:function(){
    for(var c in this.cells){
      app.globals.scene.remove(this.cells[c].mesh);
      this.cells[c].mesh = new THREE.Mesh(app.cellMeshes.selectMesh(this.cells[c],app.globals.mat));
      app.globals.scene.add(this.cells[c].mesh);
    }
  }
};
app.worlds.cell.prototype = 
{
  _type:"worlds.cell",
  root:{x:0,y:0,z:0},
  mesh:null,
  profile:null,
  populateNodes:function(world){
    var coords;
    if(this.profile == this.profiles.down){coords = this.downCellProfile.coords;} else
    if(this.profile == this.profiles.up){coords = this.upCellProfile.coords;} else
    if(this.profile == this.profiles.inner){coords = this.innerCellProfile.coords;}
    for(var c in coords)
    {
      var coord = {
        x:coords[c].x+this.root.x,
        y:coords[c].y+this.root.y,
        z:coords[c].z+this.root.z
        };
      this.nodes.push(world.nodes[coord.x][coord.y][coord.z]);
      world.nodes[coord.x][coord.y][coord.z].cells.push(this);
    }
  },
  
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
      new THREE.Vector3(1,1,1),
      new THREE.Vector3(0,1,1),
      new THREE.Vector3(1,0,1),
      new THREE.Vector3(1,1,0)
      ],
    validateRootCoordinate:function(root, bounds)
    {
      return (root.x < bounds.x - 1) && (root.x >= 0) &&
        (root.y < bounds.y - 1) && (root.y >= 0) &&
        (root.z < bounds.z - 1) && (root.z >= 0);
    }
  },
  innerCellProfile:{
    coords:[
      new THREE.Vector3(1,0,0),
      new THREE.Vector3(0,1,0),
      new THREE.Vector3(0,0,1),
      new THREE.Vector3(0,1,1),
      new THREE.Vector3(1,0,1),
      new THREE.Vector3(1,1,0)
    ],
    validateRootCoordinate:function(root, bounds)
    {
      return (root.x < bounds.x - 1) && (root.x >= 0) &&
        (root.y < bounds.y - 1) && (root.y >= 0) &&
        (root.z < bounds.z - 1) && (root.z >= 0);
    }
  },
  profiles:{
    down:0,
    up:1,
    inner:2,
  },
};

app.worlds.world.prototype = 
{
  _type:"worlds.world",
  nodes:[],
  cells:[],
  dimensions:[],
  coords:[],
  matrix:new THREE.Matrix4(),
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