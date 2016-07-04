$(document).ready(function() {
  var socket = io();
  var canvas, context;
  var drawing = false;
  var guessBox, newGuess, drawerControls, topMessage;

  //  -------------------------------------------------------------------

  canvas = $('canvas');
  guessBox = $('#guess input');
  newGuess = $('#new-guess');
  topMessage = $('#top-message');
  drawerControls = $('#drawer-controls');
  context = canvas[0].getContext('2d');
  canvas[0].width = canvas[0].offsetWidth;
  canvas[0].height = canvas[0].offsetHeight;

  //  -------------------------------------------------------------------

  var draw = function(position) {
    context.beginPath();
    context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
    context.fill();
  };

  var onKeyDown = function(event) {
    if (event.keyCode != 13) { // Enter
        return;
    }

    var guess = guessBox.val();
    guessBox.val('');
    socket.emit('guess', guess);
  };

  var clearCanvas = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
  };

  var generateTop = function(isEditor) {
    if(isEditor) {
      drawerControls.show();
      topMessage.hide();
    } else {
      drawerControls.hide();
      topMessage.show();
    }
  };

//  -------------------------------------------------------------------

  socket.on('connect', function() {
    var username = prompt('Please make a username');
    socket.emit('new user', username);
  });

  socket.on('draw', function(position) {
    draw(position);
  });

  socket.on('guess', function(guess) {
    newGuess.text(guess);
  });

  socket.on('clear canvas', function() {
    clearCanvas();
  });

  socket.on('update page', function(users) {
    var thisId = socket.nsp + '#' + socket.id;
    console.log(users);
    var isDrawer = users.drawerId === thisId;
    generateTop(isDrawer);
  });

  //  -------------------------------------------------------------------

  canvas.on('mousedown', function() {
    drawing = true;
  });

  canvas.on('mouseup', function() {
    drawing = false;
  });

  canvas.on('mousemove', function(event) {
    if (drawing) {
      var offset = canvas.offset();
      var position = {x: event.pageX - offset.left, y: event.pageY - offset.top};
      draw(position);
      socket.emit('draw', position);
    }

  });

  $('#clear-button').on('click', function() {
    socket.emit('clear canvas');
  });

  guessBox.on('keydown', onKeyDown);

});
