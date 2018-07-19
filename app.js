var app = require('express')();
var debug = require('debug')('yt-server:server');
var http = require('http');

var port = 3000;
app.set('port', port);

var server = http.createServer(app);

var socketio = require('socket.io');
var io = socketio(server, {pingTimeout: 30000});

var youtubedl = require('youtube-dl');
io.on('connection', socket => {
  console.log('Cliented joined in: ', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliented disconnected: ', socket.id);
  });

  socket.on('download', url => {

    const video = youtubedl(
      url,
      ['-f', 'bestaudio',
       '-x',
       '--audio-format', 'mp3'
      ],
      { cwd: '/tmp'}
    );

    video.on('info', info => {
      const response = {
        title: info.title,
        thumbnail: info.thumbnail,
        size: info.size
      };
      socket.emit('info', response);
    });

    video.on('data', chunk => {
      const data = {
        length: chunk.length,
        data: chunk.toString('base64')
      };

      socket.emit('data', data);
    });

  });
});


server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
  case 'EACCES':
    console.error(bind + ' requires elevated privileges');
    process.exit(1);
    break;
  case 'EADDRINUSE':
    console.error(bind + ' is already in use');
    process.exit(1);
    break;
  default:
    throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log('Server On',bind);
}
