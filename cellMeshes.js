var THREE = THREE;
var app = app || {};

app.cellMeshes = {
  meshes:{
    upCellMeshes:[],
    downCellMeshes:[],
    innerCellMeshes:[],
  },
  selectMesh:function(cell){
    var meshes;
    if(cell.profile == cell.profiles.up){meshes = this.meshes.upCellMeshes;} else
    if(cell.profile == cell.profiles.down){meshes = this.meshes.downCellMeshes;} else
    if(cell.profile == cell.profiles.inner){meshes = this.meshes.innerCellMeshes;}
    var e = 1;
    var t = 0;
    for(var n in cell.nodes)
    {
      if(cell.nodes[n].data.solid === false){
        t += e;
      }
      e += e;
    }
    console.log(t);
    return (meshes[t]);
  },
  generateMeshes:function(){
    var skew30 = Math.tan(Math.TAU/12);
    var skew15 = Math.tan(Math.TAU/24);
    var matrix = new THREE.Matrix4(
      skew30,-skew30,0,0,
      skew30,skew30,skew30,0,
      -skew15,-skew15,skew30,0,
      0,0,0,1);
    var geom;
    
    /**
     * Down Cells
     */
    // ALL
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,3),
      new THREE.Face3(0,2,1),
      new THREE.Face3(0,3,2),
      new THREE.Face3(3,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT 0
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
      new THREE.Face4(0,3,5,2),
      new THREE.Face4(2,5,4,3),
      new THREE.Face4(2,5,4,3),
      new THREE.Face3(5,3,4),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT X
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,5,4),
      new THREE.Face3(1,2,3),
      new THREE.Face4(0,4,2,1),
      new THREE.Face4(0,1,3,5),
      new THREE.Face4(4,5,3,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT 0X
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(1,3,5),
      new THREE.Face3(4,2,0),
      new THREE.Face4(4,0,1,5),
      new THREE.Face4(4,5,3,2),
      new THREE.Face4(0,2,3,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT Y
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(2,4,3),
      new THREE.Face3(0,1,5),
      new THREE.Face4(0,5,4,3),
      new THREE.Face4(4,5,1,3),
      new THREE.Face4(2,3,1,0),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT 0Y
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(1,5,4),
      new THREE.Face3(0,3,2),
      new THREE.Face4(5,2,3,4),
      new THREE.Face4(5,1,0,2),
      new THREE.Face4(1,4,3,0),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT XY
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,3,1),
      new THREE.Face3(5,2,4),
      new THREE.Face4(2,1,3,4),
      new THREE.Face4(5,0,1,2),
      new THREE.Face4(5,4,3,0),
      
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // LEAVE Z
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,3),
      new THREE.Face3(0,2,1),
      new THREE.Face3(0,3,2),
      new THREE.Face3(3,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT Z
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
      new THREE.Face3(3,4,5),
      new THREE.Face4(0,3,5,2),
      new THREE.Face4(0,1,4,3),
      new THREE.Face4(2,1,4,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT 0Z
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(3,1,5),
      new THREE.Face3(2,4,0),
      new THREE.Face4(2,3,5,4),
      new THREE.Face4(2,0,1,3),
      new THREE.Face4(4,5,1,0),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT XZ
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,4),
      new THREE.Face3(3,5,2),
      new THREE.Face4(0,4,5,3),
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(4,1,2,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // LEAVE Y
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,3),
      new THREE.Face3(0,2,1),
      new THREE.Face3(0,3,2),
      new THREE.Face3(3,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // CUT YZ
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,4,2),
      new THREE.Face3(1,3,5),
      new THREE.Face4(2,4,5,3),
      new THREE.Face4(0,1,5,4),
      new THREE.Face4(0,2,3,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // LEAVE X
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,3),
      new THREE.Face3(0,2,1),
      new THREE.Face3(0,3,2),
      new THREE.Face3(3,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // LEAVE 0
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,3),
      new THREE.Face3(0,2,1),
      new THREE.Face3(0,3,2),
      new THREE.Face3(3,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // NONE
    geom = new THREE.Geometry();
    geom.vertices = [ 
    ];
    geom.faces = [
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    /**
     * Up Cells
     */
     
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3(1,1,1).applyMatrix4(matrix),
      new THREE.Vector3(0,1,1).applyMatrix4(matrix),
      new THREE.Vector3(1,0,1).applyMatrix4(matrix),
      new THREE.Vector3(1,1,0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
      new THREE.Face3(0,2,3),
      new THREE.Face3(0,3,1),
      new THREE.Face3(3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
    
    /**
     * Inner Cells
     */
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3(1,0,0).applyMatrix4(matrix),
      new THREE.Vector3(0,1,0).applyMatrix4(matrix),
      new THREE.Vector3(0,0,1).applyMatrix4(matrix),
      new THREE.Vector3(0,1,1).applyMatrix4(matrix),
      new THREE.Vector3(1,0,1).applyMatrix4(matrix),
      new THREE.Vector3(1,1,0).applyMatrix4(matrix),
    ];
    geom.faces = [
    new THREE.Face3(0,2,1),
    new THREE.Face3(0,1,5),
    new THREE.Face3(5,1,3),
    new THREE.Face3(3,1,2),
    new THREE.Face3(2,4,3),
    new THREE.Face3(0,4,2),
    new THREE.Face3(5,4,0),
    new THREE.Face3(5,3,4),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
  },
};

app.cellMeshes.generateMeshes();