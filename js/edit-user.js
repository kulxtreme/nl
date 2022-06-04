/*function on2(t) {
  if (t.tagName != "TEXTAREA") return;
  var savedValue = t.value;
  t.value = '';
  t.innerHTML = '';
  t.baseScrollHeight = t.scrollHeight;
  t.value = savedValue;
  on(t);
}

setTimeout(function() {
  var e = CN("autoexpand");
  for (i = 0; i < e.length; i++) {
    var savedValue = e[i].value;
    e[i].value = '';
    e[i].baseScrollHeight = e[i].scrollHeight;
    e[i].value = savedValue;
    e[i].onkeyup = function() {
      on(this);
    }
    e[i].onkeydown = function() {
      on(this);
    }
    e[i].onkeypress = function() {
      on(this);
    }
    e[i].oninput = function() {
      on(this);
    }
    e[i].onchange = function() {
      on(this);
    }
  }
}, 600);

function on(t) {
  var minRows = t.getAttribute('data-min-rows') | 0,
    rows;
  t.rows = minRows;
  rows = Math.ceil((t.scrollHeight - t.baseScrollHeight) / 17);
  console.log(t.scrollHeight, t.baseScrollHeight)
  t.rows = minRows + rows;
}*/
//-----autosize end-----------
function add_auth_provider(s) {
  if (s.className == "completed") {
    //alert(JSON.stringify(firebase.auth().currentUser))
    //var fbid=get_provider_info("facebook.com");
    firebase.auth().currentUser.unlink(s.id == "fb" ? "facebook.com" : (s.id == "gp" ? "google.com" : (s.id == "phone" ? "phone" : ""))).then(function() {
      // Auth provider unlinked from account
      alert("user removed");
      delete udata[s.id + "_id"];
      s.className = "";
      s.style.backgroundImage = "";
      s.style.backgroundColor = "";
    }).catch(function(e) {
      alert(e)
    });
  } else {
    if (s.id == "phone") {
      add_phone();
    }
    var provider = (s.id == "fb" ? new firebase.auth.FacebookAuthProvider() : (s.id == "gp" ? (new firebase.auth.GoogleAuthProvider()) : null));
    if (provider == null) return;
    firebase.auth().currentUser.linkWithPopup(provider).then(function(result) {
      // Accounts successfully linked.
      var credential = result.credential;
      var u = result.user;
      console.log(credential, u);
      save_contacts(u);
    }).catch(function(e) {
      console.log(e)
    });
  }

}

function save_contacts(u) {
  if (u.phoneNumber) {
    firebase.database().ref('contacts/' + me.uid).update({
      "phone": u.phoneNumber
    });
    ID("phone").className = "completed";
    ID("phone").style.backgroundColor = "orange";
    CN("desc", ID("phone"))[0].innerHTML = u.phoneNumber;
  }
  for (var providerInfo of u.providerData) {
    if (pi = (providerInfo.providerId == 'facebook.com' ? "fb" : (providerInfo.providerId == 'google.com' ? "gp" : null))) {
      ID(pi).className = "completed";
      if (photo = providerInfo.photoURL) ID(pi).style.backgroundImage = "url(" + photo + (photo.indexOf("?") > -1 ? "&" : "?") + "size=200&width=200)";
      d = {};
      ui = providerInfo;
      d[pi + "_id"] = ui.uid;
      d[pi + "_name"] = ui.displayName;
      d[pi + "_picture"] = ui.photoURL;
      firebase.database().ref('users/' + me.uid).update(d);
      udata = Object.assign({}, udata, d);
      d[pi + "_email"] = ui.email;
      firebase.database().ref('contacts/' + me.uid).update(d);
    }
  }
}

function add_phone() {
  var phoneNumber = window.prompt('Provide your phone number in international format');
  if (!phoneNumber) return;
  var appVerifier = new firebase.auth.RecaptchaVerifier(
    verif, {
      size: 'invisible'
    });
  firebase.auth().currentUser.linkWithPhoneNumber(phoneNumber, appVerifier)
    .then(function(confirmationResult) {
      // Ask user to provide the SMS code.
      var code = window.prompt('Provide your SMS code you have received');
      // Complete sign-in.
      return confirmationResult.confirm(code).then(function(result) {
        save_contacts(result.user);
      }).catch(function(e) {
        alert("The code was not correct");
        location.reload();
      });; //https://stackoverflow.com/questions/37021241/error-recaptcha-placeholder-element-must-be-empty
    }).catch(function(e) {
      alert(e);
      location.reload();
    })
}

function reset_circles() {
  clear_username();
  var ch = ID("circles").children;
  for (i = 0; i < ch.length; i++) {
    ch[i].className = "";
    var t = CN("desc", ch[i]);
    if (t.length) t[0].innerHTML = "";
    ch[i].style.backgroundImage = "";
    ch[i].style.backgroundColor = "";
  }
}

function clear_username() {
  ID("username").innerHTML = "";
}


function is_fb() {
  return ID("fb").style.backgroundImage ? 1 : 0;
}

function get_ig(un) {
  return false;
  //uz nejde
  script("https://kulxtreme.ml/instagram.php?callback=ig_data&un=" + un);
}

function ig_data(d) {
  if (!d) return;
  firebase.database().ref('users/' + me.uid + '/ig').set(d);
  if (d.profile_pic_url_hd) firebase.database().ref('users/' + me.uid + '/ig_picture').set(d.profile_pic_url_hd);
  if (d.full_name) firebase.database().ref('users/' + me.uid + '/ig_name').set(d.full_name);
  console.log(d);
  show_ig_photos(d);
}

function show_ig_photos(d) {
  var size = 0;
  if (ph = ID("photos")) ph.innerHTML = "";
  e = d["edge_owner_to_timeline_media"]["edges"];
  var p = [];
  s = [];
  for (var i = 0; i < e.length; i++) {
    p[i] = e[i]["node"]["display_url"];
    s[i] = e[i]["node"]["thumbnail_resources"][size]["src"];
    show_ig_photo(s[i], p[i]);
  }
  ph.className = "visible";
  return [s, p];
}

function show_ig_photo(p, b) {
  if (!ID("photos")) return;
  var f = TG("img", ID("photos"));
  f.src = p;
  f.onload = function() {
    this.className = "visible"
  };
  f.setAttribute("b", b)
}
