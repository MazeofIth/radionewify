if (location.protocol === "http:") {
  location.replace(window.location.href.replace("http:", "https:"));
}

var currentusercsv = Math.floor(Math.random() * 1000000);
if (window.localStorage.getItem("currentusercsv")) {
  currentusercsv = JSON.parse(window.localStorage.getItem("currentusercsv"));
} else {
  var promptmessage = document.getElementsByClassName("promptmessage")[0];
  promptmessage.style.display = "block";
}
window.localStorage.setItem("currentusercsv", JSON.stringify(currentusercsv));
console.log(currentusercsv);
var userid = "";
if (window.localStorage.getItem("userid")) {
  userid = JSON.parse(window.localStorage.getItem("userid"));
}
console.log(userid);
var generated = [];
if (window.localStorage.getItem("generated")) {
  generated = JSON.parse(window.localStorage.getItem("generated"));
}
var savedappbrowser = [];
if (window.localStorage.getItem("savedappbrowser")) {
  savedappbrowser = window.localStorage.getItem("savedappbrowser");
  console.log(savedappbrowser);
  document.getElementById(savedappbrowser).checked = true;
  //document.querySelector('input[name="appbrowser"]').checked = true
}
var savedautoplay = [];
console.log("savedautoplay: ", savedautoplay);
if (window.localStorage.getItem("savedautoplay")) {
  savedautoplay = window.localStorage.getItem("savedautoplay");
  console.log(savedautoplay);
  document.getElementById(savedautoplay).checked = true;
  //document.querySelector('input[name="appbrowser"]').checked = true
}
console.log($(window).width(), $(document).width());
if ($(window).width() < 500) {
  console.log("hi");
  console.log(document.getElementsByClassName("newlinehide")[0]);
  document.getElementsByClassName("newlinehide")[0].style = "display: block";
  document.getElementsByClassName("newlinehide")[1].style = "display: block";
} else if ($(window).width() < 730) {
  document.getElementsByClassName("newlinehide")[1].style = "display: block";
}
/*var savedpersonal = []
console.log("savedpersonal: ", savedpersonal)
if (window.localStorage.getItem("savedpersonal")) {
  savedpersonal = window.localStorage.getItem("savedpersonal");
  console.log(savedpersonal)
  document.getElementById(savedpersonal).checked = true
  //document.querySelector('input[name="appbrowser"]').checked = true
}*/
var buttons = document.getElementsByClassName("btn btn-primary");

if (
  window.location.href.includes("generate") &&
  !generated.includes(window.location.href)
) {
  generated.push(window.location.href);
  window.localStorage.setItem("generated", JSON.stringify(generated));
  if (window.location.href.includes("generatesong")) {
    calledDots(0);
  } else if (window.location.href.includes("generateartist")) {
    calledDots(1);
  } else if (window.location.href.includes("generateplaylist")) {
    calledDots(2);
  } else if (window.location.href.includes("generategenre")) {
    calledDots(3);
  } else if (window.location.href.includes("generatepersonal")) {
    calledDots(4);
  } else if (window.location.href.includes("generate6months")) {
    calledDots(5);
  } else if (window.location.href.includes("generatealltime")) {
    calledDots(6);
  }
  var replacewithcallback = [
    "?generatesong",
    "?generateartist",
    "?generateplaylist",
    "?generategenre",
    "?generatepersonal",
    "?generate6months",
    "?generatealltime"
  ];
  var callbackurl = window.location.href;
  for (var i = 0; i < replacewithcallback.length; i++) {
    callbackurl = callbackurl.replace(replacewithcallback[i], "callback?");
  }
  console.log(callbackurl);
  $.get(callbackurl + "&currentusercsv=" + currentusercsv, function(response) {
    window.clearInterval(dots);
    console.log(dots);
    dots = null;
    document.getElementsByTagName("img")[0].style.animation = undefined;
    setTimeout(() => {
      buttons[0].innerHTML = "Track";
      buttons[1].innerHTML = "Artist";
      buttons[2].innerHTML = "Playlist";
      buttons[3].innerHTML = "Create genre radio";
      buttons[4].innerHTML = "Month";
      buttons[5].innerHTML = "6 months";
      buttons[6].innerHTML = "All time";
    }, 340);
    if (
      JSON.stringify(
        decodeURIComponent(JSON.stringify(response.toopen))
      ).includes("playlisterror")
    ) {
      buttons[2].innerHTML =
        "Error: None of your last 50 tracks were played from a playlist";
      buttons[2].style.backgroundColor = "red";
      buttons[2].style.whiteSpace = "normal";
      setTimeout(() => {
        buttons[2].innerHTML =
          "Error: Your last track wasn't played from a playlist";
      }, 340);
    } else {
      //console.log(response)
      //console.log(JSON.stringify(response.toopen))
      //console.log(response.toopen)
      window.location.href = response.toopen;
      window.localStorage.setItem("userid", JSON.stringify(response.userid));
      //console.log(response);
      /*setTimeout(() => {
        if (document.visibilityState == "visible") {
          console.log("tab is visible");
          /*window.location.href =
            "https://open.spotify.com/playlist/" +
            response.split("playlist:")[1];
        } else {
          console.log("tab is inactive");
        }
                    }, 500);*/

      //window.open(response)
    }
  });
  //window.location.href = window.location.href.replace("?generatesong", "callback?").replace("?generateartist", "callback?").replace("?generategenre", "callback?")
} else if (generated.includes(window.location.href)) {
  history.pushState({}, null, "https://development-radionewify.glitch.me/");
  console.log(window.location.href);
}
if (window.location.href.includes("generate")) {
  history.pushState({}, null, "https://development-radionewify.glitch.me/");
  console.log(window.location.href);
}

function inputCSV() {
  console.log("csv");
  const selectedFile = document.getElementById("file-upload").files[0];
  console.log(selectedFile);
  Papa.parse(selectedFile, {
    complete: function(results) {
      var unfinishedarray = results.data;
      //  console.log("unfinishedarray:", results.data);
      /*var finishedarray = []
      var letstrysomethingelse = [
      for (var i = 1; i < unfinishedarray.length; i++) {
        finishedarray.push([unfinishedarray[i][0], unfinishedarray[i][1]])
      }
      for (var i = 1; i < unfinishedarray.length; i++) {
        letstrysomethingelse.push(unfinishedarray[i][0])
      }*/
      var lastdicttocheck = {};
      for (var i = 1; i < unfinishedarray.length; i++) {
        lastdicttocheck[unfinishedarray[i][0]] = unfinishedarray[i][1];
      }
      document.getElementsByClassName("filedisplay")[0].innerHTML =
        "You're done! Imported file: " + selectedFile.name;
      document.getElementsByClassName("filedisplay")[0].style +=
        "display: block;";
      document.getElementsByClassName("hiddenbr")[0].style =
        "display: block; content: ''; margin-top: 8px;";
      console.log(lastdicttocheck);
      //finishedarray.toString()
      //console.log(JSON.stringify(finishedarray))
      //console.log(JSON.parse(JSON.stringify(finishedarray)))
      window.localStorage.setItem("lastdicttocheck", lastdicttocheck);
      $.post("https://development-radionewify.glitch.me/csv", {
        lastdicttocheck: lastdicttocheck,
        userid: userid
      });
    }
  });
  //data = $.csv.toArrays(selectedFile);
  /*$.get(selectedFile.name, function(CSVdata) {
    data = $.csv.toArray(CSVdata);
    console.log(data)
  });*/
  //var data = $.csv.toObjects(selectedFile)
  //console.log(data)
  //window.location.href = "https://development-radionewify.glitch.me/csv"
}

var changedparameters = [];

function changeFunc(name) {
  document.getElementsByClassName(name)[0].style.background = "#1ed760";
  if (
    document.querySelector('input[name="' + name + '"]:checked').value ==
    "Undefined"
  ) {
    document.getElementsByName(name)[2].checked = true;
  }
  changedparameters.push(name);
}

function undefinedFunc(name) {
  var index = changedparameters.indexOf(name);
  if (index !== -1) {
    changedparameters.splice(index, 1);
  }
  document.getElementsByClassName(name)[0].style.background = "#707070";
}

/*var exampleSocket = new WebSocket("wss://development-radionewify.glitch.me");

exampleSocket.onmessage = function(event) {
  console.log(event.data);
}*/

function autoplayFunc() {
  var autoplay = document.querySelector('input[name="autoplay"]:checked').value;
  window.localStorage.setItem("savedautoplay", autoplay);
}

function appbrowserFunc() {
  var appbrowser = document.querySelector('input[name="appbrowser"]:checked')
    .value;
  window.localStorage.setItem("savedappbrowser", appbrowser);
}

function apiParameters(typetogenerate = null) {
  var cg = document.getElementsByClassName("config");
  var appbrowser = document.querySelector('input[name="appbrowser"]:checked')
    .value;
  var autoplay = document.querySelector('input[name="autoplay"]:checked').value;
  console.log("appbrowser: ", appbrowser);
  console.log("autoplay: ", autoplay);
  //*10?
  var parameters = "";
  var targets = [
    "&target_popularity=",
    seedparameter,
    "&target_valence=",
    "&target_tempo=",
    "&target_acousticness=",
    "&target_danceability=",
    "&target_energy=",
    "&target_instrumentalness=",
    "&target_key=",
    "&target_liveness=",
    "&target_loudness=",
    "&target_mode=",
    "&target_speechiness=",
    "&target_time_signature="
  ];
  console.log(targets[13]);
  var maxes = [
    "&max_popularity=",
    seedparameter,
    "&max_valence=",
    "&max_tempo=",
    "&max_acousticness=",
    "&max_danceability=",
    "&max_energy=",
    "&max_instrumentalness=",
    "&max_key=",
    "&max_liveness=",
    "&max_loudness=",
    "&max_mode=",
    "&max_speechiness=",
    "&max_time_signature="
  ];
  var minis = [
    "&min_popularity=",
    seedparameter,
    "&min_valence=",
    "&min_tempo=",
    "&min_acousticness=",
    "&min_danceability=",
    "&min_energy=",
    "&min_instrumentalness=",
    "&min_key=",
    "&min_liveness=",
    "&min_loudness=",
    "&min_mode=",
    "&min_speechiness=",
    "&min_time_signature="
  ];
  var minmaxtarget = {
    popularity: document.querySelector('input[name="popularity"]:checked')
      .value,
    valence: document.querySelector('input[name="valence"]:checked').value,
    tempo: document.querySelector('input[name="tempo"]:checked').value,
    acousticness: document.querySelector('input[name="acousticness"]:checked')
      .value,
    danceability: document.querySelector('input[name="danceability"]:checked')
      .value,
    energy: document.querySelector('input[name="energy"]:checked').value,
    instrumentalness: document.querySelector(
      'input[name="instrumentalness"]:checked'
    ).value,
    key: document.querySelector('input[name="key"]:checked').value,
    liveness: document.querySelector('input[name="liveness"]:checked').value,
    loudness: document.querySelector('input[name="loudness"]:checked').value,
    speechiness: document.querySelector('input[name="speechiness"]:checked')
      .value,
    "time signature": document.querySelector(
      'input[name="time signature"]:checked'
    ).value,
    modehmm: document.querySelector('input[name="modehmm"]:checked').value
  };
  console.log(minmaxtarget);
  var corresponding = {
    0: "popularity",
    1: "seed",
    2: "valence",
    3: "tempo",
    4: "acousticness",
    5: "danceability",
    6: "energy",
    7: "instrumentalness",
    8: "key",
    9: "liveness",
    10: "loudness",
    11: "mode",
    12: "speechiness",
    13: "time signature"
  };
  //var undefinedvalues = ["50", "undefined", "0.5", "120", "0.5", "0.5", "450000", "0.5", "0.5", undefined, "0.5", "-15", undefined, "0.5", "5"]
  try {
    var selectedkey = document.querySelector('input[name="drone"]:checked')
      .value;
  } catch (error) {
    console.log("no key");
  }
  try {
    var selectedmode = document.querySelector('input[name="mode"]:checked')
      .value;
  } catch (error) {
    console.log("no key");
  }
  var values = [
    cg[0].value,
    seedparameter,
    cg[1].value,
    cg[2].value,
    cg[3].value,
    cg[4].value,
    cg[5].value,
    cg[6].value,
    selectedkey,
    cg[7].value,
    cg[8].value,
    selectedmode,
    cg[9].value,
    cg[10].value
  ];
  for (var i = 0; i < values.length; i++) {
    if (changedparameters.includes(corresponding[i])) {
      console.log(values[i]);
      console.log(i);
      console.log(targets[i]);
      if (minmaxtarget[corresponding[i]] == "Max") {
        console.log("max");
        var hmmmm = maxes[i];
      } else if (minmaxtarget[corresponding[i]] == "Min") {
        console.log("min");

        var hmmmm = minis[i];
      } else if (minmaxtarget[corresponding[i]] == "Target") {
        console.log("target");

        var hmmmm = targets[i];
      }
      console.log(hmmmm);
      if (values[i].includes("Major")) {
        parameters += hmmmm + 0;
      } else if (values[i].includes("Minor")) {
        parameters += hmmmm + 1;
      } else if (values[i].includes("seed_genres")) {
        parameters += values[i];
      } else {
        parameters += hmmmm + values[i];
      }
    }
  }
  if (
    !parameters.includes("popularity") &&
    document.querySelector('input[name="popularity"]:checked').value !==
      "Undefined"
  ) {
    parameters += "&max_popularity=60";
  }
  if (!parameters.includes("currentusercsv")) {
    parameters += "&currentusercsv=" + currentusercsv;
  }
  if (!parameters.includes("appbrowser")) {
    parameters += "&appbrowser=" + appbrowser;
  }
  if (!parameters.includes("autoplay")) {
    parameters += "&autoplay=" + autoplay;
  }
  if (typetogenerate == 0) {
    parameters += "&generatesong=0";
  } else if (typetogenerate == 1) {
    parameters += "&generateartist=0";
  } else if (typetogenerate == 2) {
    parameters += "&generateplaylist=0";
  } else if (typetogenerate == 3) {
    parameters += "&generategenre=0";
  } else if (typetogenerate == 4) {
    parameters += "&generatepersonal=0&typeofpersonal=" + personal;
  } else if (typetogenerate == 5) {
    parameters += "&generate6months=0&typeofpersonal=" + personal;
  } else if (typetogenerate == 6) {
    parameters += "&generatealltime=0&typeofpersonal=" + personal;
  }
  parameters = parameters.substring(1);
  console.log(parameters);
  console.log(selectedkey);
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].href = "/login?" + parameters;
    console.log(buttons[i].href);
  }
  return "/login?" + parameters;
}

function durationParameter() {
  var seconds = document.getElementsByClassName("config")[5].value;
  var minutes = Math.floor(seconds / 60000);
  var remainingseconds = seconds - minutes * 60000;
  if (remainingseconds < 10000) {
    remainingseconds = "0" + remainingseconds.toString();
  }
  document.getElementsByClassName("durationclass")[0].value =
    minutes +
    ":" +
    remainingseconds
      .toString()
      .substring(0, remainingseconds.toString().length - 3);
}

function dBParameter() {
  var decibels = document.getElementsByClassName("decibels")[0].value;
  document.getElementsByClassName("decibels")[0].value =
    decibels.toString() + "dB";
}

function bpmChange() {
  var bpm = document.getElementsByClassName("bpm")[0].value;
  document.getElementsByClassName("bpm")[0].value = bpm.toString() + "BPM";
}
var seedparameter = "";

if (window.localStorage.getItem("savedgenre")) {
  savedgenre = JSON.parse(window.localStorage.getItem("savedgenre"));
  document.getElementById("genres").value = savedgenre;
}

function saveGenreFunc() {
    window.localStorage.setItem(
    "savedgenre",
    JSON.stringify(document.getElementById("genres").value)
  );
}

function realGenreFunc() {
  var formattedgenre = document
    .getElementById("genres")
    .value.toLowerCase()
    .replaceAll(" ", "-");
  window.localStorage.setItem(
    "savedgenre",
    JSON.stringify(document.getElementById("genres").value)
  );
  seedparameter = "&seed_genres=" + formattedgenre;
  console.log(seedparameter);
  changedparameters.push("seed");
}
/*document.getElementById("genres").onchange = function genreFunction() {
  realGenreFunc()
};*/

var loadinginitialized = false;

function calledDots(buttonnumber) {
  if (!loadinginitialized) {
    buttons[buttonnumber].innerHTML = "Creating radio";
    dots = window.setInterval(function() {
      if (buttons[buttonnumber].innerHTML.length > "Creating radio".length + 2)
        buttons[buttonnumber].innerHTML = "Creating radio";
      else buttons[buttonnumber].innerHTML += ".";
    }, 333.333);
  }
  loadinginitialized = true;
  var newifyimage = document.getElementsByTagName("img")[0];
  newifyimage.style.animation = "rotation 2s infinite linear";
  console.log(newifyimage);
}
console.log(buttons);
buttons[0].onclick = function() {
  changedparameters.splice(changedparameters.indexOf("seed"), 1);
  apiParameters(0);
};
buttons[1].onclick = function() {
  changedparameters.splice(changedparameters.indexOf("seed"), 1);
  apiParameters(1);
};
buttons[2].onclick = function() {
  changedparameters.splice(changedparameters.indexOf("seed"), 1);
  apiParameters(2);
};
buttons[3].onclick = function() {
  realGenreFunc();
  apiParameters(3);
};
var personal = undefined;
buttons[4].onclick = function() {
  changedparameters.push("personal");
  personal = "month";
  apiParameters(4);
};
buttons[5].onclick = function() {
  changedparameters.push("personal");
  personal = "6months";
  apiParameters(5);
};
buttons[6].onclick = function() {
  changedparameters.push("personal");
  personal = "alltime";
  apiParameters(6);
};
if (window.location.href.includes("?track")) {
  changedparameters.splice(changedparameters.indexOf("seed"), 1);
  window.location.href = apiParameters(0);
}
if (window.location.href.includes("?artist")) {
  changedparameters.splice(changedparameters.indexOf("seed"), 1);
  window.location.href = apiParameters(1);
}
if (window.location.href.includes("?playlist")) {
  changedparameters.splice(changedparameters.indexOf("seed"), 1);
  window.location.href = apiParameters(2);
}
if (window.location.href.includes("?genre")) {
  realGenreFunc();
  apiParameters(3);
}
var personal = undefined;
if (window.location.href.includes("?month")) {
  changedparameters.push("personal");
  personal = "month";
  apiParameters(4);
}
if (window.location.href.includes("?6months")) {
  changedparameters.push("personal");
  personal = "6months";
  apiParameters(5);
}
if (window.location.href.includes("?alltime")) {
  changedparameters.push("personal");
  personal = "alltime";
  apiParameters(6);
}

var modals = document.getElementsByClassName("modal");
var btns = document.getElementsByClassName("myBtnClass");
var spans = document.getElementsByClassName("close");

/*for (var i = 0; i < btns.length; i++) {
  btns[i].onclick = function(i) {
    modals[i].style.display = "block";
  };
}*/

btns[0].onclick = function() {
  modals[0].style.display = "block";
};

btns[1].onclick = function() {
  modals[1].style.display = "block";
};

btns[2].onclick = function() {
  modals[2].style.display = "block";
};

btns[3].onclick = function() {
  modals[3].style.display = "block";
};

for (var i = 0; i < spans.length; i++) {
  spans[i].onclick = function() {
    for (var i = 0; i < modals.length; i++) {
      modals[i].style.display = "none";
    }
  };
}

// When the user clicks anywhere outside of the modal, close it
function hideOnClick(event) {
  for (var i = 0; i < modals.length; i++) {
    if (event.target == modals[i]) {
      modals[i].style.display = "none";
    }
  }
}
window.onclick = function(event) {
  hideOnClick(event);
};

document.querySelector("body").onclick = function(event) {
  hideOnClick(event);
};

/*const socket = io("/");

socket.on("connect", () => {
  //socket.send("Hello!");
});

// handle the event sent with socket.send()
socket.on("message", data => {
  console.log(data);
});*/
