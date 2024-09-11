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

var rooms = [{
    roomId: 144144,
    users: [{
        username: "dummy",
        socketId: "9273928",
        time: "dummpy"
    }],
    maxParticipants: 10
}];

app.get('/ping', (req, res) => {
    const time = new Date
    console.log("ping hit at -> " + new Date().toISOString())
    res.status(200).json("Working server" + new Date().toISOString())
})

app.post('/createRoom', async (req, res) => {
    let helper = -1;
    const { roomId, maxParticipants } = req.body;
    rooms.forEach((e) => {
        if (e.roomId === roomId) {
            res.status(200).json({
                error: "301",
                errorMessage: "Room already created try joining it",
            })
            helper = 2;
            return;
        }
    })
    if (helper == 2) {
        return;
    }
    const obj = {
        roomId: roomId,
        users: [],
        maxParticipants: maxParticipants
    }
    rooms.push(obj);
    res.status(200).json({
        message: "Room created successfully"
    })
    return;
})

const io = socketio(server);
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
            return;
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
            let counter = -1;
            rooms[flag].users.forEach((user) => {
                if (user.socketId == socket.id) {
                    socket.emit('success', {
                        type: "room-joined",
                        status: 200,
                        message: "room joined successfully"
                    })
                    io.to(`room${data.roomId}`).emit("userAlert", {
                        username: data.username,
                        message: `${data.username} back ${rooms[flag].users.length} participants`,
                        type: "repeat user",
                        time: joinTime
                    })
                    counter = 5;
                    socket.join(`room${data.roomId}`)
                    return;
                }
            })
            if (counter == 5) {
                return;
            }
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

        let helper = -1;
        if (r.indexOf(`room${data.roomId}`) == -1) {
            rooms.forEach((ro) => {
                if (ro.roomId == data.roomId) {
                    helper = 4;
                    return;
                }
            })
            if (helper == -1) {
                socket.emit("error", {
                    message: "room has been deleted create new room",
                    type: "room deleted",
                    status: 301
                })
                return;
            }
            socket.join(`room${data.roomId}`);
            rooms.forEach((ro, idx) => {
                if (ro.roomId == data.roomId) {
                    ro.users.push({
                        username: data.username,
                        socketId: socket.id,
                        time: new Date().toISOString
                    })
                }
            })
            setTimeout(() => {
                io.to(`room${data.roomId}`).emit("userAlert", {
                    username: data.username,
                    message: `${data.username} joined`,
                    type: "new user",
                    time: new Date().toISOString
                })
            }, 1000)
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