var initialized = false;
var nVar, nHalo;
var col = 0, row = 1;
var data, view, chart;
var pData, tauData;
var hist, hData, nbin = 15;
var selectedHalo, varName;
var history = new Array();
var setAxisLimit = false;

function handleQueryResponse(response) {
  if (response.isError()) {
    alert('Error in query: ' + response.getMessage() + ' ' + response.getDetailedMessage());
    return;
  }
  data = response.getDataTable();
  view = new google.visualization.DataView(data);
  initializeDoc();
};

function initializeGoogle(){
  var query = new google.visualization.Query(dataSourceUrl);
  query.send(handleQueryResponse);
};

function initializeDoc(){
  if(!initialized){
    initialized = true;
    return;
  }
  
  nVar = data.getNumberOfColumns()-1;
  nHalo = data.getNumberOfRows();
  selectedHalo = new Array(nHalo);
  varName = new Array(nVar);
  var i;
  for(i=0; i<nVar; i++) varName[i] = data.getColumnLabel(i+1);
  
  chart = new google.visualization.ScatterChart(document.getElementById('plot'));
  google.visualization.events.addListener(chart, 'select', selectHandler);

  hist = new google.visualization.SteppedAreaChart(document.getElementById('plot-hist'));
  hData = new google.visualization.DataTable();
  hData.addColumn('string', 'edges');
  hData.addColumn('number', 'accumulated number');
  hData.addRows(nbin+2);
  
  var options = "<option>" + varName.join("</option><option>") + "</option>";
  $("#selRow").html(options);
  $("#selCol").html(options);
  
  $("#selRow").change(function(){
    loadPlot(col, $("#selRow > option:selected").index());
    $(this).blur();
  });
  
  $("#selCol").change(function(){
    loadPlot($("#selCol > option:selected").index(), row);
    $(this).blur();  
  });

  var dcol = new Array(-1, 0, 1, 0);
  var drow = new Array(0, -1, 0, 1);
  $(document).keydown(function(event){
    var key = event.which;
    if(key >= 37 && key < 41){
      event.preventDefault();
      key -= 37;
      loadPlot(col+dcol[key], row+drow[key]);
    }
  });

  $("input.style_checkbox").click(function(){
    loadPlot(col, row);
  });

  $("#setLimits").click(function(){
    setAxisLimit = true;
    loadPlot(col, row);
  });

  $("#clearLimits").click(function(){
    $("#x_amin").val('');
    $("#x_amax").val('');
    $("#y_amin").val('');
    $("#y_amax").val('');
    setAxisLimit = false;
    loadPlot(col, row);
  });

  $("#selectRange").click(function(){
    var xmin = parseFloat($("#xmin").val());
    var xmax = parseFloat($("#xmax").val());
    var ymin = parseFloat($("#ymin").val());
    var ymax = parseFloat($("#ymax").val());
    var i, crit = new Array;
    var crit_x = {column: col+1}, crit_y = {column: row+1};
    i = 0;
    if(!isNaN(xmin)) {crit_x.minValue = xmin; i+=1;}
    if(!isNaN(xmax)) {crit_x.maxValue = xmax; i+=1;}
    if(i > 0) crit.push(crit_x);
    i = 0;
    if(!isNaN(ymin)) {crit_y.minValue = ymin; i+=1;}
    if(!isNaN(ymax)) {crit_y.maxValue = ymax; i+=1;}
    if(i > 0) crit.push(crit_y);
    var selRows = data.getFilteredRows(crit);
    for(i=0; i<nHalo; i++){
      selectedHalo[i] = (selRows.indexOf(i) >= 0)?true:false;
    }
    if(col!=row) drawScatter();
    genKey();
  });
  
  $("#clearRange").click(function(){
    var i;
    for(i=0; i<nHalo; i++) selectedHalo[i] = false;
    if(col!=row) drawScatter();
    genKey();
    $("#xmin").val('');
    $("#xmax").val('');
    $("#ymin").val('');
    $("#ymax").val('');
  });
  
  $("#key").click(function(){
    $(this).select();
  });
  
  $("#goKey").click(function(){
    var keys = $("#key").val().split('/');
    var num = parseInt(keys[0]);
    for(i=0; i<nHalo; i++){
      selectedHalo[i] = (keys.indexOf(i.toString()) > 0)?true:false;
    }
    loadPlot(Math.floor(num/nVar), num%nVar);
  });
  
  $("#history").change(function(){
    var num = parseInt($(this).val());
    loadPlot(Math.floor(num/nVar), num%nVar, true);
    $(this).blur();
  });

  $('#plot-hist').hide();
  loadPlot(3,4,true);
};

function selectHandler() {
  var selection = chart.getSelection();
  var i = selection[0].row;
  selectedHalo[i] = (selectedHalo[i])?false:true;
  drawScatter();
  genKey();
};

function getCol1(d, i){
  return (selectedHalo[i])?(d.getValue(i, row+1)):null
};

function getCol2(d, i){
  return (!selectedHalo[i])?(d.getValue(i, row+1)):null
};

function drawScatter(){
  view.setColumns([col+1, {calc:getCol2, type:'number'}, 
      {sourceColumn:0, role:'tooltip'}, {calc:getCol1, type:'number'}, 
      {sourceColumn:0, role:'tooltip'}]);
  chart.draw(view, {width: 600, height: 600,
                    hAxis: {title: varName[col], 
                            viewWindowMode: (setAxisLimit?'explicit':'pretty'),
                            viewWindow: {min: parseFloat($('#x_amin').val()), max:parseFloat($('#x_amax').val())},
                            logScale: $('#x_log').is(':checked'),
                            //format: ($('#x_log').is(':checked')?'##E#':'####'),
                            direction: ($('#x_rev').is(':checked')?-1:1)},
                    vAxis: {title: varName[row],
                            viewWindowMode: (setAxisLimit?'explicit':'pretty'),
                            viewWindow: {min: parseFloat($('#y_amin').val()), max:parseFloat($('#y_amax').val())},
                            logScale: $('#y_log').is(':checked'),
                            //format: ($('#y_log').is(':checked')?'##E#':'####'),
                            direction: ($('#y_rev').is(':checked')?-1:1)},
                    chartArea: {left:60,top:25,width:520,height:520},
                    legend: 'none'});
  $('#plot').show();
  $('#plot-hist').hide();
};

function drawHist(){
  var i = 0, j = col+1, n=nbin+2, binsize;
  var range = data.getColumnRange(j);
  var h = new Array(n), x = new Array(n);

  if($('#x_log').is(':checked')){
      binsize = (Math.log(range.max) - Math.log(range.min))/nbin;
  }
  else{
      binsize = (range.max - range.min)/nbin;
  }

  for(i=0; i<n; i++){
      h[i] = 0;
      x[i] = range.min + (i-0.5)*binsize;
  }

  if($('#x_log').is(':checked')){
      for(i=0; i<nHalo; i++){
          h[Math.floor((Math.log(data.getValue(i, j))-range.min)/binsize)+1] += 1;
      }
  }
  else{
      for(i=0; i<nHalo; i++){
          h[Math.floor((data.getValue(i, j)-range.min)/binsize)+1] += 1;
      }
  }

  for(i=0; i<n; i++){
      hData.setCell(i, 0, x[i].toPrecision(2));
      hData.setCell(i, 1, h[i]);
  }
  hist.draw(hData, {width: 600, height: 600,
                    hAxis: {title: varName[col],
                            direction: ($('#x_rev').is(':checked')?-1:1)},
                    vAxis: {title: 'accumulated number',
                            logScale: $('#y_log').is(':checked'),
                            direction: ($('#y_rev').is(':checked')?-1:1)},
                    chartArea:{left:60,top:25,width:520,height:520},
                    legend: 'none'});
  $('#plot-hist').show();
  $('#plot').hide();
};

function loadPlot(newCol, newRow, fromHistory){
  if(newCol >= 0 && newCol < nVar && newRow >= 0 && newRow < nVar){
    col = newCol;
    row = newRow;
    if(col!=row){
      drawScatter();
    }
    else{
      drawHist();
    }
    $("#selCol > option").eq(col).attr('selected', 'selected');
    $("#selRow > option").eq(row).attr('selected', 'selected');
    genKey();
    if(!fromHistory) addHistory();
  }
};

function genKey(){
  var key = (col*nVar + row).toString() + '/';
  for(i=0; i<nHalo; i++){
    key += (selectedHalo[i])?i.toString()+'/':'';
  }
  $("#key").val(key);
};

function addHistory(){
  var num = (col*nVar + row).toString();
  if($("#history > option").eq(0).val() == num) return;
  var htmlStr = "<option value='" + num 
      + "'>(" + varName[col] + ", " + varName[row] + ")</option>" 
      + $("#history").html();
  $("#history").html(htmlStr);
};

google.setOnLoadCallback(initializeGoogle);
$(document).ready(initializeDoc);

