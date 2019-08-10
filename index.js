
var currentLat, currentLong, getLocationUrl, currentCity, currentRegion;
var todayDD = new Date().getDate();

navigator.geolocation.getCurrentPosition(success);
function success(pos){
	currentLat = pos.coords.latitude;//23.055310;   //23.184047;  //22.977761;
  currentLong = pos.coords.longitude; //121.167953;  //120.242576;  //120.220111;
  getLocationUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places/"+ currentLong + "," + currentLat + ".json?language=zh-Hant&access_token=pk.eyJ1Ijoid2VuY2hpdSIsImEiOiJjanh2b2hraHAwNW80M2JrZHFkanBmZGtqIn0.xPJ3QUe41GZXPtVGbFZAyw";
  presentLocation();
}

function presentLocation() {
  var currentLocation = fetch(getLocationUrl);
  var currentLocation2 = currentLocation.then(function (res) {
    return res.json();
  })
  currentLocation2.then(function(location) {
    var loc = document.getElementById("location");
    location.features.forEach(function (e) {
      if (e.place_type[0] === "region") {
        currentCity = e.text;
      }
      if (e.place_type[0] === "place") {
        currentRegion = e.text;
      }
    })
    loc.textContent = "現在位置：" + currentCity + " "+ currentRegion;
    getForecastData();
    presentCurrentObs();
    getAQI();
  });
}

var arrObsInCity = [], arrObsInCityD = [], arrObsInCityTemp = [];
var nearStation, nearTemp;
var currentWeatherImage, currentWeather, currentTemp, currentAQI, currentPoP, currentUVI;
var nowWxImage, nowWx, nowPoP, nowUVI;
var getCurrentAutoObsUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
var getCurrentManObsUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
function presentCurrentObs() {
	// get auto-observation data into city/county array
	var currentAutoObs = fetch(getCurrentAutoObsUrl)
	.then(function (res) {
    return res.json();
  })
	.then(function (allstation) {
		return getStationInCity(allstation.records.location);
  })
// get manual-observation data into city/county array
	var currentManObs = fetch(getCurrentManObsUrl)
  .then(function (res) {
    return res.json();
  })
	.then(function (allstation) {
		getCurrentUVI(allstation);
		return getStationInCity(allstation.records.location);
  })
	Promise.all([currentAutoObs, currentManObs])
	.then(function (values) {
		var arrboth = values[0].concat(values[1]);
		getNearestStation(arrboth);
	})
	// Select the stattions in current city
	function getStationInCity(arrAll) {
		var arrObsInCityTemp = [];
		for (var i = 0; i < arrAll.length; i++) {
			if (arrAll[i].parameter[0].parameterValue === currentCity) {
				arrObsInCityTemp.push([arrAll[i].lat, arrAll[i].lon, arrAll[i].locationName, arrAll[i].weatherElement[3].elementValue]);
			}
		}
		return arrObsInCityTemp;
	}

  // get the nearest station (in both auto & manual stations) temp data
  function getNearestStation(arrObsInCity) {
    for (var i = 0; i < arrObsInCity.length; i++) {
      d = Math.pow(arrObsInCity[i][0]-currentLat, 2) + Math.pow(arrObsInCity[i][1]-currentLong, 2);
      arrObsInCityD.push(d);
    }
    nearStation = arrObsInCity[arrObsInCityD.indexOf(Math.min(...arrObsInCityD))][2];
    nearTemp = arrObsInCity[arrObsInCityD.indexOf(Math.min(...arrObsInCityD))][3];
    console.log(nearStation, nearTemp);
    currentTemp = document.getElementById("current-temp");
    div = document.createElement("div");
    div.innerHTML = Math.round(nearTemp) + '&#8451';
    div.classList.add("current-temp-text") ;
    currentTemp.append(div)
  }
}

var arrManStationInCity = [], arrManStationInCityD = [];
var nearManStation, nearUVI;

function getCurrentUVI(allstation) {
  var arrManStation = allstation.records.location;
  for (var i = 0; i < arrManStation.length; i++) {
    if (arrManStation[i].parameter[0].parameterValue === currentCity) {
      arrManStationInCity.push([arrManStation[i].lat, arrManStation[i].lon, arrManStation[i].locationName, arrManStation[i].weatherElement[13].elementValue]);
    }
  }
  for (var i = 0; i < arrManStationInCity.length; i++) {
    d = Math.pow(arrManStationInCity[i][0]-currentLat, 2) + Math.pow(arrManStationInCity[i][1]-currentLong, 2);
    arrManStationInCityD.push(d);
  }
  nearManStation = arrManStationInCity[arrManStationInCityD.indexOf(Math.min(...arrManStationInCityD))][2];
  nearUVI = parseInt(arrManStationInCity[arrManStationInCityD.indexOf(Math.min(...arrManStationInCityD))][3]);
  currentUVI = document.getElementById("current-UVI");
  div1 = document.createElement("div");
  div2 = document.createElement("div");
  switch (nearUVI) {
    case -99 || 0 || 1 || 2:
      div2.innerHTML = "低量級";
      break;
    case 3 || 4 || 5:
      currentUVI.classList.add("level-mid");
      div2.innerHTML = "中量級";
      break;
    case 6 || 7:
      currentUVI.classList.add("level-high");
      div2.innerHTML = "高量級";
      break;
    case 8 || 9 || 10:
      currentUVI.classList.add("level-over");
      div2.innerHTML = "過量級";
      break;
    case ( (nearUVI>10) ? nearUVI : -1 ):
      currentUVI.classList.add("level-danger");
      div2.innerHTML = "危險級";
      break;
    default:
      div2.innerHTML ="發生錯誤";
  }
  if (nearUVI === -99) {
    div1.innerHTML = 0;
  } else {
    div1.innerHTML = nearUVI;
  }
  div1.classList.add("current-AQI-text");
  currentUVI.append(div1, div2);
}

var getCurrentAQIUrl = "https://opendata.epa.gov.tw/api/v1/AQI?%24skip=0&%24top=1000&%24format=json";
var arrAQIInCity = [], arrAQIInCityD = [];
var nearAQIStation, nearAQI, nearAQIStatus, currentAQI;
function getAQI() {
  var AQI = fetch(getCurrentAQIUrl).then(function (res) {
    return res.json();
  })
  AQI.then(function (res) {
    for (var i = 0; i < res.length; i++) {
      if (res[i].County === currentCity ) {
        if (res[i].AQI !== "") {
          arrAQIInCity.push(res[i]);
        }
      }
    }
    for (var i = 0; i < arrAQIInCity.length; i++) {
      d = Math.pow(arrAQIInCity[i].Latitude - currentLat, 2) + Math.pow(arrAQIInCity[i].Longitude - currentLong, 2);
      arrAQIInCityD.push(d);
    }
    nearAQIStation = arrAQIInCity[arrAQIInCityD.indexOf(Math.min(...arrAQIInCityD))].SiteName;
    nearAQI = arrAQIInCity[arrAQIInCityD.indexOf(Math.min(...arrAQIInCityD))].AQI;
    nearAQIStatus = arrAQIInCity[arrAQIInCityD.indexOf(Math.min(...arrAQIInCityD))].Status;
    console.log(nearAQIStation, nearAQI, nearAQIStatus);
    currentAQI = document.getElementById("current-AQI");
    div1 = document.createElement("div");
    div2 = document.createElement("div");
    switch (nearAQIStatus) {
      case "普通":
        currentAQI.classList.add("level-mid");
        break;
      case "對敏感族群不健康":
        currentAQI.classList.add("level-high");
        break;
      case "對所有族群不健康":
        currentAQI.classList.add("level-over");
        break;
      case "非常不健康":
        currentAQI.classList.add("level-danger");
        break;
      case "危害":
        currentAQI.classList.add("level-damage");
        break;
      default:
        div2.textContent = "發生錯誤"
    }
    div1.textContent = nearAQI;
    div1.classList.add("current-AQI-text");
    div2.textContent = nearAQIStatus;
    currentAQI.append(div1, div2);
  })
}


var getforecast48hrUrl, getforecast7dUrl, regionforecast48hr, regionforecast7d;

var forecastTime48hr, forecastTemp48hr, forecastWx48hr, forecastPoP6h48hr;
var arr48hrTime = [];
var arr48hrTemp = [];
var arr48hrPoP6h = [];
var arr48hrWx = [], arrTempHours = [];

var forecastDate7d, forecastWx7d, forecastmaxT7d, forecastminT7d;
var arr7dDateTemp;
var arr7dDate = [];
var arr7dWx = [];
var arr7dmaxT = [];
var arr7dminT = [];

var CLEAR = 0;
var CLEAR_CLOUDY = 1;
var CLOUDY = 2;
var CLOUDY_RAIN = 3;
var CLEAR_CLOUDY_RAIN = 4;
var CLOUDY_THUNDER = 5;
var CLEAR_CLOUDY_THUNDER = 6;
var CLOUDY_SNOW = 7;
var CLOUDY_FOG = 8;
var CLEAR_CLOUDY_FOG = 9;
var SNOW = 10;

var WEATHER_CODE = [
  [[1, 2], CLEAR],
  [[3], CLEAR_CLOUDY],
  [[4, 5, 6, 7], CLOUDY],
  [[8, 9, 10, 11, 12, 13, 14], CLOUDY_RAIN],
  [[15, 16, 17, 18], CLOUDY_THUNDER],
  [[19], CLEAR_CLOUDY_RAIN],
  [[20], CLOUDY_RAIN],
  [[21], CLEAR_CLOUDY_THUNDER],
  [[22], CLOUDY_THUNDER],
  [[23], CLOUDY_SNOW],
  [[24, 25], CLEAR_CLOUDY_FOG],
  [[26, 27, 28], CLOUDY_FOG],
  [[29, 30, 31, 32], CLOUDY_RAIN],
  [[33, 34, 35, 36], CLOUDY_THUNDER],
  [[37, 38, 39], CLOUDY_RAIN],
  [[41], CLOUDY_THUNDER],
  [[42], SNOW],
];

function getWeatherCode(arr, target) {
  var L = 0, R = arr.length-1;
  while (L <= R) {
    var M = Math.floor((L + R)/2);
    if (arr[M][0][0] === target) {
      return arr[M][1];
    } else if (arr[M][0][0] > target) {
      R = M - 1;
    } else {
      if (arr[M][0].indexOf(target) === -1) {
        L = M + 1;
      } else {
        return arr[M][1];
      }
    }
  }
}

function getForecastData() {
  switch (currentCity) {
    case "宜蘭縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-001?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-003?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "桃園市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-005?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-007?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "新竹縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-009?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-011?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "苗栗縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-013?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-015?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "彰化縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-017?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-019?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "南投縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-021?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-023?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "雲林縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-025?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-027?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "嘉義縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-029?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-031?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "屏東縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-033?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-035?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "臺東縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-037?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-039?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "花蓮縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-041?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-043?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "澎湖縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-045?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-047?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "基隆市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-049?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-051?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "新竹市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-053?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-055?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "嘉義市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-057?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-059?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "臺北市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-061?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-063?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "高雄市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-065?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-067?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "新北市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-069?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-071?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "臺中市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-073?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-075?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "臺南市":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-077?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-079?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "連江縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-081?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-083?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    case "金門縣":
      getforecast48hrUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-085?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      getforecast7dUrl = "https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-D0047-087?Authorization=CWB-06FAD906-0869-4F4D-8A7C-1BB80EAC6A2F"
      break;
    default:
      console.log("No Data.");
  }
  forecast48hr();
  forecast7d();
}

function forecast48hr() {
  var forecast48hr = fetch(getforecast48hrUrl);
  var forecast48hr2 = forecast48hr.then(function (res) {
    return res.json();
  })
  forecast48hr2.then(function (regionsData) {
    var arr48hr = regionsData.records.locations[0].location;
    for (var i = 0; i < arr48hr.length; i++) {
      if (arr48hr[i].locationName === currentRegion) {
        regionforecast48hr =  arr48hr[i];
      }
    }
    // Get 48hr forecast Time & temperature
    arrTemp = regionforecast48hr.weatherElement[3].time;
    for (var i = 0; i < 16; i++) {
      arr48hrTime[i] = arrTemp[i].dataTime;
      arr48hrTemp[i] = arrTemp[i].elementValue[0].value;
    }
    forecastTime48hr = document.getElementById("forecast-48hrs-time");
    for (var i = 0; i < arr48hrTime.length; i++) {
      var th = document.createElement("th");
      var timeDate = new Date(arr48hrTime[i].slice(0,4), arr48hrTime[i].slice(5,7)-1, arr48hrTime[i].slice(8,10));
      var arrDay = ["日", "一", "二", "三", "四", "五", "六" ];
      var getDay = timeDate.getDay();
      var getDate = timeDate.getDate();
      var DayTemp = arrDay[getDay];
      if (todayDD === getDate) {
        th.textContent = "今天" + arr48hrTime[i].slice(11,16);
      } else if ( todayDD+1 === getDate ) {
        th.textContent = "明天"  + arr48hrTime[i].slice(11,16);
      } else if ( todayDD+2 === getDate ) {
        th.textContent = "後天"  + arr48hrTime[i].slice(11,16);
      }
      forecastTime48hr.append(th);
      if (i >= 1 && getDate === parseInt(arr48hrTime[i-1].slice(8,10)) ) {
        th.textContent = arr48hrTime[i].slice(11,16);
      }
    }

    forecastTemp48hr = document.getElementById("forecast-48hrs-temp");
    arr48hrTemp.forEach(function (e) {
      var td = document.createElement("td");
      td.innerHTML = e + '&#8451' ;
      forecastTemp48hr.append(td);
    })
    // Get 48hr forecast PoP6h
    arrPoP6hTemp = regionforecast48hr.weatherElement[7].time;
    for (var i = 0; i < 8; i++) {
      arr48hrPoP6h[i] = arrPoP6hTemp[i].elementValue[0].value;
    }
    forecastPoP6h48hr = document.getElementById("forecast-48hrs-PoP6h");
    arr48hrPoP6h.forEach(function (e) {
      var td1 = document.createElement("td");
      var td2 = document.createElement("td");
      td1.innerHTML = e + "%" ;
      td2.innerHTML = e + "%" ;
      forecastPoP6h48hr.append(td1);
      forecastPoP6h48hr.append(td2);
    })
    // Get 48hr forecast Wx
    arr48hrWxTemp = regionforecast48hr.weatherElement[1].time;
    for (var i = 0; i < arr48hrWxTemp.length; i++) {
       Wx48hrTemp = parseInt(arr48hrWxTemp[i].elementValue[1].value);
       arr48hrWx[i] = getWeatherCode(WEATHER_CODE, Wx48hrTemp);
    }
    forecastWx48hr = document.getElementById("forecast-48hrs-Wx");
    for (var i = 0; i < 16; i++) {
      arrTempHours[i] = parseInt(arr48hrTime[i].slice(11,13));
    }
    for (var i = 0; i < 16; i++) {
      var td = document.createElement("td");
      var div = document.createElement("div");
      if (arr48hrWx[i] === 0 && arrTempHours[i] >= 18 || arrTempHours[i] < 6) {
        Wx48hrClass = "WxImage11N";
      } else {
        Wx48hrClass = "WxImage" + arr48hrWx[i];
      }
      div.classList.add("WxImage", Wx48hrClass);
      td.append(div);
      forecastWx48hr.append(td);
    }
  })
}

function forecast7d() {
  var forecast7d = fetch(getforecast7dUrl);
  var forecast7d2 = forecast7d.then(function (res) {
    return res.json();
  })
  forecast7d2.then(function (regionsData) {
    var arr7d = regionsData.records.locations[0].location;
    for (var i = 0; i < arr7d.length; i++) {
      if (arr7d[i].locationName === currentRegion) {
        regionforecast7d =  arr7d[i];
      }
    }
    // Get 7days forcast Date //
    arr7dDateTemp = regionforecast7d.weatherElement[8].time;
    for (var i = 1; i < arr7dDateTemp.length; i++) {
      if (todayDD !== parseInt(arr7dDateTemp[i].startTime.slice(8,10))) {
        for (var j = i; j < arr7dDateTemp.length; j+=2) {
          arr7dDate.push(arr7dDateTemp[j].startTime) ;
        }
        break;
      }
    }
    var forecastDate7d = document.getElementById("forecast-7d-date");
    arr7dDate.forEach(function (e) {
      var th = document.createElement("th");
      var timeDate = new Date(e.slice(0,4), e.slice(5,7)-1, e.slice(8,10));
      var arrDay = ["日", "一", "二", "三", "四", "五", "六" ];
      var getDay = timeDate.getDay();
      var DayTemp = arrDay[getDay];
      if (e[5] === "0" ) {
        th.textContent = e.slice(6,7) + "/" + e.slice(8,10) + " (" + DayTemp + ")";
      } else {
        th.textContent = e.slice(5,7) + "/" + e.slice(8,10) + " (" + DayTemp + ")";
      }
      forecastDate7d.append(th);
    })
    // Get 7days forcast minT //
    for (var i = 1; i < arr7dDateTemp.length; i++){
      if (todayDD !== parseInt(arr7dDateTemp[i].startTime.slice(8,10))) {
        for (var j = i; j < arr7dDateTemp.length; j+=2) {
          var minTemp = Math.min(parseInt(arr7dDateTemp[j].elementValue[0].value), parseInt(arr7dDateTemp[j+1].elementValue[0].value))
          arr7dminT.push(minTemp);
        }
        break;
      }
    }
    forecastminT7d = document.getElementById("forecast-7d-minT");
    arr7dminT.forEach(function (e) {
      var td = document.createElement("td");
      td.innerHTML = e + '&#8451' ;
      forecastminT7d.append(td);
    })
    // Get 7days forcast maxT //
    arr7dmaxTTemp = regionforecast7d.weatherElement[12].time;
    for (var i = 1; i < arr7dmaxTTemp.length; i++){
      if (todayDD !== parseInt(arr7dmaxTTemp[i].startTime.slice(8,10))) {
        for (var j = i; j < arr7dmaxTTemp.length; j+=2) {
          var maxTemp = Math.max(parseInt(arr7dmaxTTemp[j].elementValue[0].value), parseInt(arr7dmaxTTemp[j+1].elementValue[0].value))
          arr7dmaxT.push(maxTemp);
        }
        break;
      }
    }
    forecastmaxT7d = document.getElementById("forecast-7d-maxT");
    arr7dmaxT.forEach(function (e) {
      var td = document.createElement("td");
      td.innerHTML = e + '&#8451' ;
      forecastmaxT7d.append(td);
    })
    // Get 7days forcast Wx //
    arr7dWxTemp = regionforecast7d.weatherElement[6].time;
    for (var i = 1; i < arr7dWxTemp.length; i++) {
      if (todayDD !== parseInt(arr7dWxTemp[i].startTime.slice(8,10))) {
        for (var j = i; j < arr7dWxTemp.length; j+=2) {
          var WxM = parseInt(arr7dWxTemp[j].elementValue[1].value);
          var WxN = parseInt(arr7dWxTemp[j+1].elementValue[1].value);
          var WxMCode = getWeatherCode(WEATHER_CODE, WxM);
          var WxNCode = getWeatherCode(WEATHER_CODE, WxN);
          if (WxMCode === WxNCode) {
            arr7dWx.push(WxMCode);
          } else {
            arr7dWx.push(Math.max(WxMCode, WxNCode));
          }
        }
        break;
      }
    }
    forecastWx7d = document.getElementById("forecast-7d-Wx");
    arr7dWx.forEach(function (e) {
      var td = document.createElement("td");
      var div = document.createElement("div");
      WxClass = "WxImage" + e;
      div.classList.add("WxImage", WxClass);
      td.append(div);
      forecastWx7d.append(td);
    })
  })
}
