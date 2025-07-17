require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const firebase = require('./services/firebase');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));

const notesRouter = require('./routes/notes');
app.use('/api/notes', notesRouter); // ✅ only once

const roomsRouter = require('./routes/rooms');
app.use('/api/rooms', roomsRouter);

app.get('/api/user', (req, res) => {
  if (req.session?.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Frontend pages
app.get('/rooms', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rooms.html'));
});

app.get('/notes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notes.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Firebase project: ${firebase.projectId}`);
});

