const express = require('express')
const socketio = require('socket.io')
const http = require('http')
const cors = require('cors')
const { addUser, getUser, getUsersInRoom, removeUser } = require('./users.js')

const PORT = process.env.PORT || 5000
const router = require('./router')
const app = express()

const server = http.createServer(app)

// const io = socketio(server, {
//   handlePreflightRequest: (req, res) => {
//     const headers = {
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//       'Access-Control-Allow-Origin': req.headers.origin, //or the specific origin you want to give access to,
//       'Access-Control-Allow-Credentials': true,
//     }
//     res.writeHead(200, headers)
//     res.end()
//   },
// })
const io = socketio(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
app.use(cors())
app.use(router)
io.on('connect', (socket) => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room })

    if (error) return callback(error)
    socket.join(user.room)

    socket.emit('message', {
      user: 'admin',
      text: `${user.name},Welcome to the room ${user.room}`,
    })
    socket.broadcast
      .to(user.room)
      .emit('message', { user: 'admin', text: `${user.name} has joined!` })

    callback()
  })
  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id)
    io.to(user.room).emit('message', { user: user.name, text: message })
    callback()
  })

  socket.on('disconnect', () => {
    console.log('User had left!!! ')
  })
})

server.listen(PORT, () => console.log(`Server started on port ${PORT} `))
