
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function urlify(text) {
  var urlRegex = kLINK_DETECTION_REGEX = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|cc|cn|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
  return text.replace(urlRegex, function(url) {
    var urldisp = url;
    if (urldisp.length>=70){
      urldisp = urldisp.substr(0,70) +"...";
    }
    return '<a href="' + url + '" target="_blank" style="color:white;">' + urldisp + '</a>';
  })
}


function getCanvasFp() {
  var d1 = new Date();
  var canvas = document.createElement("canvas");
  canvas.width = 2000;
  canvas.height = 200;
  canvas.style.display = "inline";
  var ctx = canvas.getContext("2d");
  // detect browser support of canvas winding
  // http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/
  // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/canvas/winding.js
  ctx.rect(0, 0, 10, 10);
  ctx.rect(2, 2, 6, 6);

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  // https://github.com/Valve/fingerprintjs2/issues/66
  ctx.font = "11pt Arial";
  ctx.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.2)";
  ctx.font = "18pt Arial";
  ctx.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03", 4, 45);

  // canvas blending
  // http://blogs.adobe.com/webplatform/2013/01/28/blending-features-in-canvas/
  // http://jsfiddle.net/NDYV8/16/
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgb(255,0,255)";
  ctx.beginPath();
  ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(0,255,255)";
  ctx.beginPath();
  ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(255,255,0)";
  ctx.beginPath();
  ctx.arc(75, 100, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(255,0,255)";
  // canvas winding
  // http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/
  // http://jsfiddle.net/NDYV8/19/
  ctx.arc(75, 75, 75, 0, Math.PI * 2, true);
  ctx.arc(75, 75, 25, 0, Math.PI * 2, true);
  ctx.fill("evenodd");
  var d2 = new Date();
  console.log(d2-d1);

  var data = canvas.toDataURL();
  var hash = 0, i, chr;
  for (i = 0; i < data.length; i++) {
    chr   = data.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};



window.onload = function() {

  systemMessage = function(message){
    if (message == "#RELOAD#"){
      systemMessage("Reloading");
      socket.disconnect();
      window.name = "";
      location.reload();
      return;
    }
    msghtml += (lastmsgname==""?"":"</div>")+ "<br/><div class='system'>"+message+"</div>";
    lastmsgname = "";
    content.innerHTML = msghtml;
    window.name = msghtml;
    msgbox.scrollTop = msgbox.scrollHeight;
  }



  var notificationset = new Set();
  function notify(msg) {

    if (!NOTIFYON){
      return;
    }

    if(window.Notification && Notification.permission !== "denied") {
      if (msg == undefined){
        Notification.requestPermission(function (result) {
          systemMessage("Permission " + result);
        });
        return;
      }

      // status is "granted", if accepted by user
      Notification.requestPermission(function(status) {
        var USERCLICK = true;
        var n = new Notification('New Message', {
          body:  msg.replace(/(<img[^>]*)(\/?>)/, '[IMAGE RECIEVED]'),
          //requireInteraction: true,
          icon: 'Chrome-Push-Notifications-Browser.png' // optional
        });
        notificationset.add(n);
        n.onclick = function(){
          n.close();
          USERCLICK = false;
          window.focus();
        }
        n.onclose = function(){
          notificationset.delete(n);
          if (USERCLICK){
            NOTIFYON = false;
            userstatus = "busy";
            socket.emit('updateuser', {username:user, status:userstatus,fingerprint:fp});
            notificationset.forEach(function(notification){
              notification.close();
              notificationset.delete(n);
            });
          }
        }
        setTimeout(function(){USERCLICK = false; n.close();},10000);
      });
    }
  }

  newExcitingAlerts = (function () {
    var oldTitle = document.title;
    var msg = "New Message";
    var timeoutId;
    var blink = function() { document.title = document.title == msg ? ' ' : msg; };
    var clear = function() {
      clearInterval(timeoutId);
      document.title = oldTitle;
      if (!NOTIFYON){
        NOTIFYON = true;
        userstatus = "active";
        socket.emit('updateuser', {username:user, status:userstatus,fingerprint:fp});
      }
      window.onmousemove = resetTimer;
      window.onmousedown = resetTimer;
      window.onclick = resetTimer;
      window.onscroll = resetTimer;
      window.onkeyup = resetTimer;
      window.onfocus = resetTimer;
      timeoutId = null;

    };
    return function () {
      if (!timeoutId) {
        timeoutId = setInterval(blink, 1000);
        var TmpFunc = function(){
          clear();
          resetTimer();
        };
        window.onmousemove = TmpFunc;
        window.onmousedown = TmpFunc;
        window.onclick = TmpFunc;
        window.onscroll = TmpFunc;
        window.onkeyup = TmpFunc;
        window.onfocus = TmpFunc;
      }
    };
  }());

  var changeBackgroundColor = function(){

    var COLORFUL = true;
    return function(){
      COLORFUL = !COLORFUL;
      if (COLORFUL){
        document.body.style.background = "linear-gradient(120deg, #17bebb, #f0a6ca)";
      } else {
        document.body.style.background= "rgba(0, 0, 0, 0.9)";
      }
      setCookie("colorful",COLORFUL?"Y":"N");
    }
  }();

  var NOTIFYON = true;
  var userstatus = "active";
  var socket = io('', {path:'/chatio/socket.io', query:"room="+window.location.pathname.replace(/\/chat\//, '')});
  var content = document.getElementsByClassName("chatbox__messages__user-message")[0];
  var msgbox = document.getElementsByClassName("chatbox__msg-box")[0];
  var userlist = document.getElementsByClassName("chatbox__user-list")[0];
  var input = document.getElementById("input");
  var title = document.getElementsByTagName("h1")[0];
  var name = "", lastmsgname = "";
  var fp = getCanvasFp();
  // var sendTime;


  window.onresize = function(){
    msgbox.scrollTop = msgbox.scrollHeight;
  }

  // Modal 
  this.modalImg = document.getElementById("img01");
  this.modal = document.getElementById('myModal');
  this.modalfcn = function(obj){
    modal.style.display = "block";
    modalImg.src = obj.src;
    modalImg.style["max-height"] = "90%";
    modalImg.style["max-width"] = "90%";
    modalImg.style.height = "auto";
    modalImg.style.width = "auto";
    slope = modalImg.height / modalImg.width;
  }

  modal.onwheel = function(e) {
    e.preventDefault();
    xoffset = modalImg.width>window.innerWidth? modal.scrollLeft : (modalImg.width - window.innerWidth)/2;
    yoffset = modalImg.height>window.innerHeight? modal.scrollTop: (modalImg.height - window.innerHeight)/2;;

    var h = modalImg.height;
    var change_h = h - e.deltaY;
    change_h = Math.min(change_h,3000);
    var change_w = change_h/slope;

    if (change_w>4000){
      change_w = 4000;
      change_h = change_w*slope;
    }

    modalImg.style["max-height"] = "3000px";
    modalImg.style["max-width"] = "4000px";
    modalImg.style.height = change_h.toString() + "px";
    modalImg.style.width = change_w.toString() + "px";

    xoffset = (xoffset + window.innerWidth/2)*change_h/h - window.innerWidth/2;
    yoffset = (yoffset + window.innerHeight/2)*change_h/h - window.innerHeight/2;
    
    modal.scrollTo(xoffset,yoffset);

}

  // When the user clicks on <span> (x), close the modal
  var span = document.getElementsByClassName("close")[0];
  span.onclick = function() { 
    modal.style.display = "none";
  }

  modal.onclick = function(){
    //if (modal.style.display=="block"){
    if (!moveFlag) {
      modal.style.display = "none";
    }
      
    //}
  }

  
 /* Handle paste events */
 window.addEventListener("paste", function pasteHandler(e) {
    // We need to check if event.clipboardData is supported (Chrome)
    //e.preventDefault();
    if (e.clipboardData) {
       // Get the items from the clipboard
       var items = e.clipboardData.items;
       if (items) {
          var prev = "";
          // Loop through all items, looking for any kind of image
          for (var i = 0; i < items.length; i++) {
            
             if (items[i].type.indexOf("image") !== -1) {
                // We need to represent the image as a file,
                var blob = items[i].getAsFile();
                // and use a URL or webkitURL (whichever is available to the browser)
                // to create a temporary URL to the object
                var URLObj = window.URL || window.webkitURL;
                var source = URLObj.createObjectURL(blob);
                 
                // The URL can then be used as the source of an image
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                
                reader.onload = function () { 
                  if (!prev){
                    input.innerHTML += `<img src="${reader.result}"  onclick="modalfcn(this)">`;
                  } else if (prev == "file"){
                    //input.innerHTML = input.innerHTML.replace(/<img[^>]*("file:\/\/[^>^"]*")\/?>/, 
                    input.innerHTML = input.innerHTML.replace(/<img[^>]*("file:\/\/((?!(modalfcn|>)).)*")\/?>/, 
                      `<img src="${reader.result}" onclick="modalfcn(this)">`);
                  }
                  moveToEnd();
                };
                prev = "";
                
             } else{
              items[i].getAsString(str => {
                //var re = /(<img[^>]*)(\/?>)/;
                var reimg = /(<img((?!(modalfcn|>)).)*)(\/?>)/;
                var redivL = /<div/g;
                var redivR = /div>/g;
                if (str.indexOf('file:\/\/')==-1){
                    prev =  str;
                    setTimeout(function(){
                      input.innerHTML = input.innerHTML.replace(reimg, '$1 onclick="modalfcn(this)"$4')
                                                       .replace(redivL, '<span').replace(redivR, 'span><br>');

                      moveToEnd();
                    },0);
                        
                } else {
                  prev = "file";
                }
              });
             }
          }
       }
    // If we can't handle clipboard data directly (Firefox), 
    // we need to read what was pasted from the contenteditable element
    } else {
       // This is a cheap trick to make sure we read the data
       // AFTER it has been inserted.
       setTimeout(checkInput, 1);
    }
 });

 window.addEventListener('copy', function(e){
  e.clipboardData.setData('text/plain', window.getSelection().toString());  
  e.preventDefault(); // We want to write our data to the clipboard, not data from any user selection

});



  if (getCookie("colorful") === "N"){
    changeBackgroundColor();
  }

  var msghtml = "";
  if (window.name && window.name != "window"){
    msghtml = window.name;
    lastmsgname = "#system";
  }


  input.focus();

  var cookiename = getCookie("username");
  var user = cookiename;
  if (user == "") {
    while (user == "" || user == null) {
      user = prompt("Please enter your name:", "");
    }
  }

  socket.on('command', function(data){
    switch (data.command){
      case 'connected':
      socket.emit('updateuser', {username:user, status:"new"+userstatus,fingerprint:fp});
      break;

      case 'duplicatedname':
      do {
        user = prompt("Duplicated name, please enter another name:", "");
      } while (user == "" || user == null);
      socket.emit('updateuser', {username:user, status:"new"+userstatus,fingerprint:fp});
      break;

      case 'validname':
      if (user != cookiename){
        setCookie("username", user, 365);
      }
      title.innerHTML = "Welcome to AMayCom v2.1, " + user;
      systemMessage("Connected to the server");
      msgbox.scrollTop = msgbox.scrollHeight;
      break;
      default:
    }
  });

  notify();


  socket.on('message', function (data) {

    if(data.message) {
      if (data.username === "#system"){
        systemMessage(data.message);
        return;
      }

      // if (data.username == user){
      //   systemMessage("Lag: " + ((new Date())-sendTime));
      // }
      time = (new Date(data.time)).toLocaleTimeString();
      if (lastmsgname != data.username){
        msghtml += (lastmsgname==""?"":"</div>")+ `
        <div class="chatbox__messages__user-message--ind-message chatbox__messages__${data.username==user?"right":"left"}">
        <p class="name">${data.username}</p>
        <br/>
        <p class="message" title="${time}">${data.message}</p>
        `;
      } else {
        msghtml += `
        <br/>
        <p class="message" title="${time}">${data.message}</p>
        `;
      }
      lastmsgname = data.username;

      if(!document.hasFocus()){
        newExcitingAlerts();
        notify(data.message);
      }

      content.innerHTML = msghtml + '</div>';
      window.name = msghtml;
      msgbox.scrollTop = msgbox.scrollHeight;
    } else {
      console.log("There is a problem:", data);
    }
  });

  socket.on('userlist', function(data){
    //console.log(data);
    if (data[user]==="busy"){
      NOTIFYON = false;
      userstatus = "busy";
    }
    var html = "<h1>User List</h1>";
    Object.keys(data).forEach(function(key){
      html +=
      `
      <div class='chatbox__user--${data[key]}'>
      <p>${key}</p>
      </div>
      `;
    });
    userlist.innerHTML = html;
  });

  socket.on('disconnect', function(data){
    systemMessage("Disconnect from the server")
  });


  sendMessage = function(IFFOCUS) {
    var text = urlify(input.innerHTML.replace(/&nbsp;/gi, '\u00a0'));

    if (text!=""){
      // sendTime = new Date();
      if (text === "!@#$%NOTIFY"){
        Notification.requestPermission(function (result) {
          systemMessage("Permission " + result);
        });
      } else {
        socket.emit('send', { message: text, username: user });
      }
      input.innerHTML = "";
      if (IFFOCUS) {input.focus();}
    }
  };

  moveToEnd = function(){      
    var range = document.createRange();
    var sel = window.getSelection();
    var nNode = input.childNodes.length;
    range.setStart(input, nNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    input.focus();
  }


  input.onkeydown = function(event) {
    if(event.keyCode == 13) {
      sendMessage(true);
      return false;
    }

    if (event.keyCode == 9) {
      event.preventDefault();
      var doc = input.ownerDocument.defaultView;
      var sel = doc.getSelection();
      var range = sel.getRangeAt(0);
  
      var tabNode = document.createTextNode("\u00a0\u00a0\u00a0\u00a0");
      range.insertNode(tabNode);
  
      range.setStartAfter(tabNode);
      range.setEndAfter(tabNode); 
      sel.removeAllRanges();
      sel.addRange(range);
    } 
  }

  // var prevInput = ["",""];
  // input.oninput = function(){
  //   prevInput[0] = prevInput[1];
  //   prevInput[1] = input.innerHTML;
  // }

  document.onkeyup=function(e){
    var e = e || window.event; // for IE to cover IEs window event-object
    if(e.altKey && e.which == 112) {
      input.innerHTML = '!@#$%';
      moveToEnd();
      return false;
    }
    if(e.altKey && e.which >=49 && e.which <=57) {
      e.preventDefault();
      input.innerHTML += `<img src="img/emoji${String.fromCharCode(e.which)}.png" style="max-width:250px;" onclick="modalfcn(this)">`
      moveToEnd();
      return false;
    }
    if(e.ctrlKey && e.which == 90){

    }
  }

  // mobile specific code
  if (input.clientWidth == userlist.clientWidth){
    var container =  document.getElementsByClassName("container")[0];
    var msgboxOldHeight = msgbox.clientHeight;


    var USERSEND = true;
    var KEYBOARDON = false;
    container.onclick =  function(e) {
      if (e.target.className == "inputfield"){
        // for initial mesages
        if (msgbox.clientHeight > content.clientHeight*2){
          msgbox.style.height = msgboxOldHeight/2 + 'px';
          window.scrollTo(0,0);
          document.body.scrollTop = 0;
        } else {
          window.scrollTo(0,document.body.scrollHeight);
        }
        input.focus();
        KEYBOARDON = true;
        USERSEND = true;
      } else {
        USERSEND = false;
        if (KEYBOARDON){
          document.activeElement.blur();
        }
      }
    }

    input.onfocus = function(){
      setEndOfContenteditable(input);
    }

    document.addEventListener('focusout', function(){
      msgbox.style.height = msgboxOldHeight + 'px';
      if (USERSEND && input.innerHTML != "" && input.innerHTML != "<br>"){
        sendMessage(false);
      }
      KEYBOARDON = false;
    });
  } else {
    window.addEventListener('mousedown', function(e){
      if (e.target.tagName == 'DIV' && e.target.className != 'inputfield'){
        e.preventDefault();
      }
    }, false);
  }


  title.onclick = function(){
    var usertmp = prompt("Please enter your new name:", "");
    if (usertmp != "" && usertmp != null) {
      user = usertmp;
      socket.disconnect();
      socket.connect();
    }
  }

  window.onbeforeunload = function(){
    socket.disconnect();
    notificationset.forEach(function(notification){
      notification.close();
      notificationset.delete(n);
    });
  }

  window.ondblclick = changeBackgroundColor;

  // Idle functions
  var t;
  window.onmousemove = resetTimer;
  window.onmousedown = resetTimer; // catches touchscreen presses
  window.onclick = resetTimer;     // catches touchpad clicks
  window.onscroll = resetTimer;    // catches scrolling with arrow keys
  window.onkeyup = resetTimer;
  window.onfocus = resetTimer;
  //input.oninput = resetTimer;
  resetTimer();

  function setIdle() {
    if (userstatus === "active"){
      userstatus = "away";
      socket.emit('updateuser', {username:user, status:userstatus,fingerprint:fp});
    }
  }

  function resetTimer() {
    NOTIFYON = true;
    clearTimeout(t);
    if (userstatus !== "active"){
      userstatus = "active";
      socket.emit('updateuser', {username:user, status:userstatus,fingerprint:fp});
    }
    t = setTimeout(setIdle, 300000);  // time is in milliseconds  
  }

}


