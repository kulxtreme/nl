/*
id of album corresponds to tag
could be defined: 
- functions app_alert and app_report
- user details in u={...}
reversed time order in album
files failed to upload due to 400 error are tried once again at the end

uploaded in ---znovu dat,bud na konci kazdeho bunche,kazdopadne uplne na konci 13s 4+5+8s
try catch
*/

//t = input with file, id = album id, f=function to run after all uploads finish
function handleFiles(t, id, f) {
  try {
    if (!define_globals(t, id, f)) return;
    if (!t.files.length) {
      if (typeof fs == "undefined") app_alert("No files selected!");
      return;
    }
    if (typeof u !== "object") u = {};
    t.bunch_item = 0;
    handlebunchFiles();
  } catch (e) {
    app_report(e);
    alert(e.name);
    alert(e.message);
  }
}

function handlebunchFiles(mode) {
  if (typeof mode == "undefined") mode = null;
  if (mode == "failed" && df.length != fs.length) return;//only after all files in que are tried to upload while being online
  var t = file_input;
  var id = t.album_id;
  console.log("handlebunchFiles [" + (mode == "failed" ? "for failed upload" : (++t.bunch_item)) + "]");

  for (var i = 0, j = 0; i < fs.length && j < 6; i++) {
    if (mode != "failed") {
      if (typeof df[i] != "undefined") continue;
      j++;
    } else {
      if (typeof df[i] != "undefined" && !df[i]["failed"]) continue;
      console.log("reuploading failed file " + fs[i]["name"]);
    }
    df[i] = { "file": fs[i] };
    var d = df[i];
    d["index"] = i;
    if (!eligible_file(d["file"])) {
      app_alert("File is not allowed!");
      console.log(d["file"])
      continue;
    } else if (d["is_large"])
      alternative_upload(d["file"]);

    add_kx_spec_tags(d, id);
    add_general_form_data(d, t.form);

    d["img"] = document.createElement("img");
    if (d["file"]["type"].toLowerCase().indexOf("image/") > -1) {
      try { //https://stackoverflow.com/questions/51101408/deprecation-of-createobjecturl-and-replace-with-the-new-htmlmediaelement-srcobje
        d["img"].src = window.URL.createObjectURL(d["file"]);
      } catch (e) {
        //d["img"].srcObject = d["file"];//add loaded src
        app_report(e);
        app_alert("The API is too old and already not supported. Contact us on kulxtreme@gmail.com informing about the problem.");
      }
      d["img"].d = d;
      d["img"].onload = function () {
        window.URL.revokeObjectURL(this.src);
        this.d["width"] = this.d["img"].naturalWidth;
        this.d["height"] = this.d["img"].naturalHeight;
        //problem with rotated images, dimensions flipped xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
        this.d["type"] = "photo";
        uploadFile(this.d);
      }
    } else if (d["file"]["type"].toLowerCase() == "application/pdf") {
      //post(d);
      //if (typeof email != "undefined") d["img"].src = "https://images.weserv.nl/?url=kulxtreme.ml/files/" + email + "/" + files[i].name;
      d["type"] = "pdf";
      uploadFile(d);
      d["img"].style.width = 0;
      d["img"].onload = function () {
        this.style.width = '';
      }
    }
    remove_reuploaded_img(id, d["file"]["name"]);
    vizualizeIMG(id, d)
  }

}

function vizualizeIMG(id, d) {
  if (typeof file_input === "undefined") return;
  if (typeof id !== "undefined" && id && ID(id) && d["img"]) {
    d["img"].height = 150;
    ID(id).insertBefore(d["img"], ID(id).firstChild);
    //ID(file_input.album_id).scrollTo(0,0);
    ID(file_input.album_id).scrollTop = 0;
    ID(file_input.album_id).scrollLeft = 0;
  }
}

function remove_reuploaded_img(id, filename) {
  if (typeof id == "undefined" || !id || !ID(id)) return;
  var im = ID(id).children;
  for (var j = 0; j < im.length; j++) {
    if (im[j].nodeName == "IMG" && im[j].src.indexOf("/" + filename) > -1)
      ID(id).removeChild(im[j]);
  }
}


function uploadFile(d) {
  if (typeof file_input !== "undefined") file_input.disabled = true;
  if (typeof d != "object") d = {};
  if (!d["file"]) return;

  /*
  cloudinary:cloudName->url,unsignedUploadPreset->fd
  imagekit:load:[token,expire,signature],publicKey
  */


  if (typeof FormData == "undefined") app_alert("Old browser. Unable to upload file!");
  d["fd"] = new FormData();
  d["fd"].append('upload_preset', unsignedUploadPreset);


  file_info_into_context(d);
  user_info_into_context(d);


  if (d["file"].name.toLowerCase().indexOf(".pdf") == -1)
    EXIF.getData(d["file"], function () {
      add_EXIF.call(this, d);//adding values to `d` and `context`
      if (d["context"]["lat"]) {
        script("https://nominatim.openstreetmap.org/reverse.php?accept-language=en&format=json&lat=" + d["context"]["lat"] + "&lon=" + d["context"]["lon"] + "&zoom=16&json_callback=geo_photo_" + d["index"]).onerror =
          function () { finalize_upload(d); }
        window["geo_photo_" + d["index"]] = function (a) { geo_photo(a, d["index"]); }
        console.log("context", d["context"]);
      }
      else finalize_upload(d);
    });
  else {
    add_pdf_tags(d);
    req(d);
  }
}

function req(d, f) {
  var primary_cloud = "cloudinary";
  if (!d["cloud"])
    if (d["register_photo"] || d["register_pdf"])
      d["cloud"] = "kx";
    else
      d["cloud"] = primary_cloud;
  if (d["clouds"]) d["clouds"].push(d["cloud"]); else d["clouds"] = [d["cloud"]];
  if (d["cloud"] == primary_cloud) alternative_upload(d);
  var url = cloud[d["cloud"]]["upload_url"];
  console.log("POST to url=" + url);
  console.log("post data", d);
  var fce = d["cloud"] != "kx" && d["type"] && (url.indexOf("xtreme.ml") == -1) ? window["register_" + d["type"]] : null;
  if (typeof f != "function") var f = null;
  try {
    var xhr = new XMLHttpRequest();
    var p = progress_node();
    if (p && !p.first_file) {
      p.innerHTML = "Uploading...";
      p.first_file = true;
    }
    xhr.cloud = d["cloud"];
    xhr["primary_cloud"] = primary_cloud;
    xhr.timer = setTimeout(function () { reset_upload(xhr, "Error: No connection!"); }, 7500);
    xhr.open('POST', url, true);
    xhr.running_times = new Date().getTime();
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.onreadystatechange = function (e) {
      if (xhr.status == 0 && false) {
        //fired in ie eve though online
        reset_upload(xhr, "Error: You need to be online!");
        set_failed(xhr, d);
      }
      if (xhr.readyState == 4 && xhr.status == 200) {
        // File uploaded successfully
        console.log("File uploaded successfully");
        d[xhr.cloud + "_response_time"] = xhr["response_time"] = (new Date().getTime() - xhr.running_times) / 1000;
        console.log("Platform", xhr.cloud);
        console.log("Response time: " + xhr["response_time"] + "s");
        console.log("Response and uploading time: " + (xhr["uploading_time"] + xhr["response_time"]) + "s");
        console.log("Response text", r = JSON.parse(xhr.responseText));
        activate_uploaded_image(d, r);
        fce && fce(d, r);
        f && f(d, r);
        assignWise(d, r);
        if (xhr.cloud == xhr["primary_cloud"])
          if (!add_another_bunch()) {//when everything uploaded or failed
            handlebunchFiles("failed");
            reset_upload(xhr);
          } else {
          }
      } else if (xhr.status == 400) {
        remove_image(d);
        reset_upload(xhr, "Error: Contact admin!", { "error": xhr.responseText });
        console.log("EEEEEEEEEEEEEE", xhr)
        set_failed(xhr, d);
      }
    };

    xhr.onerror = function () {
      remove_image(d);
      reset_upload(xhr, "Error: No connection!")
    }

    xhr.upload.onprogress = function (e) {
      if (xhr.timer) clearTimeout(xhr.timer);
      if (xhr["cloud"] == xhr["primary_cloud"]) d["percentComplete"] = xhr["percentComplete"] = Math.ceil((e.loaded / e.total) * 100);
      if (xhr["percentComplete"] == 100) {
        d[xhr.cloud + "_uploading_time"] = xhr["uploading_time"] = (new Date().getTime() - xhr.running_times) / 1000;
        xhr.running_times = new Date().getTime();
        console.log("Uploading time " + xhr["uploading_time"] + "s" + " for " + d["file"]["name"]);
      }
      if (xhr["cloud"] == xhr["primary_cloud"]) if (typeof progressfce == "function") progressfce();
    };
    xhr.send(d["fd"]);
    delete d["cloud"];
  }
  catch (e) {
    reset_upload(xhr, "You use old version. Please send us file by email.", { error: e });
  }
}

function activate_uploaded_image(d, r) {
  if (!d["img"] || !r["public_id"]) return null;
  if (d["img"] && r["public_id"] && d["img"] == d["img"].parentNode.firstChild) {
    /*!d["index"] to start from first selected, then scrollIntoView the image*/
    d["img"].id = r["public_id"];
    var album_el = d["img"].parentNode;
    if (typeof center_init == "function" && album_el.desc_box) {
      center_init(album_el);
      d["img"].click();
    }
  }
}

function remove_image(d) {
  if (d["img"]) d["img"].parentNode.removeChild(d["img"]);
  delete d["img"];
}

function assignWise(d, r) {
  var k = Object.keys(r);
  for (var i = 0; i < k.length; i++)d[k[i]] = r[k[i]];
}

function set_failed(xhr, d) {
  if (xhr["cloud"] == xhr["primary_cloud"]) d["failed"] = true;
}

function reset_upload(xhr, m, r) {
  if (typeof file_input === "object") file_input.disabled = false;
  if (xhr.timer) clearTimeout(xhr.timer);
  if (typeof m !== "undefined" && m && typeof app_alert === "function") app_alert(m);
  if (typeof r !== "undefined" && typeof app_report === "function") app_report(r);
}

function add_another_bunch() {
  var possible_to_add = true;
  for (var i = 0; i < df.length; i++) {
    if (!df[i]["response_time"]) {
      possible_to_add = false;
      break;//if not in bunch uploaded, wait
    }
    /*if(!df[i]["cloud"]){
      console.log("df[i][cloud",i)
      possible_to_add=true;
      break;
    }*/
  }
  if (possible_to_add && fs.length > df.length) handlebunchFiles();
  return possible_to_add && fs.length > df.length;
}

function finalize_upload(d) {
  if (kon = contextStr(d["context"])) d["fd"].append('context', kon);
  /* not allowed for unsigned request
  fd.append('quality_analysis', true); not allowed for unsigned request
  fd.append('image_metadata', true);
  fd.append('notification_url', base_url+'/api_kx?q=photo-uploaded');
  */
  if (d["tags"]) d["fd"].append('tags', d["tags"]);
  d["fd"].append('file', d["file"]);
  req(d);
}


function register_photo_firebase(d, meta) {
  console.log("register_photo_firebase", d, meta)
  //if(typeof d!=="object"||typeof meta!=="object"||!meta["etag"]&&!d["etag"])return;
  if (typeof deploy_photo_to_fb == "function") deploy_photo_to_fb(d, meta);
}


function register_photo(d, meta) {
  console.log("register_photo", d, meta)
  if (typeof d !== "object" || typeof meta !== "object" || !meta["etag"] && !d["etag"]) return;
  post({
    "register_photo": strdata(d, meta)
  });
}

function register_pdf(d, meta) {
  if (typeof d !== "object" || typeof meta !== "object" || !meta["etag"] && !d["etag"]) return;
  d["img"].src = "https://images.weserv.nl/?url=" + cloud["cloudinary"]["url"] + d["public_id"] + ".pdf";
  post({
    "register_pdf": strdata(d, meta)
  });
}

function alternative_upload(d) {
  if (d["imagekit"]) return;
  d["imagekit"] = true;
  if (typeof alt_files == "undefined") alt_files = [];
  if (typeof pcloud == "undefined") imagekit = {};
  alt_files.push(d);
  if (!imagekit["loading"]) {
    script("https://pro-mlade.ml/imagekit?callback=c_d" + alt_files.length + "&" + Math.random());
    //imagekit["loading"]=1;
    window["c_d" + alt_files.length] = function (d) {
      if (typeof toks == "undefined") toks = [d]; else toks.push(d); c_d(d);
    }//nove
  } else c_d();
}

function c_d(d) {
  if (typeof d != "undefined") imagekit = d;
  while (alt_files.length && toks.length) {
    imagekit = toks.shift();//nove
    upload_to_imagekit(alt_files.shift());
  }
}

function upload_to_imagekit(d) {
  var fd = new FormData();
  k = Object.keys(imagekit)
  for (var i = 0; i < k.length; i++)fd.append(k[i], imagekit[k[i]]);
  fd.append('file', d["file"]);
  fd.append("publicKey", cloud["imagekit"]["publicKey"]);
  fd.append("fileName", d["file"]["name"]);
  req(Object.assign(d, { fd: fd, cloud: "imagekit" }), register_photo_firebase);
}








function post(d, f) {
  if (typeof base_url == "undefined") define_globals();
  var uri = typeof API_url != "undefined" ? API_url : base_url + "/api_kx.php";
  if (d["url"]) {
    uri = d["url"];
    delete d["url"];
  }
  var xhr = new XMLHttpRequest();
  xhr.open("POST", uri, true);
  xhr.withCredentials = true;
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (uri.indexOf("/api_kx") > -1) {
        if (xhr.responseText != "true") {
          app_alert("Error occured." + xhr.responseText);
          location.reload();
        } else {
          if (typeof uploading_time !== "undefined") console.log("Totally uploaded with response in " + (uploading_time + response_time) + "s");
        }
      }
    }
  };
  if (typeof d != "undefined" && d["file"]) {
    var fd = new FormData();
    fd.append('docs[]', d["file"]);
    fd.append('upload', 'Add files');
    if (d["description"]) fd.append('description', d["description"]);
    if (d["tags"]) fd.append('tags', d["tags"].join(","));
    if (d["context"]) fd.append('context', JSON.stringify(d["context"]));
    fd.append('no-redirect', 1);
    delete d["file"];
  } else
    if (typeof d != "undefined") {
      xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      var params = serialize(d);
    }
  // Initiate a multipart/form-data upload
  xhr.send(typeof d == "undefined" ? null : (typeof fd == "undefined" ? params : fd));
}


function progress_node(c) {
  if (typeof file_input !== "object") return null;
  var p = file_input.form.getElementsByClassName("progress");
  if (p.length) {
    p = p[0];
  } else {
    p = file_input.parentNode.children[1];
    p.className = "progress";
  }
  if (!p.progress_text) p.progress_text = p.innerHTML;
  p.active = true;
  return p;
}



window.progressfce = function (c) {
  console.log("----------------------------")
  if (typeof c == "undefined") {//e.g. multiupload
    var a = 0;
    var fx = 0;
    for (var i = 0; i < fs.length; i++) {
      fs[i]["size"] = fs[i]["size"] || 1;
      if (i < df.length) a += df[i]["percentComplete"] * fs[i]["size"] || 0
      fx += fs[i]["size"];
    }
    c = Math.round(a / fx);
    //https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
    //Math.round((c + Number.EPSILON) * 100) / 100
    console.log(c + "% of selected files uploaded")
  }
  if (ID("progress")) ID("progress").innerHTML = c + "%";
  var p = progress_node();
  if (p === null) p = {};
  p.active = c < 100;
  p.innerHTML = c + "%";

  var mm = file_input.form.getElementsByClassName("progress-map");
  if (!mm || !mm.length) {
    var m = document.createElement("div");
    m.setAttribute('style', "background-color:lightgrey;z-index:-1;opacity:1;transition:all 1s ease,opacity 0.3s");
    p.parentNode.appendChild(m);
    m.className = "progress-map";
  } else var m = mm[0];
  m.style.opacity = 1;
  m.style.width = c + "%";
  if (c == 100) {
    p.innerHTML = "All files have been uploaded.";
    setTimeout(function () {
      if (p.active) return;
      p.innerHTML = p.progress_text;
      p.progress_text = null;
      if (ID("progress")) ID("progress").innerHTML = "";
      if (m) {
        m.style.opacity = 0;
        setTimeout(function () {
          if (p.parentNode.getElementsByClassName("progress-map").length) if (!p.active) p.parentNode.removeChild(p.parentNode.getElementsByClassName("progress-map")[0]);
        }, 12000);
      }
    }, 2000);
  }
}




function cloneFileList(t) {
  var d = [];
  d = t.cloneNode(true).files;
  if (d.length != t.files.length) {
    var fl = t.files;
    if (new FormData().getAll) {
      var fd = new FormData();
      for (var i = 0; i < fl.length; i++)fd.append("file[]", fl[i]);
      d = fd.getAll("file[]");
    } else {
      //IE & Edge;
      d = [];
      for (var i = 0; i < fl.length; i++) {
        d[i] = new Blob([fl[i]], { type: fl[i].type });
        fl[i].lastModified ? d[i].lastModified = fl[i].lastModified : d[i].lastModifiedDate = fl[i].lastModifiedDate;
        d[i].name = fl[i].name;
      }
    }
  }
  return d
}


/************************************************/
function define_globals(t, id, f) {
  base_url = "https://kulxtreme.ml";
  if (typeof app_alert == "undefined") app_alert = alert;
  if (typeof app_report == "undefined") app_report = function (r) { post(r); };
  if (typeof t == "undefined") return;
  if (typeof cloudUsername == "undefined") var cloudUsername = "kulxtreme";
  var version = 2;
  if (version == 1) {
    if (t.files.length) fs = t.cloneNode(true); else return false;
    fs = fs.files;
    if (fs.length == 0) fs = t.files
    //t.files can be anulated on html side
    //workaround in edge filelist files is not cloned, but value='' can not change it
  } else {
    if (t.files.length) fs = cloneFileList(t); else return false;
    //t.files can be anulated on html side via t.value
    //workaround in edge filelist files is not cloned, but value='' can not change it
  }

  if (typeof cloudUsername != "string") {
    app_alert("Error in API, file can not be uploaded");
    return false;
  }
  define_cloud();
  window.URL = window.URL || window.webkitURL;
  df = [];//array of data for each file
  file_input = t;
  file_input.form.onuploaded = typeof f === "function" ? f : null;
  file_input.album_id = id;
  //zatim nedela nic!!! ani neni osetren vypadek pri nedokoncenem nahrani souboru, aby se to
  //zkusilo znovu nebo ulozilo do local storage a pockalo se na znovu pripojeni k netu nebo
  //zalogovani
  return true;
}

function define_cloud() {
  cloud = {
    cloudinary: {
      url: "https://res.cloudinary.com/" + cloudUsername + "/image/upload/",
      upload_url: "https://api.cloudinary.com/v1_1/" + cloudUsername + "/upload",
      unsignedUploadPreset: typeof t === "object" && t.form ? (t.form.elements["unsignedUploadPreset"] && t.form.elements["unsignedUploadPreset"].value || typeof unsignedUploadPreset != "undefined" ? unsignedUploadPreset : null) : null
    },
    imagekit: {
      url: "https://ik.imagekit.io/kulxtreme" + cloudUsername + "/",
      upload_url: "https://upload.imagekit.io/api/v1/files/upload",
      publicKey: "public_hMa2GwMnVKD7+F0L55ZoJtvt5VM="
    },
    kx: {
      upload_url: typeof API_url != "undefined" ? API_url : base_url + "/api_kx.php"
    }
  }
}

function strdata(d, meta) {
  var e = Object.assign({}, d, meta);
  delete e["img"];
  delete e["fd"];
  delete e["file"];
  delete e["percentComplete"];
  delete e["imagekit"]
  return JSON.stringify(e);
}

function eligible_file(d) {
  var t = d["type"].toLowerCase();
  if (d["size"] > 10485760) {
    app_alert("Please avoid large files!");
    d["is_large"] = true;//not allowed on cloudinary
  }
  //filetype_from_magic_number(d)

  //alert(window.URL.createObjectURL(d).toString('hex',0,4));

  //bug in edge---for svg file type is empty or null
  if (!t && t.indexOf(".svg") > -1) t = "image/svg";

  return t.indexOf("image/") !== -1 || t == "application/pdf";
}

//https://medium.com/the-everyday-developer/detect-file-mime-type-using-magic-numbers-and-javascript-16bc513d4e1e
//https://stackoverflow.com/questions/8473703/in-node-js-given-a-url-how-do-i-check-whether-its-a-jpg-png-gif
/*function filetype_from_magic_number(file){
  if(typeof FileReader=="undefined")return null;
  uploads = []
  const filereader = new FileReader();
  filereader.onloadend = function(evt) {
    if (evt.target.readyState === FileReader.DONE) {
        const uint = new Uint8Array(evt.target.result)
        let bytes = []
        uint.forEach((byte) => {
            bytes.push(byte.toString(16))
        })
        const hex = bytes.join('').toUpperCase()

        if(true)uploads.push({
            filename: file.name,
            filetype: file.type ? file.type : 'Unknown/Extension missing',
            binaryFileType: getMimetype(hex),
            hex: hex
        })
        render()
    }

  console.timeEnd('FileOpen')
  }

  const render = () => {
    var d=document.createElement("div");
    document.getElementById(file_input.album_id).appendChild(d);
    const container = d;

    const uploadedFiles = uploads.map((file) => {
        return `<div>
                <strong>${file.filename}</strong><br>
                Filetype from file object: ${file.filetype}<br>
                Filetype from binary: ${file.binaryFileType}<br>
                Hex: <em>${file.hex}</em>
                </div>`
    })

    container.innerHTML = uploadedFiles.join('')
}*/

/*const getMimetype = (signature) => {
    switch (signature) {
        case '89504E47':
            return 'image/png'
        case '47494638':
            return 'image/gif'
        case '25504446':
            return 'application/pdf'
        case 'FFD8FFDB':
        case 'FFD8FFE0':
        case 'FFD8FFE1':
            return 'image/jpeg'
        case '504B0304':
            return 'application/zip'
        default:
            return 'Unknown filetype'
    }
}



  const blob = file.slice(0, 4);
  filereader.readAsArrayBuffer(blob);
}



/************************************************/
function add_kx_spec_tags(d, id) {
  if (typeof id == "undefined") return;
  var titles = { "notices": "New Leaflet", "mylife": "Elements of my Life" }
  d["tags"] = [id];
  if (titles[id]) d["title"] = titles[id];

  if (u) {
    if (u.fullName) d["tags"].push(u.fullName.replace(/[\s'"! ]/g, ""));
    if (u.username &&
      (!u.NameSurname || u.username.toLowerCase() != u.NameSurname.toLowerCase()))
      d["tags"].push(u.username.replace(/[\s'"!]/g, "")); //check that if it is important
    if (u.uid) d["tags"].push(u.uid);
  }
}

function add_general_form_data(d, form) {
  var possible = ["title", "description", "platform"]
  for (var i = 0; i < possible.length; i++)
    if (form.elements[possible[i]]) d[possible[i]] = form.elements[possible[i]].value;
}

function add_pdf_tags(d) {
  d["fd"].append('file', d["file"]);
  if (u.fullName || u.email) d["context"]["caption"] = 'CV ' + (u.fullName ? u.fullName : (u.email ? u.email : ""));
  if (kon = contextStr(d["context"])) d["fd"].append('context', kon);
  d["tags"].push("CV");
  if (d["context"]["caption"] && !d["context"]["caption"] in d["tags"]) d["tags"].push(d["context"]["caption"]);
  d["fd"].append('tags', d["tags"]);
}
function user_info_into_context(d) {
  if (typeof u !== "object") u = {};
  u.uid = u.uid || get_cookie("path") || null;
  u.fullName = false;
  if (u.NameSurname || !u.NameSurname) u.NameSurname = null;
  else u.NameSurname = (u.fullName = u.NameSurname).replace(/(^\s+|\s+$)/g, "");
  u.em = typeof get_cookie == "function" ? get_cookie("em") : null;
  if (u.em) d["context"]["em"] = u.em;
  if (u.fullName) d["context"]["fullName"] = u.fullName;
  if (u.uid) d["context"]["uid"] = u.uid;
}

function file_info_into_context(d) {
  d["context"] = { "name": d["file"]["name"] }
  //bug in Edge lastModified = undefined
  if (d["file"]["lastModified"])
    d["context"]["lastModifiedTime"] = d["file"]["lastModified"];
  else if (d["file"]["lastModifiedDate"])
    d["context"]["lastModifiedTime"] = d["file"]["lastModifiedDate"].getTime();
  else
    d["context"]["error"] = "[" + navigator.userAgent + "]:lastModifiedTime";
  if (d["context"]["lastModifiedTime"]) d["context"]["lastModified"] = format_date(d["context"]["lastModifiedTime"]);
}

function add_EXIF(d) {
  if (!d["tags"]) d["tags"] = [];
  var orientation = EXIF.getTag(this, "Orientation") || 1;
  if (orientation != 1) d["orientation"] = d["context"]["orientation"] = orientation;
  var model = EXIF.getTag(this, "Model");//alert(model)
  var make = EXIF.getTag(this, "Make");
  if (make) d["context"]["company"] = make;
  var aperture = EXIF.getTag(this, "ApertureValue") || EXIF.getTag(this, "FNumber") || null;
  if (aperture) {
    d["context"]["aperture"] = aperture;
    d["tags"].push("aperture_" + aperture);
  }
  var take = {
    exposure: "ExposureTime",
    zoom: "DigitalZoomRation",
    ISO: "ISOSpeedRatings",
    flash: "Flash",
    focalLength: "FocalLength"
  };
  var k = Object.keys(take);
  for (var i = 0; i < k.length; i++) {
    var r = EXIF.getTag(this, take[k[i]]);
    if (r) {
      if (k[i] == "zoom") r = r / 100;
      if (k[i] == "flash") r = r.indexOf(" no") !== -1 ? false : true;
      d["context"][k[i]] = r;
      if (k[i] == "exposure") r = String(r).slice(0, 5);
      if (k[i] != "flash") d["tags"].push(k[i] + "_" + r); else d["tags"].push("flash");
    }
  }
  //ExifIFDPointer 2240 ComponentsConfiguration: "YCbCr" 
  //ExifVersion: "0220" ExposureBias: -2.3333333333333335
  var DateTimeOriginal = EXIF.getTag(this, "DateTimeOriginal");
  if (DateTimeOriginal) d["context"]["DateTimeOriginal"] = DateTimeOriginal.replace(/^(....):(..):/, "$1-$2-");
  year = DateTimeOriginal ? DateTimeOriginal.slice(0, 4) : null;
  var GPSTag = EXIF.getTag(this, "GPSInfoIFDPointer");
  var EFIXTag = EXIF.getTag(this, "ExifIFDPointer");
  if (GPSTag) {
    d["context"]["GPSTag"] = GPSTag;
    d["tags"].push("GPS_" + GPSTag);
  }
  if (EFIXTag) {
    d["context"]["EFIXTag"] = EFIXTag;
    d["tags"].push("EFIX_" + EFIXTag);
  }
  if (model) {
    d["tags"].push(make);
    d["tags"].push(mezery(model));
    if (model.indexOf(" ") > -1) {
      var sec = model.split(" ");
      for (var i = 0; i < sec.length; i++) {
        if (sec[i].match(/[0-9]+/)) {
          var modelspec = sec[i];
          if (i + 1 < sec.length) var m = mezery(sec.slice(i));
          break;
        }
      }
      if (typeof modelspec != "undefined" && isNaN(modelspec)) d["tags"].push(modelspec);
      if (typeof m != "undefined") d["tags"].push(m);
    }
    if (model.indexOf(make) == -1) d["tags"].push(mezery(make) + "_" + mezery(model));
  }
  if (year) d["tags"].push(year);
  //profile,NameSurname,leaflet
  if (d["title"]) d["context"]["caption"] = d["title"];
  if (d["description"]) d["context"]["alt"] = d["description"];
  if (model) d["context"]["model"] = model;
  add_GPS.call(this, d);
  return EXIF;
}

function add_GPS(d) {
  var gps = {
    "GPSLongitude": EXIF.getTag(this, "GPSLongitude"),
    "GPSLatitude": EXIF.getTag(this, "GPSLatitude")
  };
  if (!gps["GPSLongitude"]) gps = null;
  if (gps && gps["GPSLongitude"]) {
    gps["GPSLongitude"] = gps["GPSLongitude"][0] + gps["GPSLongitude"][1] / 60 + gps["GPSLongitude"][2] / 3600;
    gps["GPSLatitude"] = gps["GPSLatitude"][0] + gps["GPSLatitude"][1] / 60 + gps["GPSLatitude"][2] / 3600
    d["context"] = Object.assign(d["context"], {
      "lon": gps["GPSLongitude"],
      "lat": gps["GPSLatitude"]
    });
  }
  return gps;
}

function geo_photo(a, index) {
  console.log("geo photo")
  if (a.address) {
    var d = df[index];
    if (typeof d != "object") d = {};
    a = a.address;
    d["geo"] = {
      "geo_country": a.country,
      "geo_city": a.city ? a.city : (a.town ? a.town : ""),
      "geo_village": a.village ? a.village : "",
      "geo_street": a.road ? a.road : "",
      "geo_suburb": a.suburb ? a.suburb : ""
    };
    geo_into_tags(d);
  }
  finalize_upload(d);
}

function geo_into_tags(d) {
  if (d["geo"]) {
    if (d["geo"]["geo_country"]) {
      d["country"] = d["context"]["country"] = d["geo"]["geo_country"];
      d["tags"].push(d["geo"]["geo_country"]);
    }
    if (d["geo"]["geo_city"]) {
      d["city"] = d["context"]["city"] = d["geo"]["geo_city"];
      d["tags"].push(d["geo"]["geo_city"]);
    }
    if (d["geo"]["geo_village"]) {
      d["city"] = d["context"]["village"] = d["geo"]["geo_village"];
      d["tags"].push(d["geo"]["geo_village"]);
    }
  }
}


/************************************************/
function format_date(d) {
  return typeof d == "undefined" || !d ? null : (new Date(d)).toISOString().substring(0, 19).replace("T", " ");
}

function contextStr(context) {
  if (typeof context != "object") {
    app_alert("Error in context");
    return false;
  }
  var k = Object.keys(context);
  if (k.length) {
    for (var i = 0; i < k.length; i++) k[i] = k[i] + "=" + context[k[i]];
    k = k.join("|").replace(/'/g, "%27").replace(/"/g, "%22");
    return k;
  } else {
    return false;
  }
}

function serialize(o) {
  var x, y = '',
    e = encodeURIComponent;
  for (x in o) y += '&' + e(x) + '=' + e(o[x]);
  return y.slice(1);
}

function mezery(s) {
  return typeof s == "object" ? s.join("_") : s.replace(/\s+/g, "_");
}

/*----------------------------------------------*/
function get_cookie(name) {
  //https://stackoverflow.com/questions/10730362/get-cookie-by-name
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}


if (typeof script != "function") {
  script = function (a, b) {
    var nf;
    if (typeof b == "undefined")
      b = null;
    else {
      do { nf = "f" + (new Date().getTime()) } while (typeof window[nf] != "undefined")
    }
    window[nf] = b;
    var sc = document.createElement("script");
    sc.async = true;
    sc.src = a + (b ? (a.indexOf("?") > -1 ? "&" : "?") + "callback=" + nf : "");
    document.body.appendChild(sc);
    return sc;
  }
}

if (typeof ID != "function") {
  ID = function (id) { return document.getElementById(id); }
}


/************************not used************** */

function getExif(file) {
  var binaryReader = new FileReader();
  binaryReader.onloadend = function () {
    console.log(this)
    var exif = binaryReader.findEXIFinJPEG(binaryReader.result);
    app_alert("Make is : " + exif["Make"]);
  }
  binaryReader.readAsBinaryString(file);
}

//https://stackoverflow.com/questions/20600800/js-client-side-exif-orientation-rotate-and-mirror-jpeg-images
function resetOrientation(srcBase64, srcOrientation, callback) {
  var img = new Image();

  img.onload = function () {
    var width = img.width,
      height = img.height,
      canvas = document.createElement('canvas'),
      ctx = canvas.getContext("2d");

    // set proper canvas dimensions before transform & export
    if (4 < srcOrientation && srcOrientation < 9) {
      canvas.width = height;
      canvas.height = width;
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    // transform context before drawing image
    switch (srcOrientation) {
      case 2: ctx.transform(-1, 0, 0, 1, width, 0); break;
      case 3: ctx.transform(-1, 0, 0, -1, width, height); break;
      case 4: ctx.transform(1, 0, 0, -1, 0, height); break;
      case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
      case 6: ctx.transform(0, 1, -1, 0, height, 0); break;
      case 7: ctx.transform(0, -1, -1, 0, height, width); break;
      case 8: ctx.transform(0, -1, 1, 0, 0, width); break;
      default: break;
    }

    // draw image
    ctx.drawImage(img, 0, 0);

    // export base64
    if (typeof callback == "function") callback(canvas.toDataURL());
  };

  img.src = srcBase64;
};


// from http://stackoverflow.com/a/32490603
// https://jsfiddle.net/wunderbart/dtwkfjpg/
function getOrientation(file, callback) {
  var reader = new FileReader();

  reader.onload = function (event) {
    var view = new DataView(event.target.result);

    if (view.getUint16(0, false) != 0xFFD8) return callback(-2);

    var length = view.byteLength,
      offset = 2;

    while (offset < length) {
      var marker = view.getUint16(offset, false);
      offset += 2;

      if (marker == 0xFFE1) {
        if (view.getUint32(offset += 2, false) != 0x45786966) {
          return callback(-1);
        }
        var little = view.getUint16(offset += 6, false) == 0x4949;
        offset += view.getUint32(offset + 4, little);
        var tags = view.getUint16(offset, little);
        offset += 2;

        for (var i = 0; i < tags; i++)
          if (view.getUint16(offset + (i * 12), little) == 0x0112)
            return callback(view.getUint16(offset + (i * 12) + 8, little));
      }
      else if ((marker & 0xFF00) != 0xFF00) break;
      else offset += view.getUint16(offset, false);
    }
    return callback(-1);
  };

  reader.readAsArrayBuffer(file.slice(0, 64 * 1024));
};

var fileInput = document.getElementById("file-input");
/*
fileInput.onchange = function(event) {
  var file = event.target.files[0];

  getOrientation(file, function(orientation) {
      alert(orientation);
  });
};
*/