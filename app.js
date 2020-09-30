// Setup basic express server
const sql = require('mssql')
var express = require('express')
var app = express()
var path = require('path')
var axios = require('axios')
var WEB_API = 'https://jobtotalwebapi.azurewebsites.net/api'
if(process){
  if(process.env.WEB_API)
    WEB_API = process.env.WEB_API
}
// var WEB_API = 'https://jobtotalwebapi.azurewebsites.net/api'
var server = require('http').createServer(app)
var io = require('socket.io')(server)
// var port = process.env.PORT || 3000
var port = 3000
if(process){
  if(process.env.PORT)
    port = process.env.PORT
}

server.listen(port, () => {
  console.log('Server listening at port %d', port)
})

// Routing
app.use(express.static(path.join(__dirname, 'public')))

// Chatroom

var numUsers = 0

sql.on('error', (err) => {
  // ... error handler
  console.dir(err)
})

io.on('connection', (socket) => {
  io.set('transports', ['websocket'])
  let localConfig = 'mssql://itotal:Zaq12wsx@152.101.178.178/JobTotalDev'
  // let localConfig = '';
  // var connectionString = process.env.SQLCONNSTR_JobTotalDev || localConfig
  var connectionString = localConfig
  if(process){
    if(process.env.SQLCONNSTR_JobTotalDev)
      connectionString = process.env.SQLCONNSTR_JobTotalDev
  }
  // console.log('socket.handshake.query', socket.handshake.query)
  console.log('connectionString', connectionString)

  // var token = 'jason' //socket.handshake.query.token
  // var chat_id = 1 //socket.handshake.query.chat_id
  var token = socket.handshake.query.token
  var chat_id = socket.handshake.query.chat_id


  socket.join(chat_id)

  var addedUser = false

  // when the client emits 'add user', this listens and executes
  socket.on('add_user', (chatToken) => {
    if (addedUser) return

    sql
      .connect(connectionString)
      .then((pool) => {
        // Query
        let queryString = 'select u.Name from JobTotalUser u, UserChat uc '
        queryString += ' where u.deleted = 0 and uc.deleted = 0 and u.id = uc.user_id and '
        queryString += ' u.token = @token and uc.chat_id = @chat_id and u.expiry > @expiry'
        return pool.request()
                    .input('token', sql.NVarChar, token)
                    .input('chat_id', sql.BigInt, chat_id)
                    .input('expiry', sql.DateTime, new Date())
                    .query(queryString)
      })
      .then((result) => {
        token = token
        chat_id = chat_id
        if (result.recordset.length > 0) {
          var user = result.recordset[0]
          console.log('chat: ', chat_id)
          console.log('token: ', token)
          console.log('user: ', user)

          socket.username = user.Name
          ++numUsers
          addedUser = true
          let data ={
            username: socket.username,
            numUsers: numUsers,
          }
          console.log('data',data)
          socket.emit('login',data )
          console.log('after emit login')
          // echo globally (all clients) that a person has connected
          socket.to(chat_id).emit('user_joined',data )
          console.log('after user_joined', chat_id)
        } else {
          console.log('user chat not found with token, chat: ', token, chat_id)
          // echo globally (all clients) that a person has connected
          socket.to(chat_id).emit('connect_error', {
            error: 'user/chat not found',
          })
        }
      })
      .catch((err) => {
        console.log('err: ', err)
      })
  })

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.to(chat_id).emit('typing', {
      username: socket.username,
    })
  })

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop_typing', () => {
    socket.to(chat_id).emit('stop_typing', {
      username: socket.username,
    })
  })

  // when the client emits 'new message', this listens and executes
  socket.on('new_message', (data) => {
    console.log('chat_id', chat_id)
    // we tell the client to execute 'new message'
    socket.to(chat_id).emit('new_message', {
      username: socket.username,
      message: data.message,
    })
  })

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers

      // echo globally that this client has left
      socket.to(chat_id).emit('user_left', {
        username: socket.username,
        numUsers: numUsers,
      })
    }
  })
})
