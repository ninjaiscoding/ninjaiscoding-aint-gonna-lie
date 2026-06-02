const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// Game Categories Database
const gameDatabase = [
    { category: "Animals", word: "Tiger" },
    { category: "Electronics", word: "Smartphone" },
    { category: "Countries", word: "Japan" },
    { category: "Birds", word: "Eagle" },
    { category: "Foods", word: "Pizza" }
];

const rooms = {};

io.on('connection', (socket) => {
    // --- CREATE ROOM ---
    socket.on('createRoom', ({ rounds }) => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[roomCode] = {
            code: roomCode,
            hostId: socket.id,
            maxRounds: parseInt(rounds) || 5,
            currentRound: 1,
            players: [],
            gameStarted: false,
            currentWordItem: null,
            imposterId: null
        };
        socket.emit('roomCreated', roomCode);
    });

    // --- JOIN ROOM ---
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms[roomCode];
        if (!room) return socket.emit('errorMsg', 'Room not found.');
        if (room.gameStarted) return socket.emit('errorMsg', 'Game already in progress.');
        if (room.players.length >= 10) return socket.emit('errorMsg', 'Room is full.');

        const newPlayer = {
            id: socket.id,
            name: playerName || `Player ${room.players.length + 1}`,
            points: 0,
            isImposter: false
        };

        room.players.push(newPlayer);
        socket.join(roomCode);
        
        io.to(roomCode).emit('roomUpdated', {
            roomCode,
            players: room.players,
            hostId: room.hostId,
            gameStarted: room.gameStarted
        });
    });

    // --- START GAME / ROUND ---
    socket.on('startGame', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;

        room.gameStarted = true;
        startNewRound(roomCode);
    });

    function startNewRound(roomCode) {
        const room = rooms[roomCode];
        room.currentWordItem = gameDatabase[Math.floor(Math.random() * gameDatabase.length)];
        
        // Pick random imposter
        const imposterIndex = Math.floor(Math.random() * room.players.length);
        room.players.forEach((p, idx) => {
            p.isImposter = (idx === imposterIndex);
            if (p.isImposter) room.imposterId = p.id;
        });

        // Send customized payloads to each player privately
        room.players.forEach((player) => {
            io.to(player.id).emit('roundStarted', {
                category: room.currentWordItem.category,
                word: player.isImposter ? null : room.currentWordItem.word,
                isImposter: player.isImposter,
                currentRound: room.currentRound,
                maxRounds: room.maxRounds,
                players: room.players
            });
        });
    }

    // --- SUBMIT VOTE ---
    socket.on('castVote', ({ roomCode, votedPlayerId }) => {
        const room = rooms[roomCode];
        if (!room) return;

        let pointsSummaryHtml = "";
        const imposter = room.players.find(p => p.isImposter);

        if (votedPlayerId === room.imposterId) {
            pointsSummaryHtml = `<h3 style="color:#48bb78; font-size:1.5rem; margin-bottom:10px;">Imposter Caught!</h3>
            <p>The group successfully voted out <strong>${imposter.name}</strong>.</p><br>`;
            room.players.forEach(p => {
                if (!p.isImposter) p.points += 1;
            });
        } else {
            const victim = room.players.find(p => p.id === votedPlayerId);
            pointsSummaryHtml = `<h3 style="color:#f56565; font-size:1.5rem; margin-bottom:10px;">Wrong Accusation!</h3>
            <p>The group voted out <strong>${victim.name}</strong> instead of the imposter.</p><br>`;
            imposter.points += 2;
        }

        io.to(roomCode).emit('roundResult', {
            pointsSummaryHtml,
            players: room.players,
            isGameOver: room.currentRound >= room.maxRounds
        });
    });

    // --- ADVANCE TO NEXT ROUND ---
    socket.on('nextRound', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;

        room.currentRound++;
        startNewRound(roomCode);
    });

    // --- RESTART GAME ---
    socket.on('restartGame', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;

        room.currentRound = 1;
        room.gameStarted = false;
        room.players.forEach(p => p.points = 0);
        
        io.to(roomCode).emit('roomUpdated', {
            roomCode,
            players: room.players,
            hostId: room.hostId,
            gameStarted: room.gameStarted
        });
    });

    // --- CLEANUP DISCONNECTS ---
    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const pIdx = room.players.findIndex(p => p.id === socket.id);
            if (pIdx !== -1) {
                room.players.splice(pIdx, 1);
                if (room.players.length === 0) {
                    delete rooms[roomCode];
                } else {
                    if (room.hostId === socket.id) room.hostId = room.players[0].id;
                    io.to(roomCode).emit('roomUpdated', {
                        roomCode,
                        players: room.players,
                        hostId: room.hostId,
                        gameStarted: room.gameStarted
                    });
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server blasting off on port ${PORT}`));
