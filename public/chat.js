
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
        Notification.requestPermission();
        return;
      }

      // status is "granted", if accepted by user
      Notification.requestPermission(function(status) {
        var USERCLICK = true;
        var n = new Notification('New Message', {
          body: msg,
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
  var socket = io('', {query:"room="+window.location.pathname.replace(/\/chat\//, '')});
  var content = document.getElementsByClassName("chatbox__messages__user-message")[0];
  var msgbox = document.getElementsByClassName("chatbox__msg-box")[0];
  var userlist = document.getElementsByClassName("chatbox__user-list")[0];
  var input = document.getElementById("input");
  var title = document.getElementsByTagName("h1")[0];
  var name = "", lastmsgname = "";
  var fp = getCanvasFp();
  // var sendTime;

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
      title.innerHTML = "Welcome to AMayCom v2.0, " + user;
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

      if (lastmsgname != data.username){
        msghtml += (lastmsgname==""?"":"</div>")+ `
        <div class="chatbox__messages__user-message--ind-message chatbox__messages__${data.username==user?"right":"left"}">
        <p class="name">${data.username}</p>
        <br/>
        <p class="message">${data.message}
        `;
      } else {
        msghtml += `
        <br/>
        ${data.message}
        `;
      }
      lastmsgname = data.username;

      if(!document.hasFocus()){
        newExcitingAlerts();
        notify(data.message);
      }

      content.innerHTML = msghtml + '</p></div>';
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
    var text = urlify(input.innerHTML.replace(/&nbsp;/gi, ''));
    if (text!=""){
      // sendTime = new Date();
      socket.emit('send', { message: text, username: user });
      input.innerHTML = "";
      if (IFFOCUS) {input.focus();}
    }
  };


  input.onkeydown = function() {
    if(event.keyCode == 13) {
      sendMessage(true);
      return false;
    }
  }

  // mobile specific code
  if (input.clientWidth == userlist.clientWidth){
    var container =  document.getElementsByClassName("container")[0];
    var msgboxOldHeight = msgbox.clientHeight;

    function setEndOfContenteditable(contentEditableElement)
    {
      var range,selection;
      range = document.createRange();//Create a range (a range is a like the selection but invisible)
      range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
      range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
      selection = window.getSelection();//get the selection object (allows you to change selection)
      selection.removeAllRanges();//remove any selections already made
      selection.addRange(range);//make the range you have just created the visible selection
    }

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