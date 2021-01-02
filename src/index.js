const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { generateMessage, generateLocationMessage } = require('./utilis/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utilis/user');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

io.on('connection', (socket) => {
    console.log('New Websocket connection');

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room });

        if (error) {
            return callback(error);
        }

        socket.join(user.room);

        socket.emit('message', generateMessage('Admin', 'Welcome!'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
    });

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback('Delivered!');
    });

    socket.on('sendLocation', ({ lat, long }, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${lat},${long}`));
        callback('Location shared!');
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });
});

server.listen(port, () => {
    console.log('Server is up on the port ' + port);
});