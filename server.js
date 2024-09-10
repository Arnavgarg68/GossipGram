const express = require('express');
const app = express();
const cors = require('cors');
const socketio = require('socket.io');
app.use(cors());
app.use(express.json());
require('dotenv').config();

// Server initialization
const port = process.env.PORT;
const server = app.listen(port, () => {
    console.log("server running")
}).on('error', (error) => {
    console.log("server listen issue -> " + error)
})

app.get('/ping', (req, res) => {
    const time = new Date
    console.log("ping hit at -> " + new Date().toISOString())
    res.status(200).json("Working server" + new Date().toISOString())
})

const io = socketio(server);
var rooms = [{
    roomId: 12345,
    users: [{
        username: "dummy",
        socketId: "9273928",
        time: "dummpy"
    }],
    maxParticipants: 10
}];
io.on('connection', (socket) => {
    console.log("user connected")
    socket.on('userjoined-room', (data) => {
        let flag = -1;
        if (!data.roomId || !data.username) {
            socket.emit("error", {
                type: "data-error",
                message: "Data invalid/insufficient"
            })
            return;
        }
        rooms.forEach((element, id) => {
            if (element.roomId == data.roomId) {
                flag = id;
            }
        });
        if (flag == -1) {
            socket.emit('error', {
                type: "room-join",
                message: "room doesn't exist try creating room"
            })
        }
        else {
            if (rooms[flag].maxParticipants < (rooms[flag].users.length + 1)) {
                socket.emit('error', {
                    type: "room-full",
                    message: "room number of users max limit reached"
                })
                return;
            }
            const joinTime = new Date().toISOString();
            rooms[flag].users.push({
                username: data.username,
                socketId: socket.id,
                time: joinTime
            })
            socket.join(`room${data.roomId}`)
            socket.emit('success', {
                type: "room-joined",
                status: 200,
                message: "room joined successfully"
            })
            setTimeout(() => {
                io.to(`room${data.roomId}`).emit("userAlert", {
                    username: data.username,
                    message: `${data.username} joined ${rooms[flag].users.length} participants`,
                    type: "new user",
                    time: joinTime
                })
            }, 1000)

        }
    })

    socket.on('msg', (data) => {
        const r = [...socket.rooms].filter((room) => room !== socket.id);
        console.log(data)
        if(r.indexOf(data.roomId)==-1){
            socket.join(`room${data.roomId}`);
        }
        data.time = new Date().toISOString();
        data.socketId = socket.id;
        io.to(`room${data.roomId}`).emit('msg', data)
    })

    socket.on('disconnect', () => {
        console.log("user disconnected")

        rooms.forEach((room, idx) => {
            const userIndex = room.users.findIndex(user => user.socketId === socket.id);
            if (userIndex != -1) {
                let username = room.users[userIndex].username;
                room.users.splice(userIndex, 1);

                if (room.users.length === 0) {
                    console.log("room deleted -> " + room.roomId)
                    rooms.splice(idx, 1);
                }
                else {
                    io.to(`room${room.roomId}`).emit('userAlert', {
                        username: username,
                        message: `${username} left room ${room.users.length} participants remaining`
                    })
                }
            }
        })
    })
})