const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// --- 50 CATEGORIES DATABASE (Abbreviated to save space, keep your original full list here!) ---
const gameDatabase = {
    "Animals": ["Lion", "Tiger", "Elephant", "Giraffe", "Kangaroo"],
    "Electronics": ["Smartphone", "Laptop", "Television", "Tablet"],
    "Countries": ["Japan", "Canada", "Brazil", "Australia", "Germany"],
    "Food": ["Pizza", "Burger", "Sushi", "Pasta", "Taco"]
};

const rooms = {};

io.on('connection', (socket) => {

    socket.on('createRoom', ({ rounds }) => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        rooms[roomCode] = {
            code: roomCode,
            hostId: socket.id,
            maxRounds: parseInt(rounds) || 5,
            currentRound: 1,
            players: [],
            gameStarted: false,
            currentCategory: null,
            currentWord: null,
            imposterId: null,
            playedCombinations: [],
            currentTurnIndex: 0 // Tracks whose turn it currently is to type
        };
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms[roomCode];
        if (!room) return socket.emit('errorMsg', 'Room not found.');
        if (room.gameStarted) return socket.emit('errorMsg', 'Game already in progress.');
        if (room.players.length >= 10) return socket.emit('errorMsg', 'Room is full.');

        const newPlayer = {
            id: socket.id,
            name: playerName || `Player ${room.players.length + 1}`,
            points: 0,
            isImposter: false,
            hint: "",
            pNumber: room.players.length + 1 // Permanent player number assignment
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

    socket.on('startGame', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;
        room.gameStarted = true;
        startNewRound(roomCode);
    });

    function startNewRound(roomCode) {
        const room = rooms[roomCode];
        const categories = Object.keys(gameDatabase);
        
        let chosenCategory = "";
        let chosenWord = "";
        let attempts = 0;

        while (attempts < 100) {
            chosenCategory = categories[Math.floor(Math.random() * categories.length)];
            const wordList = gameDatabase[chosenCategory];
            chosenWord = wordList[Math.floor(Math.random() * wordList.length)];
            
            const comboKey = `${chosenCategory}:${chosenWord}`;
            if (!room.playedCombinations.includes(comboKey)) {
                room.playedCombinations.push(comboKey);
                break;
            }
            attempts++;
        }

        room.currentCategory = chosenCategory;
        room.currentWord = chosenWord;
        
        const imposterIndex = Math.floor(Math.random() * room.players.length);
        room.players.forEach((p, idx) => {
            p.isImposter = (idx === imposterIndex);
            p.hint = "";
            if (p.isImposter) room.imposterId = p.id;
        });

        // Dynamic round starter: Round 1 starts with Index 0 (P1), Round 2 starts with Index 1 (P2), wrapped using modulo (%)
        room.currentTurnIndex = (room.currentRound - 1) % room.players.length;

        emitTurnState(roomCode);
    }

    function emitTurnState(roomCode) {
        const room = rooms[roomCode];
        const activePlayer = room.players[room.currentTurnIndex];

        room.players.forEach((player) => {
            io.to(player.id).emit('roundStarted', {
                category: room.currentCategory,
                word: player.isImposter ? null : room.currentWord,
                isImposter: player.isImposter,
                currentRound: room.currentRound,
                maxRounds: room.maxRounds,
                players: room.players,
                activeTurnPlayerId: activePlayer.id, // Who is allowed to type right now
                activeTurnPlayerName: activePlayer.name
            });
        });
    }

    socket.on('submitHint', ({ roomCode, hintText }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const expectedPlayer = room.players[room.currentTurnIndex];
        if (socket.id !== expectedPlayer.id) return socket.emit('errorMsg', "It's not your turn to submit!");

        expectedPlayer.hint = hintText.trim() || "🤐 Passed hint";

        // Advance turn index logically around the array ring
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
        
        // Check if everyone has answered yet
        const subCount = room.players.filter(p => p.hint !== "").length;

        if (subCount === room.players.length) {
            // All players done! Let the host know they can hit reveal
            io.to(roomCode).emit('hintSubmissionProgress', {
                submittedCount: subCount,
                totalCount: room.players.length,
                players: room.players,
                allDone: true
            });
        } else {
            // Not done yet, refresh screens to update the public hint wall list live and change active focus
            emitTurnState(roomCode);
        }
    });

    socket.on('revealHints', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;

        io.to(roomCode).emit('allHintsSubmitted', {
            players: room.players
        });
    });

    socket.on('castVote', ({ roomCode, votedPlayerId }) => {
        const room = rooms[roomCode];
        if (!room) return;

        let pointsSummaryHtml = "";
        const imposter = room.players.find(p => p.isImposter);

        if (votedPlayerId === room.imposterId) {
            pointsSummaryHtml = `<h3 style="color:#48bb78; font-size:1.5rem; margin-bottom:10px;">Imposter Caught!</h3>
            <p>The group successfully voted out <strong>${imposter.name}</strong>.</p>
            <p style="margin-top:10px; color:#cc2366;">The secret word was: <strong>${room.currentWord}</strong></p><br>`;
            room.players.forEach(p => {
                if (!p.isImposter) p.points += 1;
            });
        } else {
            const victim = room.players.find(p => p.id === votedPlayerId);
            pointsSummaryHtml = `<h3 style="color:#f56565; font-size:1.5rem; margin-bottom:10px;">Wrong Accusation!</h3>
            <p>The group voted out <strong>${victim.name}</strong>.</p>
            <p style="margin-top:10px; color:#cc2366;">The real imposter was <strong>${imposter.name}</strong>!</p>
            <p>The secret word was: <strong>${room.currentWord}</strong></p><br>`;
            imposter.points += 2;
        }

        io.to(roomCode).emit('roundResult', {
            pointsSummaryHtml,
            players: room.players,
            isGameOver: room.currentRound >= room.maxRounds
        });
    });

    socket.on('nextRound', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;
        room.currentRound++;
        startNewRound(roomCode);
    });

    socket.on('restartGame', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;

        room.currentRound = 1;
        room.gameStarted = false;
        room.players.forEach(p => {
            p.points = 0;
            p.hint = "";
        });
        room.playedCombinations = [];
        
        io.to(roomCode).emit('roomUpdated', {
            roomCode,
            players: room.players,
            hostId: room.hostId,
            gameStarted: room.gameStarted
        });
    });

    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            const pIdx = room.players.findIndex(p => p.id === socket.id);
            if (pIdx !== -1) {
                room.players.splice(pIdx, 1);
                // Recalculate pNumbers dynamically so order doesn't break if someone drops out
                room.players.forEach((p, idx) => p.pNumber = idx + 1);
                
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
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
