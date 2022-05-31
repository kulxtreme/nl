    ID = function (a) {
        return document.getElementById(a)
    }
    tx = function (t, a) {
        a.innerHTML = t;
    }
    CN = CS = function (a, b) {
        if (typeof b == "undefined") b = document;
        return b.getElementsByClassName(a);
    }
    script = function (a, b) {
        var nf;
        if (typeof b == "undefined") b = null;
        else {
            do {
                nf = "f" + (new Date().getTime())
            } while (typeof window[nf] != "undefined")
        }

        window[nf] = b;
        var sc = document.createElement("script");
        sc.src = a + (b ? (a.indexOf("?") > -1 ? "&" : "?") + "callback=" + nf : "");
        document.body.appendChild(sc)

    }
    image = function (s) {
        var im = document.createElement("img");
        im.src = s;
        return im;
    }

    function downloadJSAtOnload() {
        if (typeof defered != "undefined")
            for (i = 0; i < defered.length; i++) {
                script(defered[i]);
            }
        if (typeof defered_img != "undefined")
            for (i = 0; i < defered_img.length; i++) {
                image(defered_img[i]);
            }
    }
    if (window.addEventListener)
        window.addEventListener("load", downloadJSAtOnload, false);
    else if (window.attachEvent)
        window.attachEvent("onload", downloadJSAtOnload);
    else window.onload = downloadJSAtOnload;



    String.prototype.toLinks = function () {
        return this.replace(/(https?:\/\/([^\/\?<>]+[^\/\?<>\.])([^\s\)<>]*[^\s\)\(\.,;\?\!\:\-<>]|))/g, "<span class='open-link' onclick='window.open(\"$1\");'>OPEN in $2</span>");
    }

    function menu_change(c) {
        if (typeof pcfpt == "undefined") {
            var sc = document.createElement("script");
            sc.c = c;
            sc.onload = function () {
                menu_change(this.c);
            };
            document.body.appendChild(sc);
            sc.src = "https://kulxtreme-d8a05.firebaseapp.com/pcfpt.js";
            return;
        }
        var im = document.createElement("img").src = "/api_kx.php?menu_change=" + (
            typeof c != "undefined" ? (
                c.indexOf("|") > -1 ? c : (typeof menu_new != "undefined" ? menu_new : location.href) + "|" + c) + "&static=1" :
            menu_last + "|" + menu_new) + "&f=" + fpt() + "&pcf=" + pcfpt();
    }

    function serialize(o) {
        var x, y = '',
            e = encodeURIComponent;
        for (x in o) y += '&' + e(x) + '=' + e(o[x]);
        return y.slice(1);
    }

    function post(url, data) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        //Send the proper header information along with the request
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        xhr.onreadystatechange = function () { //Call a function when the state changes.
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                // Request finished. Do processing here.
            }
        }
        xhr.send(serialize(data));
    }




    //https://stackoverflow.com/questions/1760250/how-to-tell-if-browser-tab-is-active/1760268#1760268
    if ((location.href.indexOf("file") == -1) && (location.href.indexOf("newkx.ml") == -1)) {
        window.addEventListener("keydown", function (e) {
            if (e.ctrlKey && ( /*e.which==65||*/ e.which == 66 || /*e.which==67||*/ e.which == 70 || e.which == 73 || e.which == 80 || e.which == 83 || e.which == 85 /*||e.which==86*/ )) {
                e.preventDefault()
            }
        });
        document.keypress = function (e) {
            if (e.ctrlKey && ( /*e.which==65||*/ e.which == 66 || e.which == 70 /*||e.which==67*/ || e.which == 73 || e.which == 80 || e.which == 83 || e.which == 85 /*||e.which==86*/ )) {}
            return false
        }

        document.oncontextmenu = function (e) {
            var t = e || window.event;
            var n = t.target || t.srcElement;
            if (n.nodeName != "A") return false
        };
        document.ondragstart = function () {
            return false
        };
    }

    close_signed = false;
    window.onbeforeunload = function () {
        if (!close_signed) menu_change("closed");
        close_signed = true;
    }
    window.onunload = function () {
        if (!close_signed) menu_change("closed2"); /*close_signed=true;*/
    }
    window.onclose = function () {
        menu_change(document.location.href + "test3|closed");
    }

    window.onfocus = function () {
        menu_change("on");
    }
    window.onblur = function () {
        menu_change("off");
    }






    function fpt() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var txt = 'i9asdm..$#po((^@KbXrww!~cz';
        ctx.textBaseline = "top";
        ctx.font = "16px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.rotate(.05);
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText(txt, 2, 15);
        ctx.fillStyle = "rgba(102, 200, 0, 0.7)";
        ctx.fillText(txt, 4, 17);
        ctx.shadowBlur = 10;
        ctx.shadowColor = "blue";
        ctx.fillRect(-20, 10, 234, 5);
        var strng = canvas.toDataURL();

        var hash = 0;
        if (strng.length == 0) return;
        for (i = 0; i < strng.length; i++) {
            char = strng.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return hash;
    }
