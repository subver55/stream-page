var scoreboardDataWsUrl = "ws://localhost:10310";

var divRunName=null;
var divRunParam=null;
var divRaceName=null;
var divRaceDate=null;

function connectWs()
{
  wsScoreboard = new WebSocket(scoreboardDataWsUrl);
  wsScoreboard.onopen= function(e){
    var dataSet=["pos","pos_change","num","name","last_lap_time_1","best_lap_time","gap"];
    wsScoreboard.send(JSON.stringify(dataSet));
  };
  wsScoreboard.onmessage =function(event){
    var json = JSON.parse(event.data);
    refreshData(json);
  };
  wsScoreboard.onclose = function(e){
    setTimeout(function(){
      connectWs();
    },2000);
  };
}

function refreshData(json)
{
  var refresh=json["refresh"];
  if(refresh!=null)
  {
    refreshRunInfo(refresh);
  }
}

function refreshRunInfo(json)
{
  if(divRunName!=null)
  {
      divRunName.innerHTML = json["runName"];
  }
  if(divRunParam!=null)
  {
    divRunParam.innerHTML = formatRunParam(json);
  }
  if(divRaceName!=null)
  {
    divRaceName.innerHTML = json["eventName"];
  }
  if(divRaceDate!=null)
  {
    divRaceDate.innerHTML = formatCurrentDate();
  }
}
function formatCurrentDate()
{
  var months=[
    "Января",
    "Февраля",
    "Марта",
    "Апреля",
    "Мая",
    "Июня",
    "Июля",
    "Августа",
    "Сентября",
    "Октября",
    "Ноября",
    "Декабря"
  ];
  var d = new Date();
  return d.getDay()+" "+months[d.getMonth()]+" "+d.getFullYear();
}
function formatRunParam(json)
{
  if(json["finishType"]==0)
  {
    return formatRaceTime(json["elapsedTime"]);
  }
  if(json["finishType"]==2)
  {
    return formatRaceTime(json["timeToGo"]);
  }
  if(json["finishType"]==1)
  {
    return formatRaceLaps(json["lapsToGo"],json["totalLaps"]);
  }
}
function formatRaceLaps(lapsToGo,totalLaps)
{
  return lapsToGo;
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

function bodyLoaded()
{
  divRunName = document.getElementById("runName");
  divRunParam = document.getElementById("runParam");
  divRaceName = document.getElementById("raceName");
  divRaceDate = document.getElementById("raceDate");
  connectWs();
}
function rmBlink(p)
{
  p.classList.remove("blink");
}
function blink()
{
  var p = document.getElementById("bestLap");
  p.classList.add("blink");
  setTimeout(rmBlink,600,p);
}
