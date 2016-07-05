var http = require('http');
var express = require('express');
var socket_io = require('socket.io');

var app = express();
app.use(express.static('public'));

var server = http.Server(app);
var io = socket_io(server);

//  -------------------------------------------------------------------

var users = {
  list: {},
  drawerId: null,
  getUserById: function(id) {
    return this.list.hasOwnProperty(id) ? this.list[id] : null;
  },
  addUser: function(user) {
    this.list[user.id] = user;

    console.log('New User Added: ' + user.username);
    console.log('User List:');
    for (key in this.list) {
      console.log(this.list[key].username);
    }
    console.log('------------------------------------');

  },
  removeUser: function(id) {
    var user = this.list[id];
    delete this.list[id];

    console.log('User Disconnected: ' + user.username);
    console.log('User List:');
    for (key in this.list) {
      console.log(this.list[key].username);
    }
    console.log('------------------------------------');

    return user;
  },
  setDrawer: function(user) {
    this.drawerId = user? user.id : null;

    if (user) {
      console.log('editor is: ' + user.username);
    } else {
      console.log('there is no editor');
    }
    console.log('------------------------------------');

  }
};

//  -------------------------------------------------------------------

var words = {
  newWord: function() {
    var randomIndex = Math.floor(Math.random() * this.list.length);
    return this.list[randomIndex];
  },
  list: [
    "word", "letter", "number", "person", "pen", "class", "people",
    "sound", "water", "side", "place", "man", "men", "woman", "women", "boy",
    "girl", "year", "day", "week", "month", "name", "sentence", "line", "air",
    "land", "home", "hand", "house", "picture", "animal", "mother", "father",
    "brother", "sister", "world", "head", "page", "country", "question",
    "answer", "school", "plant", "food", "sun", "state", "eye", "city", "tree",
    "farm", "story", "sea", "night", "day", "life", "north", "south", "east",
    "west", "child", "children", "example", "paper", "music", "river", "car",
    "foot", "feet", "book", "science", "room", "friend", "idea", "fish",
    "mountain", "horse", "watch", "color", "face", "wood", "list", "bird",
    "body", "dog", "family", "song", "door", "product", "wind", "ship", "area",
    "rock", "order", "fire", "problem", "piece", "top", "bottom", "king",
    "space"
  ]
};

//  -------------------------------------------------------------------

io.on('connection', function (socket) {

  socket.on('new user', function (username) {

    var user = {
      username: username,
      id: socket.id,
      lastGuess: ''
    };

    users.addUser(user);

    if (!users.drawerId) {
      users.setDrawer(user);
      socket.emit('set word', words.newWord());
    }

    io.emit('update page', users);

  });

  socket.on('draw', function(position) {
    socket.broadcast.emit('draw', position);
  });

  socket.on('guess', function(guess) {
    var user = users.getUserById(socket.id);
    user.lastGuess = guess;
    io.emit('guess', user);
  });

  socket.on('clear canvas', function() {
    io.emit('clear canvas');
  });

  socket.on('new word', function() {
    socket.emit('set word', words.newWord());
  });

  socket.on('winner', function(id) {
    var winner = users.getUserById(id);
    users.setDrawer(winner);
    io.emit('message', winner.username + ' won! It was: ' + winner.lastGuess);
    io.emit('update page', users);
  });

  socket.on('disconnect', function() {
    var user = users.removeUser(socket.id);
    io.emit('message', user.username + ' disconnected!');
    if (user.id === users.drawerId) {
      var newEditor = users.list[Object.keys(users.list)[0]];
      users.setDrawer(newEditor);
      if (newEditor) {
        io.sockets.connected[newEditor.id].emit('set word', words.newWord());
        io.emit('update page', users);

      }
    }
  });

});

//  -------------------------------------------------------------------

server.listen(8080);
