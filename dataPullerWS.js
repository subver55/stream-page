var scoreboardDataWsUrl = "ws://192.168.1.115:10310";
var currentTimeDiv=null;
var resultsDataRow=null;
var resultsTable=null;

var dataUpdated="";
var raceName=null;
var runName=null;
var runParam=null;
var bestLapName = null;
var bestLapTime = null;
var footerFlags = null;
var wsScoreboard = null;
var finishType = 0;
var sortMode = 0;
var bestLapCompetitorId = -1;
function connectWs()
{
  wsScoreboard = new WebSocket(scoreboardDataWsUrl);
  wsScoreboard.onopen= function(e){
    var dataSet=["pos","num","competitor_state","name",
"best_lap_time","last_lap_time_1","laps_count","diff"];
    wsScoreboard.send(JSON.stringify(dataSet));
  };
  wsScoreboard.onmessage =function(event){
    var json = JSON.parse(event.data);
    reloadData(json);
    if(!isEmpty(json["weather"]))
    {
      if(typeof reloadWeather!=="undefined")
      {
        reloadWeather(json["weather"]);
      }
    }
  };
  wsScoreboard.onclose = function(e){
    setTimeout(function(){
      connectWs();
    },2000);
  };

}
function bodyLoaded()
{
    currentTimeDiv = document.getElementById('current_time');
    setInterval(updateCurrentTime,1000);
    resultsTable = document.getElementById("resultsTable");
    resultsDataRow = resultsTable.querySelector("#dataRow");
    raceName = document.getElementById("race_name");
    runName  = document.getElementById("run_name");
    runParam = document.getElementById("run_param");
    bestLapName = document.getElementById("total_best_lap_name");
    bestLapTime = document.getElementById("total_best_lap_time");
    footerFlags = document.getElementsByClassName("footerFlags");
    var rows = resultsTable.getElementsByClassName("dataRow");
    for(let row of rows)
    {
      row.remove();
    }


    //pullData("reload");
    /*
    if(typeof initWeatherWidget !== "undefined")
    {
      initWeatherWidget();
    }*/
    connectWs();
}

function updateCurrentTime()
{
  var date = new Date();
  time = date.toLocaleTimeString();
  if(currentTimeDiv!=null)
  {
    currentTimeDiv.innerHTML = time;
  }
}
function addClass(el,classnm)
{
  if(el==null)
  {
    return;
  }
  arr = el.className.split(" ");
  if(arr.indexOf(classnm)==-1)
  {
    el.className+=" "+classnm;
  }
}
function removeClass(el,classnm)
{
   arr = el.className.split(" ");
   index = arr.indexOf(classnm);
   if(index>=0)
   {
     arr.splice(index,1);
   }
   el.className = arr.join(" ");
}
function hasClass(el,classnm)
{
  arr = el.className.split(" ");
  index = arr.indexOf(classnm);
  if(index>=0)
  {
    return true;
  }
  return false;
}

function formatRaceTime(val)
{
  hours= Math.floor(val/3600000);
  if(hours<10)
  {
    hours="0"+hours;
  }
  minutes=Math.floor((val%3600000)/60000);
  if(minutes<10)
  {
    minutes="0"+minutes;
  }
  seconds =Math.floor((val%60000)/1000);
  if(seconds<10)
  {
    seconds = "0"+seconds;
  }
  return hours+":"+minutes+":"+seconds;
}
function formatLapTime(val)
{
  if(isNaN(val))
  {
    return "";
  }
  if(val==0)
  {
    return "";
  }
  var s="";
  var hours="";
  var minutes="";
  var h=0;
  var m=0;
  var s=0;
  if(val>=3600000)
  {
    h =  Math.floor(val/3600000);
    hours = h+":"
  }
  if(val>=60000)
  {
    m = Math.floor((val%3600000)/60000);
    minutes=m+":";
    if(h>0 && m<10)
    {
      minutes = "0"+minutes;
    }
  }
  s = (val%60000)/1000;
  var seconds = parseFloat((val%60000)/1000).toFixed(3)+"";
  if(m>0 && s<10)
  {
    seconds="0"+seconds;
  }
  return hours+minutes+seconds;
}
function formatDiff(val)
{
  if(val==0)
  {
    return "";
  }
  if(val<=-100000)
  {
    return "+"+(-val/100000)+" сект.";
  }
  if(val<0)
  {
    return "+"+(-val)+" кр.";
  }
  return "+"+formatLapTime(val);
}
function formatLaps(val)
{
  if(val>0)
  {
    return val;
  }
  return "";
}
function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}


function reloadData(json)
{
  refresh = json["refresh"];
  update = json["update"];
  if(!isEmpty(refresh))
  {
    if(runName!=null)
    {
      runName.innerHTML =  refresh["runName"];
    }
    finishType = refresh["finishType"];
    var runParamStr = formatRaceTime(refresh["elapsedTime"]);
    if(finishType!=null)
    {
        if(finishType==2)// finish by time
        {
          runParamStr = formatRaceTime(refresh["timeToGo"]);
        }
        else if(finishType==1)
        {
          var lapsToGo = refresh["lapsToGo"];
          var totalLaps = refresh["finishParam"];
          var currentLap = totalLaps-lapsToGo+1;
          if(currentLap>totalLaps)
          {
            currentLap = totalLaps;
          }
          runParamStr = currentLap+"/"+totalLaps;
        }
    }
    if(runParam!=null)
    {
      runParam.innerHTML = runParamStr;
    }
    var flagState = refresh["flagState"];
    if(flagState==3)
    {
      addClass(runParam,"finished");
    }
    else {
      removeClass(runParam,"finished");
    }
  }
  if(!isEmpty(update))
  {
    var prevSortMode = sortMode;
    sortMode = update["sortMode"];
    if(prevSortMode!=sortMode)
    {
      if(sortMode==1)
      {
        var p = document.getElementById("bestLap");
        if(p!=null)
        {
          p.innerHTML = "Отстав.";
        }
      }
      else {
        var p = document.getElementById("bestLap");
        if(p!=null)
        {
          p.innerHTML = "Лучш.<br> круг";
        }
      }
      prevSortMode = sortMode;
    }

    if(json["command"]=="clear")
    {
      var nodes = resultsTable.querySelectorAll(".dataRow");
      if(nodes!=null)
      {
        for(let node of nodes)
        {
          node.remove();
        }
      }
      return;
    }

    blTime = update["bestLapTime"];
    blName = update["bestLapName"];
    if(blName==null || blTime==0 || blTime==null)
    {
      blName="";
    }
    if(bestLapName!=null)
    {
      bestLapName.innerHTML = blName;
    }
    if(bestLapTime!=null)
    {
      bestLapTime.innerHTML =  formatLapTime(update["bestLapTime"]);
    }
    results = update["results"];
    updateResults(results)
  }
}
function updateResults(results)
{
  if(results!=null)
  {
    var currentRowCount = resultsTable.children.length-1;
    var newRowCount = 0;
    for(i=0;i<results.length;i++)
    {
      var pos = results[i]["pos"][0];
      if(pos!=null)
      {
        if(pos>newRowCount)
        {
          newRowCount = pos;
        }
      }
    }
    if(currentRowCount<newRowCount)
    {
      for(i=currentRowCount;i<newRowCount;i++)
      {

        var newRow = resultsDataRow.cloneNode(true);
        if((i+1)&0x01)
        {
            addClass(newRow,"oddRow");
        }
        else
        {
            removeClass(newRow,"oddRow");
        }
        resultsTable.appendChild(newRow);
      }
    }
    if(results.length>0)
    {
      for(let resultItem of results)
      {
        //resultItem = results[i];
        okeys = Object.keys(resultItem);
        var pos = resultItem["pos"][0];
        var competitorId = resultItem["competitor_id"];
        if(pos==null)
        {
          continue;
        }
        var row = resultsTable.querySelector(".compid"+competitorId);
        if(row==null)
        {
          row = resultsTable.children[pos];
          addClass(row,"compid"+competitorId);
        }
        else {
          var oldPos = -1;
          for(i=1;i<resultsTable.children.length;i++)
          {
            if(row==resultsTable.children[i])
            {
              oldPos = i;
              break;
            }
          }
          if(oldPos!=pos)
          {
            row.remove();
            resultsTable.insertBefore(row,resultsTable.children[pos]);
            for(i=1;i<resultsTable.children.length;i++)
            {
              var r = resultsTable.children[i];
              if((i%2) == 0)
              {
                removeClass(r,"oddRow");
              }
              else
              {
                  addClass(r,"oddRow");
              }
              var p = r.querySelector("#pos");
              if(p!=null)
              {
                p.innerHTML = i;
              }
            }
          }
        }
        var cells = row.children;
        for(key in okeys)
        {
          var keyval = okeys[key];
          el = cells[keyval];
          if(el!=null)
          {
            val = resultItem[okeys[key]][0];
            attr = resultItem[okeys[key]][1];
            if(val!=null)
            {
              if(keyval=="best_lap_time")
              {
                if(sortMode==1)
                {
                  val = resultItem["diff"][0];
                  el.innerHTML = formatDiff(val);
                  continue;
                }
              }
              if(hasClass(el,"diff"))
              {
                el.innerHTML = formatDiff(val);
              }
              else if(hasClass(el,"lapTime"))
              {
                el.innerHTML = formatLapTime(val);
              }
              else if(hasClass(el,"laps"))
              {
                el.innerHTML = formatLaps(val);
              }
              else
              {
                if(okeys[key]=="pos")
                {
                  if(resultItem["pos_change"]!=null)
                  {
                    if(resultItem["pos_change"][0]!=null)
                    {
                      ch = resultItem["pos_change"][0];
                      el.className = "resultsCell";
                      if(ch<0)
                      {
                        addClass(el,"posWin");
                      }
                      if(ch>0)
                      {
                        addClass(el,"posLost");
                      }
                    }
                  }
                }
                if(resultItem["competitor_state"]!=null)
                {
                  if(resultItem["competitor_state"][0]==1)
                  {
                    el.className = "resultsCell competitorFinished"
                  }
                }
                if(okeys[key]=="num")
                {
                  if(resultItem["short_class_name"]!=null)
                  {
                    if(resultItem["short_class_name"][0]!=null)
                    {
                      val = val+""+resultItem["short_class_name"][0];
                    }
                  }
                }
                el.innerHTML = val;
              }
            }
            else
            {
              el.innerHTML = "";
            }
            removeClass(el,"personalBest");
            removeClass(el,"totalBest");
            if(attr!=null)
            {
              addClass(el,attr);
            }
          }
        }
      }
    }
  }
  var lastPassings = update["lastPassings"];
  if(lastPassings!=null)
  {
    //console.log(lastPassings);
    lastPassings.forEach(passing => {
      var compId = passing["competitor_id"];
      if(compId!=null)
      {
        var row = resultsTable.querySelector(".compid"+compId);
        cells = row.children;
        var passingType = passing["pass_type"];
        if(passingType!=null)
        {
          el = cells[passingType];
          if(el!=null)
          {
            blink(el);
          }
        }
        var posChange = passing["posChange"];
        if(posChange!=null)
        {
          el = cells["pos"];
          if(el!=null)
          {
        //    if(el.hasClass("bestLapPos")==false)
            {
              el.className = "resultsCell";
              if(posChange<0)
              {
                addClass(el,"posWin");
              }
              else if(posChange>0)
              {
                addClass(el,"posLost");
              }
            }
          }
        }
      }
    });
  }
  var bCompId = update["bestLapCompId"];
  if(bCompId!=null)
  {
    if(bCompId!=bestLapCompetitorId)
    {
        bestLapCompetitorId = bCompId;
        var poscells = resultsTable.querySelectorAll(".resultsCell#pos");
        for(let p of poscells)
        {
          removeClass(p,"bestLapPos");
        }
        var row = resultsTable.querySelector(".compid"+bestLapCompetitorId);
        if(row!=null)
        {
          var pos = row.querySelector("#pos");
          if(pos!=null)
          {
            pos.className = "resultsCell bestLapPos"
          }
        }
    }
  }
}

function rmBlink(p)
{
  p.classList.remove("blink");
}
function blink(p)
{
  p.classList.add("blink");
  setTimeout(rmBlink,1000,p);
}