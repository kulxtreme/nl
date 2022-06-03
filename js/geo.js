(load = function() {
  //disable_referrer()
  //script("http://ip-api.com/json?callback=toip&fields=message,country,countryCode,regionName,city,lat,lon,timezone,isp,org,as,reverse,mobile,proxy,query");
  script("https://kulxtreme-cz.ml/ipinfo.php?callback=toip");
  //------hazi server error script("https://us-central1-nyni-ml.cloudfunctions.net/loc?callback=googl_geo");//console.clear();
});

if (document.readyState === "complete") load();
else window[addEventListener ? 'addEventListener' : 'attachEvent'](addEventListener ? 'load' : 'onload', load)
//https://stackoverflow.com/questions/1235985/attach-a-body-onload-event-with-js

function googl_geo(d) {
  googl = {
    "googl_city": d["x-appengine-city"],
    "googl_countryCode": d["x-appengine-country"],
    "googl_lat": Number(d["x-appengine-citylatlong"].split(",")[0]),
    "googl_lon": Number(d["x-appengine-citylatlong"].split(",")[1]),
  };
  googl["IP"] = d["x-appengine-user-ip"];
  googl["user_agent"] = d["user-agent"];
  push_geo(googl);
  //for(k in googl)document.cookie=k+"="+googl[k]+";path=/";//geodata();
}

function toip(d) {
  if (typeof d != "object") return;
  var k = Object.keys(d);
  if (typeof push_geo_data != "object") push_geo_data = {};
  for (var i = 0; i < k.length; i++) push_geo_data[(("city,country,countryCode,lat,lon,IP".split(",")).indexOf(k[i]) > -1 ? "ip_" : "") + k[i]] = d[k[i]];
  push_geo_user();
}

function push_geo(d) {
  if (typeof push_geo_data != "object") push_geo_data = {};
  push_geo_data = Object.assign(push_geo_data, d);
  push_geo_user();
}

function push_geo_user() {
  if (typeof me == "undefined" || typeof push_geo_data != "object" || !push_geo_data["IP"] || !push_geo_data["ip_IP"]) return;
  console.log(push_geo_data);
  push_geo_data["uid"] = typeof me == "object" ? me.uid : "anonymous";
  push_geo_data["time"] = firebase.database.ServerValue.TIMESTAMP;
  firebase.database().ref('locations').push(push_geo_data);
  firebase.database().ref('ip_locations/ip_' + push_geo_data["IP"].replace(/\./g, "_")).set(push_geo_data);
  if (push_geo_data["IP"] != push_geo_data["ip_IP"]) firebase.database().ref('ip_locations/ip_' + push_geo_data["ip_IP"].replace(/\./g, "_")).set(push_geo_data);
  var k = Object.keys(push_geo_data);
  for (var i = 0; i < k.length; i++)
    if (k[i].slice(0, 3) != "ip_" && k[i].slice(0, 6) != "googl_" && k[i] != "time") delete push_geo_data[k[i]];
  delete push_geo_data["uid"];
  delete push_geo_data["ip_IP"];
  firebase.database().ref('users/' + me.uid + "/last_connection").set(push_geo_data).then(function() {});
  delete push_geo_data;
}


function disable_referrer() {
  //https://stackoverflow.com/questions/6817595/remove-http-referer
  var meta = document.createElement('meta');
  meta.name = "referrer";
  meta.content = "no-referrer";
  document.getElementsByTagName('head')[0].appendChild(meta);
}

function enable_referrer() {
  var m = document.getElementsByTagName('head')[0].getElementsByTagName('meta');
  for (i = 0; i < m.length; i++)
    if (m[i].name == "referrer") m[i].parentNode.removeChild(m[i]);
}








function GPS() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(geo, geoerror);
  } else {
    document.cookie = "geo_GPS=not_supported;path=/";
  }
}

function geo(p) {
  if (p.coords) {
    p = p.coords;
    geo_GPS = [p.latitude, p.longitude];
    document.cookie = "geo_GPS=" + encodeURIComponent(p.latitude + "," + p.longitude) + ";path=/";
    script("https://nominatim.openstreetmap.org/reverse.php?format=json&lat=" + p.latitude + "&lon=" + p.longitude + "&zoom=16&json_callback=geo2")
  }
} //script("https://nominatim.openstreetmap.org/reverse.php?format=json&lat=49.000722886707834&lon=17.433312042031027&zoom=16&json_callback=geo2")
function geo2(a) {
  if (!a.address) return;
  a = a.address;
  var m = null;
  var g = {
    "geo_country": a.country_code,
    "geo_city": a.city ? a.city : (a.town ? a.town : ""),
    "geo_village": a.village ? a.village : "",
    "geo_street": a.road ? a.road : "",
    "geo_suburb": a.suburb ? a.suburb : ""
  };
  for (k in g) document.cookie = k + "=" + g[k] + ";path=/";
  geodata();
  CN("desc", ID("GPS"))[0].innerHTML = g["geo_city"] ? g["geo_city"] : (g["geo_village"] ? g["geo_village"] : "ok");
  ID("GPS").className = "completed";
  ID("GPS").style.backgroundColor = "green";
}

function geodata() {
  /*script("/api_kx.php?geodata=1");*/
}

function geoerror(error) {
  var m = 0,
    k = 1;
  switch (error.code) {
    case error.PERMISSION_DENIED:
      m = "PERMISSION_DENIED"
      break;
    case error.POSITION_UNAVAILABLE:
      document.cookie = "geo_GPS=" + ("POSITION_UNAVAILABLE;path=/".toLowerCase());
      break;
    case error.TIMEOUT:
      m = "TIMEOUT"
      break;
    case error.UNKNOWN_ERROR:
      m = "UNKNOWN_ERROR"
      break;
  }
  //if(m)document.createElement("img").src="/api_kx.php?menu_change=geo|"+m;
}

//function geodata(){script("/api_kx.php?geodata=1");}

