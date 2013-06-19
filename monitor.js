var app = app;
app.monitor = {
  trace:[],
  tabulateMatrix:function(mat){
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
}