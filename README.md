
# Socket.IO Chat

A simple chat demo for socket.io

## How to use

```
$ cd socket.io
$ npm install
$ cd examples/chat
$ npm install
$ npm start
```

And point your browser to `http://localhost:3000`. Optionally, specify
a port by supplying the `PORT` env variable.

## Features

- Multiple users can join a chat room by each entering a unique username
on website load.
- Users can type chat messages to the chat room.
- A notification is sent to all users when a user joins or leaves
the chatroom.

## Setup Socket IO at azure
- 1. download socket.io zip https://github.com/socketio/socket.io
- 2. extract the example/chat to target folder
- 3. modify app.js to index.js
- 4. update app.js content
- // var io = require('../..')(server);
- // New:
- var io = require('socket.io')(server);
- 5. npm install socket.io
- 6. npm install
- 7. update package.json 
- "main": "index.js" -> "main": "app.js"
- "start": "node index.js" -> "start": "node app.js"
- 
- vs code part
- 1. install azure app service ext
- 2. login azure
- 3. deploy to web app
- 4. open azure port -> configuration, add application setting
- 5. Key: WEBSITES_PORT, Value: 3000
