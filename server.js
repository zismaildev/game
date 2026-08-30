const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'users.json');

app.use(cors());
app.use(express.json());
// Serve static files (like game.html)
app.use(express.static(__dirname));

// Helper to read DB
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Helper to write DB
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Serve root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});


// API: Get all users
app.get('/api/users', (req, res) => {
    const users = readDB();
    // Hide passwords
    const safeUsers = users.map(u => ({ username: u.username, role: u.role, score: u.score }));
    res.json(safeUsers);
});

// API: Login or Auto-Register
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

    let users = readDB();
    let existingUser = users.find(u => u.username === username);

    if (existingUser) {
        if (existingUser.password !== password) {
            return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }
        res.json({ message: 'Login successful', user: { username: existingUser.username, role: existingUser.role, score: existingUser.score } });
    } else {
        if (username.toLowerCase() === 'teacher') return res.status(403).json({ error: 'ไม่สามารถใช้ชื่อนี้ได้' });

        const newUser = { username, password, role: 'student', score: 0 };
        users.push(newUser);
        writeDB(users);
        res.json({ message: 'Register successful', user: { username: newUser.username, role: newUser.role, score: newUser.score } });
    }
});

// API: Save Score
app.post('/api/score', (req, res) => {
    const { username, points } = req.body;
    if (!username || typeof points !== 'number') return res.status(400).json({ error: 'Invalid data' });

    let users = readDB();
    let userIndex = users.findIndex(u => u.username === username);

    if (userIndex > -1) {
        users[userIndex].score += points;
        writeDB(users);
        res.json({ message: 'Score updated', score: users[userIndex].score });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/game.html to play`);
});
