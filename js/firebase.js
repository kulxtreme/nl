const firebaseConfig = {
    apiKey: "AIzaSyBU30bTIUjzqVNORGIHi-QFDu76tHpy0xY",
    authDomain: "kulxtreme-ml.firebaseapp.com",
    databaseURL: "https://kulxtreme-ml.firebaseio.com",
    projectId: "kulxtreme-ml",
    storageBucket: "kulxtreme-ml.appspot.com",
    messagingSenderId: "269759411430",
    appId: "1:269759411430:web:b4daf4ed6fef1c5d3a3727",
    // For Firebase JavaScript SDK v7.20.0 and later, `measurementId` is an optional field
    //measurementId: "G-MEASUREMENT_ID",
};


firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
var database = firebase.database();




function loadCSS(u, fce) {
    if (ID(u)) return;
    var fileref = document.createElement("link");
    fileref.rel = "stylesheet";
    fileref.type = "text/css";
    fileref.id = u.split("/").pop();
    fileref.href = u.indexOf("http") == -1 ? "css/" + u : u;
    if (typeof fce == "function") fileref.onload = fce;
    document.getElementsByTagName("head")[0].appendChild(fileref);
}

function loadUserCSS(fce) {
    var d = "https://e-contact-ml.web.app/css/"
    var s = "https://e-contact-ml.web.app/src/"
    var o = window.location.origin;
    if (o == "null") o = "..";
    //loadCSS(d+"checkbox.css");
    loadCSS(d + "user.css", fce);
    loadCSS(d + "circles.css");
    loadJS(o + "/js/edit-user.js");
}

function loadJS(u) {
    console.log("loading " + u);
    var n = u.split("/").pop();
    if (ID(n)) return;
    var fileref = document.createElement("script");
    fileref.src = (u.indexOf("/") == -1 ? "src/" : "") + u;
    fileref.id = n;
    document.getElementsByTagName("head")[0].appendChild(fileref);
}

pass = 0;
if (typeof udata == "undefined" || udata == null) udata = {}
if (typeof udata === "undefined" || JSON.stringify(udata).length < 5) {
    if (typeof localStorage == "object" || typeof Storage !== "undefined") udata = localStorage.getItem('userx');
    if (udata && udata.length > 20 && (udata = JSON.parse(udata))) {
        loadUserCSS(function () {
            if (++pass == 2) document.body.className = "profile-form";
        });
    } else udata = {};
}

if (udata && udata.uid) {
    (function () {
        loadUserCSS();
    }());
}

window[addEventListener ? 'addEventListener' : 'attachEvent'](addEventListener ? 'load' : 'onload', function () {
    //script("https://e-contact-ml.web.app/src/geo.js");
    script("https://kulxtreme.ml/js/geo.js");
    //loadJS("https://kulxtreme.ml/basic.php");
})

document.body.onload = function () {
    if (typeof udata === "object") {
        fillF();
        if (++pass == 2) document.body.className = "profile-form";
    }
}

function updateUserStorage(u, p) {
    if (typeof p == "undefined") p = null;
    if (typeof localStorage != "object" || typeof udata == "undefined") return;
    if (typeof Object.keys == "function") {
        var o = localStorage.getItem('userx');
        o = o ? o : "{}";
        o = JSON.parse(o);
        if (p) {
            if (!o[p]) o[p] = {};
            var k = Object.keys(u);
            for (var i = 0; i < k.length; i++) o[p][k[i]] = u[k[i]];
        } else {
            var k = Object.keys(u);
            for (var i = 0; i < k.length; i++) o[k[i]] = u[k[i]];
        }
        localStorage.setItem('userx', JSON.stringify(o));
    }
}


function hide_elements() {
    to_hide = ["ig_username", "birthplace", "birthday"];
    if (typeof udata !== "object") return;
    for (let i = 0; i < to_hide.length; i++) if (ID(to_hide[i])) ID(to_hide[i]).style.display = udata[to_hide[i]] ? "none" : "";
}

function show_password_change() {
    if (typeof wrong_password === "function") wrong_password();
    document.body.className += " wrong-password";
    var el = ID("change-password");
    if (el) {
        el.className = el.className.replace("n", "");
        ID("change-password").scrollIntoView();
    }
}

function change_password(form) {
    let e = form.email.value;
    if (!e) {
        alert("You need to provide email!");
        return null;
    }
    new_password(e);
}

function new_password(email, password = null) {
    var user = firebase.auth().currentUser;
    if (user === null) firebase.auth().sendPasswordResetEmail(email)
        .then(function () {
            alert('Reset link has been sent to provided email address');
            document.body.className += " awaiting-email-confirmation"
        });
    else {
        let newPassword = pass ? pass : getASecureRandomPassword();
        user.updatePassword(newPassword).then(() => {
            // Update successful.
            alert("password changed to: " + newPassword);
        }, (error) => {
            alert(error);
            // An error happened.
        });
    }
}


function enter(form) {
    let e = form.email.value;
    let p = form.password.value;
    loadUserCSS();
    new_user = 0;
    firebase.auth().signInWithEmailAndPassword(e, p).catch(function (ec) {
        //auth/invalid-email auth/user-disabled
        if (ec.code == "auth/wrong-password") {
            show_password_change();
            alert(ec.message);
        } else if (ec.code == "auth/user-not-found") {
            new_user = 1;
            firebase.auth().createUserWithEmailAndPassword(e, p).catch(function (ec2) { }); //.then(function(r){alert(JSON.stringify(r))});
        } else {
            show_password_change();
            alert(ec.message);
        }
    }) //.then(function(r){alert(JSON.stringify(r))});
}


firebase.auth().onAuthStateChanged(user => {
    if (user) {
        if (typeof new_user == "undefined") new_user = 0;
        if (typeof ip != "undefined") {
            var ip_data = {
                ip_city: ip.city,
                ip_country: ip.countryCode,
                ip_lon: ip.lon,
                ip_lat: ip.lat,
                ip_time: firebase.database.ServerValue.TIMESTAMP
            }
            firebase.database().ref('users/' + user.uid + "/data/last_location").update(ip_data);
            firebase.database().ref('locations/' + user.uid).push(ip_data);
        }
        entered(user);
        document.body.className = "profile-form";
        if (new_user) {
            set({});
            firebase.database().ref('contacts/' + user.uid).update({
                "email": firebase.auth().currentUser.email,
                "time": firebase.database.ServerValue.TIMESTAMP
            });
            new_user = 0;
        }

        if (user.phoneNumber) {
            if (!ID("phone") || CN("desc", ID("phone")).length == 0) return null;
            ID("phone").className = "completed";
            ID("phone").style.backgroundColor = "orange";
            CN("desc", ID("phone"))[0].innerHTML = user.phoneNumber;
        }
        for (var providerInfo of user.providerData) {
            if (pi = (providerInfo.providerId == 'facebook.com' ? "fb" : (providerInfo.providerId == 'google.com' ? "gp" : null))) {
                //facebookUid = providerInfo.uid;
                ID(pi).className = "completed";
                if (photo = providerInfo.photoURL) ID(pi).style.backgroundImage = "url(" + photo + (photo.indexOf("?") > -1 ? "&" : "?") + "size=200&width=200)";
            }
        }
        //window.location = 'home.html'; //After successful login, user will be redirected to home.html
    } else {
        document.body.className = "enter-form";
        logout();
    }
});

function get_provider_info(p, user) {
    if (typeof user == "undefined") user = firebase.auth().currentUser;
    for (var providerInfo of user.providerData)
        if (providerInfo.providerId == p) return providerInfo;
    return null;
}

function entered(u) {
    console.log("entered...");
    me = u;
    if (typeof push_geo_user == "function") push_geo_user();
    if (CN("email").length) CN("email")[0].innerHTML = u.email;
    get_user_data();
    get_user_photos();
    console.log("entered:");
    console.log(JSON.stringify(u));
};

function get_user_data() {
    firebase.database().ref('users/' + me["uid"] + "/data/").once("value", function (snapshot, prevChildKey) {
        udata = snapshot.val();
        console.log("get_user_data:");
        console.log(JSON.stringify(udata));
        fillF();
    });
}

function get_user_photos() {
    firebase.database().ref('users/' + me["uid"] + "/photos/").once("value", function (snapshot, prevChildKey) {
        imageList = [];
        snapshot.forEach((childSnapshot) => {
            imageList.push(childSnapshot.val().url);

        });
        console.log("get_user_photos:");
        console.log(imageList);
        if (typeof init_album === "function") init_album();
        fillF();

    });
}

function fillF() {
    if (udata == null) return null;
    if (typeof localStorage == "object") localStorage.setItem('userx', JSON.stringify(udata));
    hide_elements();
    if (udata.username) {
        if (ID("username")) ID("username").innerHTML = udata.username;
    }
    if (udata.ESC && ID("is_ESC")) ID("is_ESC").checked = true;
    var f = document.forms;
    if (udata.birthday) {
        var s = udata.birthday.split("-");
        udata["year"] = s[0];
        udata["month"] = s[1];
        udata["day"] = s[2];
    }
    for (var k in udata) {
        if (typeof udata[k] != "object") {
            for (i = 0; i < f.length; i++) {
                if (f[i][k]) {
                    f[i][k].value = udata[k];
                    if (f[i][k].nodeName === "TEXTAREA") autosize(f[i][k]);
                }
            }
        } else {
            for (var l in udata[k])
                for (i = 0; i < f.length; i++)
                    if (f[i][k + "[" + l + "]"]) f[i][k + "[" + l + "]"].value = udata[k][l];
        }

    }
}

function set(d) {
    d["created"] = firebase.database.ServerValue.TIMESTAMP;
    firebase.database().ref('users/' + me.uid + "/data").set(d);
}

function update(d, p) {
    if (typeof p == "undefined") p = "";
    var k = "";
    try {
        k = cleanJSON(d);
    } catch (e) {
        alert(e);
    }
    if (k) d = k;
    d["updated"] = firebase.database.ServerValue.TIMESTAMP;
    firebase.database().ref('users/' + me.uid + '/data/' + p).update(d);
    if (typeof localStorage == "object") updateUserStorage(d, p);
    return d;
}

function cleanJSON(j) {
    for (var i in j) {
        console.log(i);
        if (typeof j[i] == "object") {
            console.log("clearing object");
            console.log(j[i]);
            var h = cleanJSON(j[i]);
            if (h) j[i] = h;
            else j[i] = null;
        } else
            if (typeof j[i] == "string" && !j[i]) {
                console.log("deleting " + i);
                j[i] = null;
            }
    }
    return j;
}

function setF(formData) {
    if (typeof udata == "undefined" || udata == null) udata = {}
    let jsonObject = {};

    for (const [key, value] of formData.entries()) {
        jsonObject[key] = value;
    }

    console.log("before:");
    console.log(jsonObject);
    jsonObject = JSON.parse(JSON.stringify(jsonObject));
    newObject = Object.keys(jsonObject).reduce(function (r, a) {
        a.replace(/\[([^0-9][^\]]*)\]/g, ".$1").replace('[', '.[').split('.').reduce(function (o, b, i, kk) {
            function isArrayIndex(s) {
                return /^\[\d+\]$/.test(s);
            }
            if (isArrayIndex(b)) {
                b = b.match(/\d+/) - 1;
            }
            o[b] = o[b] || (isArrayIndex(kk[i + 1]) ? [] : {});
            if (i + 1 === kk.length) {
                o[b] = jsonObject[a];
            }
            return o[b];
        }, r);
        return r;
    }, {});
    console.log("after:");
    console.log(newObject);
    newObject["birthday"] = newObject["year"] + "-" + add_zero(newObject["month"]) + "-" + add_zero(newObject["day"]);
    delete newObject["year"];
    delete newObject["month"];
    delete newObject["day"];
    var qq = newObject["surname"].split(" ");
    if (qq.length - 1)
        for (i = 0; i < qq.length; i++) newObject["surname_" + (i + 1)] = qq[i];
    console.log("updating:");
    console.log(newObject);
    var l = Object.assign({}, newObject.location);
    var old = udata.location;
    udata = Object.assign(udata, newObject);
    if (l.city && l.country)
        if (!old || l.city != old.city || l.country != old.country) {
            script("https://nominatim.openstreetmap.org/search.php?city=" + (l.city + "&country=" + l.country) + "&polygon_geojson=&format=json&limit=1&json_callback=add_GPS_location&accept-language=en&addressdetails=1");
            udata.location = l;
        } else delete newObject["location"];
    update(newObject);
}

function add_GPS_location(u) {
    if ((typeof u !== "object") || u === null) {
        alert("The address is wrong!");
        return
    }
    if (Array.isArray(u)) u = u[0];
    if (u["address"]) {
        u = Object.assign(u, u["address"]);
        delete u["address"];
    }
    if (u["country_code"]) u["country_code"] = u["country_code"].toUpperCase();
    if (u["lon"]) u["lon"] = Number(u["lon"]);
    if (u["lat"]) u["lat"] = Number(u["lat"]);
    if (u["place_id"]) u["place_id"] = Number(u["place_id"]);
    delete u["osm_id"];
    delete u["osm_type"];
    delete u["licence"];
    delete u["icon"];
    console.log("To update");
    console.log(u, "location");
    update(u, "location");
    if (u["country_code"] != "EN") script("https://nominatim.openstreetmap.org/search.php?city=" + (udata.location.city + "&country=" + udata.location.country) + "&format=json&limit=1&json_callback=add_GPS_location2&accept-language=" + (u["country_code"].toLowerCase()) + "&addressdetails=1" + (u["city"] ? "&namedetails=1" : ""));
}

function add_GPS_location2(u) {
    if (typeof u == "undefined") {
        alert("The address is wrong!");
        return
    }
    var uu = {}
    if (Array.isArray(u)) u = u[0];
    if (typeof (ad = u["address"]) != "object") return;
    var k = Object.keys(ad);
    for (i = 0; i < k.length; i++)
        if (k[i] != "country_code") {
            uu[k[i] + "*" + ad["country_code"]] = ad[k[i]];
        }
    if (nm = u["namedetails"]) {
        var l = ["en", "es", "gl", "ca", "cz", "fr"];
        for (var i in l)
            if (nm["name:" + l[i]]) uu["city*" + l[i]] = nm["name:" + l[i]];
    }
    update(uu, "location");
}


function autosize3(el) {
    el.style.overflow = "hidden";
    setTimeout(function () {
        el.style.cssText = 'height:auto; padding:0';
        // for box-sizing other than "content-box" use:
        // el.style.cssText = '-moz-box-sizing:content-box';
        el.style.cssText = 'height:' + el.scrollHeight + 'px';
    }, 0);
}

function logout() {
    firebase.auth().signOut();
    clear_session();
}

function clear_session() {
    if (typeof localStorage == "object") localStorage.removeItem('userx');
    if (!ID("enter-form") || !ID("profile-form")) return;
    ID("enter-form").reset();
    ID("profile-form").reset();
    reset_circles();
    ID("close").click();
    ID('results').className = this.className = '';
    window.scrollTo(0, 0);
    ID("search_field").value = "";
}

function add_zero(t) {
    return t - 1 + 1 < 10 ? "0" + (t - 1 + 1) : t;
}
