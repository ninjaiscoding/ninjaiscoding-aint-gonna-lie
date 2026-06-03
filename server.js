const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

// --- 50 CATEGORIES DATABASE (Abbreviated to save space, keep your original full list here!) ---
const gameDatabase = {
    "Animals": ["Lion", "Tiger", "Elephant", "Giraffe", "Kangaroo", "Dog", "Cat", "Rabbit", "Bear", "Wolf", "Deer", "Fox", "Zebra", "Monkey", "Hippo", "Rhino", "Cheetah", "Leopard", "Panda", "Koala", "Horse", "Cow", "Pig", "Sheep", "Goat", "Donkey", "Camel", "Squirrel", "Mouse", "Rat", "Bat", "Frog", "Toad", "Turtle", "Snake", "Lizard", "Crocodile", "Alligator", "Dolphin", "Whale", "Shark", "Seal", "Octopus", "Crab", "Lobster", "Eagle", "Hawk", "Owl", "Parrot", "Penguin"],
    "Electronics": ["Smartphone", "Laptop", "Television", "Tablet", "Computer", "Smartwatch", "Headphones", "Earbuds", "Speaker", "Camera", "Drone", "Projector", "Printer", "Scanner", "Router", "Modem", "Monitor", "Keyboard", "Mouse", "Microphone", "Webcam", "Charger", "Battery", "Flashlight", "Calculated", "Console", "Controller", "Thermostat", "Refrigerator", "Microwave", "Toaster", "Blender", "Oven", "Dishwasher", "Vacuum", "Fan", "Heater", "Airconditioner", "Lamp", "Clock", "Radio", "Player", "Recorder", "Adapter", "Cable", "Plug", "Switch", "Sensor", "Remote", "Scale"],
    "Countries": ["Japan", "Canada", "Brazil", "Australia", "Germany", "USA", "Mexico", "France", "Italy", "Spain", "UK", "China", "India", "Egypt", "Russia", "Argentina", "Peru", "Chile", "Colombia", "SouthAfrica", "Kenya", "Nigeria", "Morocco", "Greece", "Turkey", "Sweden", "Norway", "Finland", "Denmark", "Holland", "Belgium", "Switzerland", "Austria", "Poland", "Ireland", "Portugal", "NewZealand", "Thailand", "Vietnam", "Korea", "Singapore", "Malaysia", "Indonesia", "India", "SaudiArabia", "Iceland", "Jamaica", "Cuba", "CostaRica", "Panama"],
    "Food": ["Pizza", "Burger", "Sushi", "Pasta", "Taco", "Salad", "Soup", "Sandwich", "Steak", "Chicken", "Rice", "Noodles", "Bread", "Cheese", "Egg", "Butter", "Yogurt", "Milk", "Cereal", "Pancakes", "Waffles", "Bacon", "Sausage", "Hotdog", "Fries", "Chips", "Popcorn", "Cookie", "Cake", "Pie", "IceCream", "Donut", "Chocolate", "Candy", "Fruit", "Vegetable", "Fish", "Shrimp", "Curry", "Burrito", "Quesadilla", "Nuggets", "Muffin", "Bagel", "Toast", "Waffles", "Omelet", "Porridge", "Dumpling", "Meatballs"],
    "Sports": ["Soccer", "Basketball", "Baseball", "Football", "Tennis", "Volleyball", "Golf", "Cricket", "Rugby", "Hockey", "Badminton", "Swimming", "Running", "Cycling", "Boxing", "Karate", "Gymnastics", "Skating", "Skiing", "Snowboarding", "Surfing", "Sailing", "Rowing", "Wrestling", "Fencing", "Archery", "Bowling", "Billiards", "Darts", "Skateboarding", "Cheerleading", "Dancing", "Hiking", "Climbing", "Fishing", "Hunting", "Kayaking", "Diving", "Marathon", "Triathlon", "Softball", "Lacrosse", "Handball", "Squash", "Racquetball", "TableTennis", "Track", "Field", "Weightlifting", "Bodybuilding"],
    "Fruits": ["Apple", "Banana", "Orange", "Strawberry", "Grape", "Watermelon", "Mango", "Pineapple", "Peach", "Pear", "Plum", "Cherry", "Blueberry", "Raspberry", "Blackberry", "Kiwi", "Lemon", "Lime", "Coconut", "Papaya", "Guava", "Melon", "Cantaloupe", "Honeydew", "Fig", "Date", "Apricot", "Pomegranate", "Avocado", "Grapefruit", "Mandarin", "Tangerine", "Cranberry", "Lychee", "Passionfruit", "Dragonfruit", "Starfruit", "Persimmon", "Nectarine", "Olive", "Tomato", "Pumpkin", "Squash", "Zucchini", "Cucumber", "Pepper", "Eggplant", "Peanut", "Walnut", "Almond"],
    "Vegetables": ["Carrot", "Potato", "Broccoli", "Tomato", "Lettuce", "Onion", "Garlic", "Cucumber", "Pepper", "Spinach", "Cabbage", "Cauliflower", "Corn", "Peas", "Beans", "Celery", "Asparagus", "Zucchini", "Eggplant", "Mushroom", "Radish", "Turnip", "Beet", "SweetPotato", "Pumpkin", "Squash", "Kale", "Leek", "Ginger", "Chili", "Avocado", "Artichoke", "BrusselsSprout", "Okra", "Yam", "Parsnip", "Chives", "Parsley", "Cilantro", "Basil", "Mint", "Rosemary", "Thyme", "Oregano", "Dill", "Seaweed", "Bamboo", "Sprout", "Chickpea", "Lentil"],
    "Clothing": ["Shirt", "Pants", "Dress", "Skirt", "Jacket", "Coat", "Sweater", "Hoodie", "Shorts", "Jeans", "Socks", "Shoes", "Boots", "Sneakers", "Sandals", "Hat", "Cap", "Beanie", "Gloves", "Scarf", "Belt", "Tie", "Suit", "Tuxedo", "Blouse", "Vest", "Cardigan", "Raincoat", "Swimsuit", "Pajamas", "Underwear", "Bra", "Briefs", "Slippers", "Heels", "Flats", "Uniform", "Jersey", "Apron", "Overalls", "Robes", "Leggings", "Tights", "Tracksuit", "Poncho", "Shawl", "Kimono", "Mittens", "Earmuffs", "Headband"],
    "School Subjects": ["Math", "Science", "History", "English", "Geography", "Art", "Music", "Biology", "Chemistry", "Physics", "Reading", "Writing", "Spelling", "Language", "Health", "Gym", "Drama", "Theater", "Computers", "Coding", "Geometry", "Algebra", "Calculus", "Astronomy", "Geology", "Economics", "Politics", "Sociology", "Psychology", "Philosophy", "Literature", "Poetry", "Speech", "Debate", "Journalism", "Photography", "Woodshop", "Cooking", "Sewing", "Business", "Accounting", "Finance", "Law", "Medicine", "Nursing", "Engineering", "Architecture", "Robotics", "Agriculture", "Gardening"],
    "Jobs": ["Teacher", "Doctor", "Nurse", "Firefighter", "Policeman", "Pilot", "Chef", "Baker", "Farmer", "Scientist", "Engineer", "Artist", "Musician", "Actor", "Writer", "Journalist", "Lawyer", "Judge", "Dentist", "Vet", "Builder", "Carpenter", "Electrician", "Plumber", "Mechanic", "Driver", "Pilot", "Captain", "Sailor", "Soldier", "Astronaut", "Athlete", "Coach", "Manager", "Boss", "Secretary", "Clerk", "Cashier", "Salesman", "Waiter", "Waitress", "Cleaner", "Gardener", "Painter", "Photographer", "Designer", "Programmer", "Developer", "Librarian", "Barber"],
    "Colors": ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Black", "White", "Gray", "Brown", "Silver", "Gold", "Bronze", "Navy", "Cyan", "Magenta", "Teal", "Lime", "Maroon", "Olive", "Beige", "Cream", "Tan", "Peach", "Lavender", "Violet", "Indigo", "Turquoise", "Aqua", "Coral", "Salmon", "Ruby", "Emerald", "Sapphire", "Amber", "Ivory", "Mint", "Mustard", "Plum", "Burgundy", "Charcoal", "Crimson", "Scarlet", "Khaki", "Chocolate", "Caramel", "Vanilla", "Neon", "Rainbow"],
    "Vehicles": ["Car", "Truck", "Van", "SUV", "Bus", "Bike", "Motorcycle", "Scooter", "Train", "Subway", "Tram", "Airplane", "Helicopter", "Jet", "Rocket", "Spaceship", "Boat", "Ship", "Yacht", "Submarine", "Ferry", "Canoe", "Kayak", "Raft", "Ambulance", "Firetruck", "Policecar", "Taxi", "Tractor", "Bulldozer", "Crane", "Forklift", "Golfcart", "GoKart", "Skateboard", "Segway", "Monorail", "Blimp", "Glider", "HotAirBalloon", "CableCar", "Stroller", "Wagon", "Sled", "Sleigh", "Hoverboard", "JetSki", "Snowmobile", "Tank", "Jeep"],
    "Furniture": ["Chair", "Table", "Desk", "Bed", "Sofa", "Couch", "Armchair", "Stool", "Bench", "Cabinet", "Cupboard", "Wardrobe", "Closet", "Drawer", "Shelf", "Bookcase", "Nightstand", "Dresser", "Mirror", "Lamp", "Rug", "Carpet", "Curtain", "Blinds", "Cushion", "Pillow", "Blanket", "Mattress", "Futon", "Hammock", "Beanbag", "Ottoman", "Sideboard", "Buffet", "Console", "Stand", "Rack", "Chest", "Trunk", "Deskchair", "Diningtable", "CoffeeTable", "EndTable", "Vanity", "Chandelier", "Clock", "Screen", "Divider", "Staircase", "Fireplace"],
    "Musical Instruments": ["Guitar", "Piano", "Violin", "Drums", "Flute", "Trumpet", "Saxophone", "Clarinet", "Trombone", "Tuba", "FrenchHorn", "Oboe", "Bassoon", "Harmonica", "Accordion", "Ukulele", "Banjo", "Mandolin", "Harp", "Cello", "Viola", "DoubleBass", "ElectricGuitar", "BassGuitar", "Keyboard", "Synthesizer", "Organ", "Xylophone", "Marimba", "Tambourine", "Cymbals", "Gong", "Triangle", "Maracas", "Bongos", "Congas", "SnareDrum", "BassDrum", "Bagpipes", "Recorder", "Whistle", "Didgeridoo", "Sitar", "Tabla", "Lute", "Lyre", "Theremin", "Kazoo", "Castanets", "Chimes"],
    "Hobbies": ["Reading", "Writing", "Drawing", "Painting", "Singing", "Dancing", "Acting", "Cooking", "Baking", "Gardening", "Sewing", "Knitting", "Crochet", "Photography", "Gaming", "Coding", "Skating", "Hiking", "Camping", "Fishing", "Hunting", "Swimming", "Running", "Cycling", "Traveling", "Shopping", "Collecting", "Crafting", "Woodworking", "Pottery", "Sculpting", "Magic", "Juggling", "Biking", "Birdwatching", "StarGazing", "Chess", "Checkers", "Cards", "Puzzles", "ModelBuilding", "Origami", "Scrapbooking", "Yoga", "Meditation", "Bowling", "Skateboarding", "Surfing", "Snowboarding", "Skiing"],
    "Weather": ["Sunny", "Rainy", "Cloudy", "Windy", "Snowy", "Stormy", "Foggy", "Misty", "Hazy", "Hot", "Cold", "Warm", "Cool", "Freezing", "Boiling", "Humid", "Dry", "Wet", "Damp", "Clear", "Overcast", "Showers", "Drizzle", "Downpour", "Thunder", "Lightning", "Hail", "Sleet", "Blizzard", "Hurricane", "Typhoon", "Tornado", "Cyclone", "Gale", "Breeze", "Gust", "Draft", "Frost", "Ice", "Dew", "Rainbow", "Sunset", "Sunrise", "Twilight", "Heatwave", "Chilly", "Gloomy", "Bright", "Mild", "Severe"],
    "Family Members": ["Mother", "Father", "Son", "Daughter", "Brother", "Sister", "Grandmother", "Grandfather", "Grandson", "Granddaughter", "Aunt", "Uncle", "Cousin", "Nephew", "Niece", "Husband", "Wife", "Parent", "Child", "Baby", "Toddler", "Teenager", "Adult", "Elder", "Ancestor", "Descendant", "Stepfather", "Stepmother", "Stepson", "Stepdaughter", "Stepbrother", "Stepsister", "Halfbrother", "Halfsister", "Twin", "Triplet", "Sibling", "Relative", "Kin", "Guardian", "Godmother", "Godfather", "Godson", "Goddaughter", "Boyfriend", "Girlfriend", "Fiance", "Partner", "Spouse", "InLaw"],
    "Rooms in a House": ["Kitchen", "Bathroom", "Bedroom", "LivingRoom", "DiningRoom", "Hallway", "Basement", "Attic", "Garage", "LaundryRoom", "Pantry", "Closet", "Office", "Study", "Library", "Nursery", "Playroom", "Gym", "Sunroom", "Porch", "Balcony", "Deck", "Patio", "Backyard", "Frontyard", "Garden", "Shed", "Workshop", "Mudroom", "Foyer", "Entryway", "Stairwell", "Corridor", "Veranda", "Terrace", "Cellar", "WineCellar", "BoilerRoom", "UtilityRoom", "GuestRoom", "MasterBedroom", "EnSuite", "WalkInCloset", "HomeTheater", "GamesRoom", "StorageRoom", "Lounge", "Den", "Alcove", "Balcony"],
    "Shapes and Space": ["Circle", "Square", "Triangle", "Rectangle", "Oval", "Star", "Heart", "Diamond", "Hexagon", "Pentagon", "Octagon", "Cube", "Sphere", "Cone", "Cylinder", "Pyramid", "Line", "Point", "Angle", "Curve", "Cross", "Arrow", "Ring", "Crescent", "Spiral", "Wave", "Grid", "Dot", "Box", "Block", "Globe", "Planet", "Star", "Moon", "Sun", "Galaxy", "Universe", "Space", "Orbit", "Sky", "Cloud", "Horizon", "Edge", "Corner", "Side", "Center", "Middle", "Top", "Bottom", "Surface"],
    "Toys and Games": ["Doll", "ActionFigure", "Lego", "Blocks", "Puzzle", "Car", "Train", "Plane", "Ball", "Bat", "TeddyBear", "Plushie", "Robot", "Slime", "PlayDough", "Crayons", "Markers", "Paint", "YoYo", "Kite", "Frisbee", "Marble", "Dice", "Cards", "Chess", "Checkers", "Monopoly", "Scrabble", "Dominoes", "VideoGame", "Console", "Controller", "Headset", "Bicycle", "Scooter", "Skateboard", "Trampoline", "Swing", "Slide", "Sandbox", "WaterGun", "NerfGun", "RubiksCube", "Spinner", "Bubble", "Balloon", "Top", "CardGame", "BoardGame", "ToySoldier"]
};

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
            currentCategory: null,
            currentWord: null,
            imposterId: null,
            playedCombinations: []
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
            isImposter: false,
            hint: ""
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

        room.players.forEach((player) => {
            io.to(player.id).emit('roundStarted', {
                category: room.currentCategory,
                word: player.isImposter ? null : room.currentWord,
                isImposter: player.isImposter,
                currentRound: room.currentRound,
                maxRounds: room.maxRounds,
                players: room.players
            });
        });
    }

    // --- SUBMIT HINT ---
    socket.on('submitHint', ({ roomCode, hintText }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.hint = hintText.trim() || "🚨 Blind Hint!";
        }

        const submittedCount = room.players.filter(p => p.hint !== "").length;

        // Tell everyone the live progress count
        io.to(roomCode).emit('hintSubmissionProgress', {
            submittedCount,
            totalCount: room.players.length,
            players: room.players
        });
    });

    // --- HOST FORCES REVEAL OF ALL HINTS ---
    socket.on('revealHints', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room || room.hostId !== socket.id) return;

        // Fallback: If anyone didn't fill it out before host clicked next, give them a placeholder
        room.players.forEach(p => {
            if (!p.hint) p.hint = "🤐 No hint provided";
        });

        io.to(roomCode).emit('allHintsSubmitted', {
            players: room.players
        });
    });

    // --- VOTE OUT (HOST-ONLY) ---
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

    // --- NEXT ROUND ---
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
