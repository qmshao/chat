const express = require("express");
const fs = require("fs");
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {path: '/chatio'});

var port = 3700;

//var chathtml = fs.readFileSync("chat.html", "UTF-8").toString();
var filecache = {};
const exec = require('child_process').exec;

// const emoji = JSON.parse(fs.readFileSync('emoji.json', 'utf8'));
// var emojicache = {};
// for (var emo in emoji){
//   emojicache[emo] = new Buffer(emoji[emo].split(",")[1], 'base64');
// }


// app.get("/chat/img/*", function(req, res){
//   imgstr = req.path.substr(req.path.lastIndexOf('/') + 1);
  
//   if (imgstr in emojicache){
//     res.end(emojicache[imgstr]); 
//     res.writeHead(200, {
//       'Content-Type': 'image/png',
//       'Content-Length': emojicache[imgstr].length
//     });
//   } else{
//     res.send("ERROR");
//   }
// });

app.use("/chat/img",express.static('img'));


app.get("/chat/*", function(req, res){
  //console.log(req.query.room);
  var path = req.path.slice(6);
  if (path.indexOf('.')<0){
    path = "index.html";
  }
  // var ext = path.split('.').pop().toLowerCase();
  // var filetype;
  // if (ext.indexOf("htm")>=0 || ext.indexOf("htm")>=0 || ext.indexOf("htm")>=0 ){
  //   filetype = "UTF-8";
  // } else {
  //    filetype = "binary";
  // }
  filetype = "binary";

  if (filecache.hasOwnProperty(path)){
    res.end(filecache[path], filetype);
  } else {
    fs.readFile("public/"+path, filetype , function(err, file) {
      if(err) {
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }
      res.end(file,filetype);
      filecache[path] = file;
    });
  }
});


var userinfo = {};
var socketinfo = {};
var userlist = {};



server.listen(port);
console.log("Listening on port " + port);

var keyfile = fs.readFileSync('key.json','utf8');
var key = JSON.parse(keyfile).key;


io.sockets.on('connection', function (socket) {
    var room = socket.handshake.query.room;
    if (room==="") room = "default";

    if (!userinfo.hasOwnProperty(room)){
      userinfo[room] = {};
      socketinfo[room] = {};
      userlist[room] = {};
    }

    updateuserinfo = function(){
      console.log("Room "+ room +" client List");
      Object.keys(io.sockets.sockets).forEach(function(id) {
        if (socketinfo[room][id]){
          var name = socketinfo[room][id].username;
          if (name !== "#noname"){
            console.log('client: %s %s, %s, %d, %d', room, id, name,userinfo[room][name].fingerprint,userinfo[room][name].usercount);
          }
        }
      });
    }


    socket.join(room);
    socket.emit('command', { command: 'connected' });
    socket.on('send', function (data) {
        data.time = new Date();
        if (data.message.indexOf("!@#$%")==0){
          data.username = "#system";
          data.message = data.message.replace("!@#$%","");

          if (data.message.toLowerCase() == "restartproxy"){
            data.message = 'Squid Proxy Restart';
            io.to(room).emit('message', data);
            console.log("Restart Proxy");
            exec("echo '"+key+"' | sudo -S -k service squid restart", (error, stdout, stderr) => {
              console.log(`stdout: ${stdout}`);
              console.log(`stderr: ${stderr}`);
              if (error !== null) {
                console.log(`exec error: ${error}`);
              }
            });
            return;
          }

        }
        io.to(room).emit('message', data);
        console.log(data.username + " sent a message: " + data.message);
    });

    socket.on('updateuser', function (data) {
      // When unregistered socket is trying to connect
      if (data.status.indexOf("new")<0 && !socketinfo[room][socket.id]){
        return;
      }

      var name = data.username;
      console.log(data);
      if (data.status.indexOf("new")>=0){
        data.status = data.status.replace(/new/,"");
        socketinfo[room][socket.id]={};
        if ( userinfo[room].hasOwnProperty(name) && name !=="#system") {
          if (userinfo[room][name].fingerprint == data.fingerprint){
            userinfo[room][name].usercount += 1;
            socketinfo[room][socket.id].username = name;
            socket.emit('command', { command: 'validname' });
            console.log("another " + name + " is connected");
          } else {
            socket.emit('command', { command: 'duplicatedname' });
            socketinfo[room][socket.id].username = "#noname";
            console.log(name + " is a duplicated name");
          }
        } else {
          userinfo[room][name] = {usercount:1, status:"active", fingerprint:data.fingerprint, awaycount:0};
          socketinfo[room][socket.id].username = name;
          userlist[room][name] = "active";
          socket.emit('command', { command: 'validname' });
          console.log(name + " is connected");
        }
      }

      updateuserinfo();
      userlist[room][name] = "active";

      if (data.status === "away" && socketinfo[room][socket.id].status!=="away"){
        if (++userinfo[room][name].awaycount == userinfo[room][name].usercount){
          userlist[room][name] = "away";
        }
      } else if (data.status !== "away" && socketinfo[room][socket.id].status==="away"){
        userinfo[room][name].awaycount --;
      }

      if (data.status === "busy"){
        userlist[room][name] = "busy";
      }

      socketinfo[room][socket.id].status = data.status;
      //console.log(userinfo[room][name]);
      Object.keys(userinfo[room][name]).forEach(function(key){
        process.stdout.write(key+':'+userinfo[room][name][key] + ' ');
      });
      process.stdout.write('\n');

      io.to(room).emit('userlist', userlist[room]);
      console.log(userlist[room]);

    });


    socket.on('disconnect', function () {
      if (socketinfo[room][socket.id]){
        var name = socketinfo[room][socket.id].username;
        console.log("To delete "+name+" @"+socket.id);
        if (--userinfo[room][name].usercount == 0){
          delete userinfo[room][name];
          delete userlist[room][name];
          io.to(room).emit('userlist', userlist[room]);
        } else {
          if (socketinfo[room][socket.id].status === "away"){
            userinfo[room][name].awaycount--;
          }
          if (userinfo[room][name].awaycount == userinfo[room][name].usercount){
            userinfo[room][name].status="away";
            io.to(room).emit('userlist', userlist[room]);
          }
        }
        delete socketinfo[socket.id];
        console.log(socketinfo[room][socket.id].username + " is disconnected");
      }
      updateuserinfo();
      console.log(userinfo[room][name]);
    });
});
