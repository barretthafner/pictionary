$(document).ready(function() {
  var socket = io(),
      canvas = $('canvas'),
      guessBox = $('#guess input'),
      messageBox = $('#message-box'),
      drawerControls = $('#drawer-controls'),
      topMessage = $('#top-message'),
      wordBox = $('#word-box'),
      clearButton = $('#clear-button'),
      newWordButton = $('#new-word-button'),
      usersList = $('#users-list'),
      drawing = false,
      drawer = false;

  //  -------------------------------------------------------------------

var context = canvas[0].getContext('2d');
canvas[0].width = canvas[0].offsetWidth;
canvas[0].height = canvas[0].offsetHeight;

  //  -------------------------------------------------------------------

  var draw = function(position) {
    context.beginPath();
    context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
    context.fill();
  };

  var clearCanvas = function() {
    context.clearRect(0, 0, canvas[0].width, canvas[0].height);
  };

  var generateTop = function(isDrawer) {
    if(isDrawer) {
      drawerControls.show();
      topMessage.hide();
    } else {
      drawerControls.hide();
      topMessage.show();
    }
  };

  var generateUsersList = function(users) {
    usersList.html("");
    var userIndex = 1;
    for (user in users.list) {
      var thisUser = users.list[user];
      var html = "";
      if (thisUser.id === users.drawerId) {
        usersList.prepend('<p><strong>Drawer is:</strong> ' + thisUser.username + '</p>');
      } else {
        html += '<p data-id="' + thisUser.id + '">'
        if (drawer) {
          html += '<button class="winner">Winner!</button> '
        }
        html += userIndex + ') ' + thisUser.username + ' - <em>Last Guess:</em> <strong><span></span></strong></p>'
        usersList.append(html);
        userIndex++;
      }
    }
    usersList.parent().show();
  };

//  -------------------------------------------------------------------

  socket.on('connect', function() {
    var username = prompt('Please make a username');
    socket.emit('new user', username);
  });

  socket.on('draw', function(position) {
    draw(position);
  });

  socket.on('guess', function(user) {
    var tag = '[data-id="' + user.id + '"] span';
    $(tag).text(user.lastGuess);
  });

  socket.on('clear canvas', function() {
    clearCanvas();
  });

  socket.on('update page', function(users) {
    var thisId = socket.nsp + '#' + socket.id;
    drawer = users.drawerId === thisId;
    generateTop(drawer);
    generateUsersList(users);
  });

  socket.on('set word', function(word) {
    wordBox.text('Make em guess: ' + word);
  });

  socket.on('message', function(message) {
    messageBox.text(message);
    setTimeout(function() {
      messageBox.text('');
    }, 10000)
  });

  //  -------------------------------------------------------------------

  canvas.on('mousedown', function() {
    if (drawer) {
      drawing = true;
    }
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

  clearButton.on('click', function() {
    socket.emit('clear canvas');
  });

  newWordButton.on('click', function() {
    socket.emit('new word');
  });

  guessBox.on('keydown', function(event) {
    if (event.keyCode != 13) { // Enter
      return;
    }

    var guess = guessBox.val();
    guessBox.val('');
    socket.emit('guess', guess);
  });

  usersList.on('click', '.winner', function(event) {
    var winnerId = event.target.parentElement.dataset.id;
    socket.emit('winner', winnerId);
  });

});
