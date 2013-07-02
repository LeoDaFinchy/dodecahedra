var app = app || {};

app.graph = {
  node:function(){
    
  },
  edge:function(blue,yellow,direction,data){
    /**
     * nodes named blue/yellow to avoid implicit primacy/order
     */
    if(blue._type != "graph.node" || yellow._type != "graph.node") throw "Cannot build graph.edge without valid nodes ";
    this.blue = blue;
    this.yellow = yellow;
    this.direction = direction || this.directions.green;
    this.data = data || {};
  },
  group:function(nodes, type){
    this.nodes = nodes;
    this.type = type;
  },
  graph:function()
  {
    
  }
};

app.graph.node.prototype = 
{
  _type:"graph.node",
  edges:[],
  groups:[],
  data:{},
};
app.graph.edge.prototype = 
{
  _type:"graph.edge",
  directions:{
    /**
     * black - invlsible link ignored/unused for most purposes
     * blue - directional link from yellow node to blue node
     * yellow - directional link from yellow node to blue node
     * green - directionless link between nodes
     */
    black:0,
    blue:1,
    yellow:2,
    green:3
  },
  data:{}
};
app.graph.group.prototype = 
{
  _type:"graph.group",
  /**
   * cloud - nodes bear no relation to each other
   * cluster - all nodes implicitly green-linked
   * path - nodes implicitly direction-linked in order
   * cycle - nodes implicitly direction-linked in order, including last to first
   */
  types:{
    cloud:0,
    cluster:1,
    path:2,
    cycle:3
  }
};
app.graph.graph.prototype = 
{
  nodes:[],
  edges:[],
  groups:[],
};

/**
 * Unit Test
 */

/*
var node1 = new app.graph.node();
var node2 = new app.graph.node();
var edge1 = new app.graph.edge(node1,node2);
var edge2 = new app.graph.edge(node1,node2);
console.log(edge1.direction);
*/