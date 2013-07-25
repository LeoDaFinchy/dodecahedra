var app = app || {};
app.moduleLoader = {
  menu:{
    globals:{
      name:'globals',
      url:'./globals.js',
      prerequisites:['lens'],
      load:false
    },
    input:{
      name:'input',
      url:'./input.js',
      prerequisites:[],
      load:false
    },
    monitor:{
      name:'monitor',
      url:'./monitor.js',
      prerequisites:[],
      load:false
    },
    lens:{
      name:'lens',
      url:'./lens.js',
      prerequisites:[],
      load:false
    },
    graph:{
      name:'graph',
      url:'./graph.js',
      prerequisites:[],
      load:false,
    },
    worlds:{
      name:'worlds',
      url:'./worlds.js',
      prerequisites:['graph'],
      load:false,
    },
    cellMeshes:{
      name:'cellMeshes',
      url:'./cellMeshes.js',
      prerequisites:[],
      load:false,
    },
    default:{
      name:'default',
      prerequisites:[
        'globals',
        'input',
        'monitor',
        'worlds',
        'cellMeshes',
      ],
      load:false
    }
  },
  loadModule:function(name, callback){
    var loaded = $.when();
    if(this.menu[name].load == "complete")
    {
      console.log(name+" has already been loaded");
    }
    else if(this.menu[name].load == "pending")
    {
      console.log(name+" is already loading");
    }
    else
    {
      if(!this.menu[name].url){console.log("loading module pack "+name);}
      this.menu[name].load = "pending";
      for(var i in this.menu[name].prerequisites)
      {
        loaded = $.when(loaded, this.loadModule(this.menu[name].prerequisites[i]));
      }
      if(this.menu[name].url)
      {
        console.log("loading "+name+"...");
        loaded = $.when(loaded, $.getScript(this.menu[name].url));
      }
      loaded.done(function(){
        console.log(name+" loaded");
        app.moduleLoader.menu[name].load = "complete";
      }, callback)
      .fail(function()
      {
        console.log("failed to load "+name);
        app.moduleLoader.menu[name].load = "failed";
      });
    }
    
    return loaded;
  }
};
/**
 * TEST
 */
function displayStatus()
{
  var display = $("#state");
  var content = "";
  for(var m in app.moduleLoader.menu)
  {
    content += "<div class='status "+app.moduleLoader.menu[m].load+"'>"+app.moduleLoader.menu[m].name+"</div>";
  }
  display.html(content);
  window.requestAnimationFrame(displayStatus);
}
app.moduleLoader.loadModule("default");
window.requestAnimationFrame(displayStatus);