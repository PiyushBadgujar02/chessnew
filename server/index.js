const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
const { Chess } = require('chess.js')
const cors = require('cors')
const path = require("path");


app.use(cors())






const server = http.createServer(app)

// --------------------------deployment------------------------------
const __dirname1 = path.resolve();
// console.log(path.join(__dirname1, ".", "build"))

const staticPath = path.resolve(__dirname1, "build");
console.log(staticPath)
// setup middleware
app.use(express.static(staticPath));

// --------------------------deployment------------------------------

let players = {}
const chess = new Chess()

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    }
})

// io.on('connection',(socket)=>{
//     console.log('user connected',socket.id);
//     socket.on("send_message",(data)=>{
//         socket.broadcast.emit('receive_message',data)
//     })
// })

io.on('connection', function (uniquesocket) {
    console.log('connected')

    uniquesocket.on("send_message", (data) => {
        uniquesocket.broadcast.emit('receive_message', data)
    })

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit('PlayerRole', 'w')
    } else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit('PlayerRole', 'b')
    }
    else {
        uniquesocket.emit('spectatorRole', 's')
    }

    uniquesocket.on('disconnect', function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        } else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    })

    uniquesocket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

            const result = chess.move(move);

            if (result) {
                currentplayer = chess.turn();
                io.emit('move', chess.fen())
                console.log(chess.fen())
                io.emit('boardState', chess.fen())
            }
            else {
                console.log('invalid move', move)
                uniquesocket.emit('Invalid move', move)
            }
        }
        catch (err) {
            console.log('some error occured', err)
            uniquesocket.emit('Inavlid emit', err)
        }
    })
})


// dev
if ('production' === "production") {
    app.get("*", (req, res) => {
        const indexFile = path.join(__dirname1, "build", "index.html");
        return res.sendFile(indexFile);
    });
}
// dev end 


server.listen(3001, () => {
    console.log('connected sucessfully')
})