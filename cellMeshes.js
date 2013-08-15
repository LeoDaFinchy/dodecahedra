var app = app || {testCellMeshes:true};
var THREE = THREE;

app.cellMeshes = {
  meshes:{
    upCellMeshes:[],
    downCellMeshes:[],
    innerCellMeshes:[],
    clickMesh:{
      mesh:new THREE.Geometry(),
      faceMap:[],
    }
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
    return (meshes[t]);
  },
  /**
   * from the mesh, get the vertices, whether they are behind the cut or not, and give them their own group
   * */
  compileVertexSliceInfo:function(mesh,weights)
  {
    var vertices = [];
    var groups = {};
    for(var w in weights)
    {
      var vertex = {
        vertex: mesh.vertices[w],
        behind: weights[w],
        group:  weights[w] ? -1 : w,
      };
      vertices.push(vertex);
      //vertex groups are labelled after front vertices
      if(!weights[w])
      {
        groups[w] = [vertex];
      }
    }
    return {vertices:vertices,groups:groups,faceGroups:{}};
  },
  /**
   * for all the vertex groups present on a face, put all those vertices in one group
   * */
  unifyFaceGroups:function(groups, faceGroups)
  {
    var unifiedGroup = null;
    for(var fG in faceGroups)
    {
      //set the unified Group if it doesn't exist already, skip moving vertices
      if(!unifiedGroup)
      {
        unifiedGroup = fG;
        continue;
      }
      //set the group of the front vertices to the unified group.
      console.log(groups);
      groups[unifiedGroup] = groups[unifiedGroup].concat(groups[fG]);
      for(var v in groups[fG])
      {
        groups[fG][v].group = unifiedGroup;
      }
      delete groups[fG];
      console.log(groups);
    }
  },
  /**
   * find which vertex groups are present on a face
   * */
  discoverFaceGroups:function(face, vertexInfo)
  {
    var faceVertices = [face.a,face.b,face.c];
    var faceGroups = {};
    for(var fV in faceVertices)
    {
      if(!vertexInfo.vertices[faceVertices[fV]].behind){
        faceGroups[vertexInfo.vertices[faceVertices[fV]].group] = true;
      }
    }
    return faceGroups;
  },
  mapToSlice:function(a,b,map){
    var x = Math.min(a,b);
    var y = Math.max(a,b);
    return map[x][y];
  },
  /**
   * group all adjacent cut vertices
   * */
  groupVertices:function(vertexInfo, mesh)
  {
    for(var f in mesh.faces)
    {
      var face = mesh.faces[f];
      var faceGroups = app.cellMeshes.discoverFaceGroups(face, vertexInfo);
      console.log("Face",f);
      app.cellMeshes.unifyFaceGroups(vertexInfo.groups,faceGroups);
    }
  },
  /**
   * sliceMesn returns a mesh representing the slice made through the cell.
   * */
  sliceMesh:function(mesh, weights){
    if(mesh.vertices.length != weights.length)
    {
      console.error("Number of mesh slice vertex weights inequal to number of vertices");
      return mesh;
    }
    var slicedMesh = new THREE.Geometry();
    var vertexMap = {};
    // First, identify which vertices are behind the cut surface, and which are in front
    var vertexInfo = app.cellMeshes.compileVertexSliceInfo(mesh,weights);
    // We need to consider whether the better solution is to check all the vertices 
    // for whether they are adjacent, or to create a whole bunch of useless midpoints
    // I suspect that both have an execution time ~ N^2
    
    
    // THERE IS A BETTER WAY
    // We should loop through the faces, and create a map for each pair there. This
    // is roughtly linear complexity and only produces double what we need as we are
    // sticking with triangles. Making sure to arrange them smallest-index-first will
    // eliminate the duplicates.
    // THIS IS A NOTE BECAUSE I HAVE BIGGER PROBLEMS RIGHT NOW
    for(var first in vertexInfo.vertices)
    {
      for(var second = first; second < vertexInfo.vertices.length; second++)
      {
        if(vertexInfo.vertices[first].behind != vertexInfo.vertices[second].behind)
        {
          var halfpoint = vertexInfo.vertices[first].vertex.clone().lerp(vertexInfo.vertices[second].vertex,0.5);
          slicedMesh.vertices.push(halfpoint);
          vertexMap[first] = vertexMap[first] || [];
          vertexMap[first][second] = slicedMesh.vertices.length-1;
        }
      }
    }
    /*app.cellMeshes.groupVertices(vertexInfo, mesh);
    console.log("final groups:",vertexInfo.groups);*/
    // For each set:
    /**/
    var edges = [];
    var centreVertex = new THREE.Vector3(0,0,0);
    for(var f in mesh.faces)
    {
      var face = mesh.faces[f];
      var a = vertexInfo.vertices[face.a];
      var b = vertexInfo.vertices[face.b];
      var c = vertexInfo.vertices[face.c];
      if(a.behind)
      {
        if(b.behind)
        {
          if(c.behind)
          {
            //console.log("Face",f,"is behind");
          }
          else
          {
            edges.push({
              from:app.cellMeshes.mapToSlice(face.a,face.c, vertexMap),
              to:app.cellMeshes.mapToSlice(face.b,face.c, vertexMap),
            });
            centreVertex.add(slicedMesh.vertices[app.cellMeshes.mapToSlice(face.a,face.c, vertexMap)]);
            slicedMesh.faces.push(new THREE.Face3(
                app.cellMeshes.mapToSlice(face.a,face.c, vertexMap),
                app.cellMeshes.mapToSlice(face.b,face.c, vertexMap),
                slicedMesh.vertices.length
            ));
          }
        }
        else
        {
          if(c.behind)
          {
            edges.push({
              from:app.cellMeshes.mapToSlice(face.b,face.c, vertexMap),
              to:app.cellMeshes.mapToSlice(face.a,face.b, vertexMap),
            });
            centreVertex.add(slicedMesh.vertices[app.cellMeshes.mapToSlice(face.b,face.c, vertexMap)]);
            slicedMesh.faces.push(new THREE.Face3(
                app.cellMeshes.mapToSlice(face.b,face.c, vertexMap),
                app.cellMeshes.mapToSlice(face.a,face.b, vertexMap),
                slicedMesh.vertices.length
            ));
          }
          else
          {
            edges.push({
              from:app.cellMeshes.mapToSlice(face.a,face.c, vertexMap),
              to:app.cellMeshes.mapToSlice(face.a,face.b, vertexMap),
            });
            centreVertex.add(slicedMesh.vertices[app.cellMeshes.mapToSlice(face.a,face.c, vertexMap)]);
            slicedMesh.faces.push(new THREE.Face3(
                app.cellMeshes.mapToSlice(face.a,face.c, vertexMap),
                app.cellMeshes.mapToSlice(face.a,face.b, vertexMap),
                slicedMesh.vertices.length
            ));
          }
        }
      }
      else
      {
        if(b.behind)
        {
          if(c.behind)
          {
            edges.push({
              from:app.cellMeshes.mapToSlice(face.a,face.b, vertexMap),
              to:app.cellMeshes.mapToSlice(face.a,face.c, vertexMap),
            });
            centreVertex.add(slicedMesh.vertices[app.cellMeshes.mapToSlice(face.a,face.b, vertexMap)]);
            slicedMesh.faces.push(new THREE.Face3(
                app.cellMeshes.mapToSlice(face.a,face.b, vertexMap),
                app.cellMeshes.mapToSlice(face.a,face.c, vertexMap),
                slicedMesh.vertices.length
            ));
          }
          else
          {
            edges.push({
              from:app.cellMeshes.mapToSlice(face.a,face.b, vertexMap),
              to:app.cellMeshes.mapToSlice(face.b,face.c, vertexMap),
            });
            centreVertex.add(slicedMesh.vertices[app.cellMeshes.mapToSlice(face.a,face.b, vertexMap)]);
            slicedMesh.faces.push(new THREE.Face3(
                app.cellMeshes.mapToSlice(face.a,face.b, vertexMap),
                app.cellMeshes.mapToSlice(face.b,face.c, vertexMap),
                slicedMesh.vertices.length
            ));
          }
        }
        else
        {
          if(c.behind)
          {
            edges.push({
              from:app.cellMeshes.mapToSlice(face.b,face.c, vertexMap),
              to:app.cellMeshes.mapToSlice(face.a,face.c, vertexMap),
            });
            centreVertex.add(slicedMesh.vertices[app.cellMeshes.mapToSlice(face.b,face.c, vertexMap)]);
            slicedMesh.faces.push(new THREE.Face3(
                app.cellMeshes.mapToSlice(face.b,face.c, vertexMap),
                app.cellMeshes.mapToSlice(face.a,face.c, vertexMap),
                slicedMesh.vertices.length
            ));
          }
          else
          {
            //console.log("Face",f,"is in front");
          }
        }
      }
    }
    centreVertex.divideScalar(slicedMesh.vertices.length);
    slicedMesh.vertices.push(centreVertex);
    
    slicedMesh.computeFaceNormals();
    
    return(slicedMesh);
  },
  generateMeshes:function(){
    
    Math.TAU = Math.PI*2;
    var skew30 = Math.tan(Math.TAU/12);
    var skew15 = Math.tan(Math.TAU/24);
    /**/
    var matrix = new THREE.Matrix4(
      skew30,-skew30,0,0,
      skew30,skew30,skew30,0,
      -skew15,-skew15,skew30,0,
      0,0,0,1);
    /**//*
    var matrix = new THREE.Matrix4(
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1);
    /**/
    var geom;
    
    /**
     * Down Cells
     */
    // 0 KRGB
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
    //geom.computeFaceNormals();
    //app.cellMeshes.meshes.downCellMeshes.push(geom);
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,1]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,1]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,1]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,1]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,1]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,1]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,1]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,1]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,0]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,0]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,0]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,0]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,0]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,0]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,0]));
    app.cellMeshes.meshes.downCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,0]));
    
    // 1 -RGB
    /*geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // 2 K-GB
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // 3 --GB
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,2,3,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // 4 KR-B
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // 5 -R-B
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // 6 K--B
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // 7 ---B
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // 8 KRG-
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    // 9 -RG-
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    //10 K-G-
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    //11 --G-
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    //12 KR--
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,3,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    //13 -R--
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    //14 K---
    geom = new THREE.Geometry();
    geom.vertices = [  
      new THREE.Vector3( 0.5, 0.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    
    //15 ----
    geom = new THREE.Geometry();
    geom.vertices = [ 
    ];
    geom.faces = [
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.downCellMeshes.push(geom);
    */
    /**
     * Up Cells
     */
     
    // 0 WCMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
      new THREE.Face3(0,2,3),
      new THREE.Face3(0,3,1),
      new THREE.Face3(3,2,1),
    ];
    //geom.computeFaceNormals();
    //app.cellMeshes.meshes.upCellMeshes.push(geom);
    
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,1]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,1]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,1]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,1]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,1]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,1]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,1]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,1]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,0]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,0]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,0]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,0]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,0]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,0]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,0]));
    app.cellMeshes.meshes.upCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,0]));
    /*
    // 1 -CMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
    
    // 2 W-MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    // 3 --MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    // 4 WC-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    // 5 -C-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    // 6 W--Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    // 7 ---Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    // 8 WCM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    // 9 -CM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    //10 W-M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    //11 --M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
     
    //12 WC--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
    
    //13 -C--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
    
    //14 W---
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 1.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
    
    //15 ----
    geom = new THREE.Geometry();
    geom.vertices = [
    ];
    geom.faces = [
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.upCellMeshes.push(geom);
    */
    /**
     * Inner Cells
     */
     
    // 0 RGBCMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),//R
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),//G
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),//B
      new THREE.Vector3( 0.0, 1.0, 1.0).applyMatrix4(matrix),//C
      new THREE.Vector3( 1.0, 0.0, 1.0).applyMatrix4(matrix),//M
      new THREE.Vector3( 1.0, 1.0, 0.0).applyMatrix4(matrix),//Y
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
    //geom.computeFaceNormals();
    //app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,1,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,1,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,1,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,1,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,1,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,1,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,1,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,1,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,0,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,0,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,0,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,0,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,0,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,0,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,0,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,0,1,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,1,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,1,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,1,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,1,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,1,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,1,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,1,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,1,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,0,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,0,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,0,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,0,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,0,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,0,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,0,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,0,0,1]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,1,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,1,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,1,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,1,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,1,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,1,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,1,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,1,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,0,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,0,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,0,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,0,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,0,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,0,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,0,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,0,1,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,1,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,1,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,1,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,1,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,1,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,1,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,1,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,1,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,1,0,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,1,0,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,1,0,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,1,0,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,1,0,0,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,1,0,0,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[1,0,0,0,0,0]));
    app.cellMeshes.meshes.innerCellMeshes.push(app.cellMeshes.sliceMesh(geom,[0,0,0,0,0,0]));
    /*
    // 1 -GBCMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    // 2 R-BCMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    // 3 --BCMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,4,5,2),
      new THREE.Face4(1,0,3,4),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    // 4 RG-CMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    // 5 -G-CMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(2,4,3,0),
      new THREE.Face4(2,1,5,4),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    // 6 R--CMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(2,0,3,5),
      new THREE.Face4(2,5,4,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    // 7 ---CMY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,4,5),
      new THREE.Face4(0,5,3,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    // 8 RGB-MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    // 9 -GB-MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(4,5,6,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //10 R-B-MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,4,5,2),
      new THREE.Face4(0,1,3,4),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //11 --B-MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(0,3,4,5),
      new THREE.Face4(0,5,6,7),
      new THREE.Face4(0,7,8,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //12 RG--MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,5,3,1),
      new THREE.Face4(0,2,4,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //13 -G--MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(0,3,4,5),
      new THREE.Face4(0,5,6,7),
      new THREE.Face4(0,7,8,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //14 R---MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(2,5,0,1),
      new THREE.Face4(2,3,4,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //15 ----MY
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,4,3),
      new THREE.Face4(5,4,1,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //16 RGBC-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //17 -GBC-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,4,3,0),
      new THREE.Face4(4,1,2,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //18 R-BC-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(4,5,6,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //19 --BC-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(0,3,4,5),
      new THREE.Face4(0,5,6,7),
      new THREE.Face4(0,7,8,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //20 RG-C-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,5,4,2),
      new THREE.Face4(1,0,3,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //21 -G-C-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(3,2,1,0),
      new THREE.Face4(0,5,4,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //22 R--C-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(0,5,4,3),
      new THREE.Face4(0,7,6,5),
      new THREE.Face4(0,1,8,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //23 ---C-Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,3,5,2),
      new THREE.Face4(1,0,4,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //24 RGB--Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,5,2),
      new THREE.Face4(0,1,4,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //25 -GB--Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(0,5,4,3),
      new THREE.Face4(0,7,6,5),
      new THREE.Face4(0,1,8,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //26 R-B--Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(0,5,4,3),
      new THREE.Face4(0,7,6,5),
      new THREE.Face4(0,1,8,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //27 --B--Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(4,5,6,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //28 RG---Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(0,3,4,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //29 -G---Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,4,5,2),
      new THREE.Face4(1,0,3,4),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //30 R----Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,5,3,0),
      new THREE.Face4(1,2,4,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //31 -----Y
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //32 RGBCM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //33 -GBCM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,0,3,5),
      new THREE.Face4(1,5,4,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //34 R-BCM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,2,5,4),
      new THREE.Face4(1,4,3,0),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //35 --BCM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(0,5,4,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //36 RG-CM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(4,7,6,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //37 -G-CM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(0,3,4,5),
      new THREE.Face4(0,5,6,7),
      new THREE.Face4(0,7,8,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //38 R--CM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(0,3,4,5),
      new THREE.Face4(0,5,6,7),
      new THREE.Face4(0,7,8,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //39 ---CM-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,2,5,3),
      new THREE.Face4(0,3,4,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //40 RGB-M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,2,5,3),
      new THREE.Face4(1,3,4,0),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //41 -GB-M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(0,3,4,5),
      new THREE.Face4(0,5,6,7),
      new THREE.Face4(0,7,8,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //42 R-B-M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
      new THREE.Face4(0,3,4,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //43 --B-M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,2,4,5),
      new THREE.Face4(1,5,3,0),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //44 RG--M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(0,5,4,3),
      new THREE.Face4(0,7,6,5),
      new THREE.Face4(0,1,8,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //45 -G--M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(4,7,6,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //46 R---M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,0,3,4),
      new THREE.Face4(4,5,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //47 ----M-
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //48 RGBC--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,4,1),
      new THREE.Face4(5,2,1,4),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //49 -GBC--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(2,1,0,5),
      new THREE.Face4(2,5,4,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //50 R-BC--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),//Yc
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),//cg
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),//Bg
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),//gr
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),//Yr
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),//rm
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),//Bm
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),//mc
      
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(0,5,4,3),
      new THREE.Face4(0,7,6,5),
      new THREE.Face4(0,1,8,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //51 --BC--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,3,5),
      new THREE.Face4(0,5,4,2),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //52 RG-C--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),//0
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),//Gy
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),//yr
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),//Mr
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),//rb
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),//Gb
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),//bc
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),//Mc
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),//cy
      
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(0,5,4,3),
      new THREE.Face4(0,7,6,5),
      new THREE.Face4(0,1,8,7),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //53 -G-C--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,2,5,4),
      new THREE.Face4(0,4,3,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //54 R--C--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
      new THREE.Face4(4,7,6,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //55 ---C--
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //56 RGB---
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,5,4,1),
      new THREE.Face4(0,2,3,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //57 -GB---
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(2,5,3,0),
      new THREE.Face4(2,1,4,5),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //58 R-B---
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face3(0,1,2),
      new THREE.Face3(3,4,5),
      new THREE.Face4(0,3,5,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //59 --B---
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 1.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //60 RG----
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(1,2,5,4),
      new THREE.Face4(1,4,3,0),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //61 -G----
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 0.5, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.0, 1.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 1.0, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,3,2,1),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //62 R-----
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.0).applyMatrix4(matrix),
      new THREE.Vector3( 0.5, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.0, 0.5).applyMatrix4(matrix),
      new THREE.Vector3( 1.0, 0.5, 0.0).applyMatrix4(matrix),
    ];
    geom.faces = [
      new THREE.Face4(0,1,2,3),
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);
    
    //63 ------
    geom = new THREE.Geometry();
    geom.vertices = [
    ];
    geom.faces = [
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.innerCellMeshes.push(geom);*/
    
    geom = new THREE.Geometry();
    geom.vertices = [
      new THREE.Vector3( 0.5, 0.5, 0.5).applyMatrix4(matrix),//top
      
      new THREE.Vector3( 0.0, 0.0, 1.0).applyMatrix4(matrix),//6
      new THREE.Vector3( 0.0, 1.0, 0.0).applyMatrix4(matrix),//10
      new THREE.Vector3( 1.0, 0.0, 0.0).applyMatrix4(matrix),//2
      
      new THREE.Vector3( 0.5, 0.5,-0.5).applyMatrix4(matrix),//12
      new THREE.Vector3( 0.5,-0.5, 0.5).applyMatrix4(matrix),//4
      new THREE.Vector3(-0.5, 0.5, 0.5).applyMatrix4(matrix),//8
      
      new THREE.Vector3( 0.5,-0.5,-0.5).applyMatrix4(matrix),//2
      new THREE.Vector3(-0.5, 0.5,-0.5).applyMatrix4(matrix),//10
      new THREE.Vector3(-0.5,-0.5, 0.5).applyMatrix4(matrix),//6
      
      new THREE.Vector3( 0.0, 0.0,-1.0).applyMatrix4(matrix),//12
      new THREE.Vector3( 0.0,-1.0, 0.0).applyMatrix4(matrix),//4
      new THREE.Vector3(-1.0, 0,0, 0,0).applyMatrix4(matrix),//8
      
      new THREE.Vector3(-0.5,-0.5,-0.5).applyMatrix4(matrix),//bottom
    ];
    geom.faces = [
      new THREE.Face4(0,3,4,2),//12     
      new THREE.Face4(0,2,6,1),//8
      new THREE.Face4(0,1,5,3),//4
      
      new THREE.Face4(1,9,11,5),//5
      new THREE.Face4(2,8,12,6),//9
      new THREE.Face4(3,7,10,4),//1
      new THREE.Face4(4,10,8,2),//11
      new THREE.Face4(5,11,7,3),//3
      new THREE.Face4(6,12,9,1),//7
      
      new THREE.Face4(13,10,7,11),//2
      new THREE.Face4(13,11,9,12),//6
      new THREE.Face4(13,12,8,10),//10
    ];
    geom.computeFaceNormals();
    app.cellMeshes.meshes.clickMesh.mesh = geom;
  },
};

app.cellMeshes.generateMeshes();

/**
 * TESTING
 * */
 
if(app.testCellMeshes)
{
  var mesh = app.cellMeshes.meshes.innerCellMeshes[0];
  var weights = [1,1,0,1,0,0];
  
  app.cellMeshes.sliceMesh(mesh,weights);
}