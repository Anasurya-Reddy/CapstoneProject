// server.js - Backend using Express.js and Firestore for Virtual Study Room
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const cors = require('cors');
const app = express();

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

// Check unique email & username, then signup
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || password.length < 6) return res.status(400).send('Invalid input');
  const userSnapshot = await db.collection('users').where('email', '==', email).get();
  const nameSnapshot = await db.collection('users').where('username', '==', username).get();
  if (!userSnapshot.empty || !nameSnapshot.empty) return res.status(400).send('Email or username already exists');

  try {
    const user = await admin.auth().createUser({ email, password });
    await db.collection('users').doc(user.uid).set({ username, email });
    res.status(200).send('Signup successful');
  } catch (e) {
    res.status(500).send('Signup error: ' + e.message);
  }
});

// Login API – check if email exists
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const snapshot = await db.collection('users').where('email', '==', email).get();
  if (snapshot.empty) return res.status(400).send('Email not found');

  const user = snapshot.docs[0].data();
  if (user.password !== password) return res.status(401).send('Incorrect password');

  res.status(200).json({ username: user.username });
});

// Change username
app.put('/api/update-username', async (req, res) => {
  const { email, newUsername } = req.body;
  try {
    const snapshot = await db.collection('users').where('email', '==', email).get();
    if (snapshot.empty) return res.status(404).send('User not found');
    const userRef = snapshot.docs[0].ref;
    await userRef.update({ username: newUsername });
    res.send('Username updated');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Change password
app.put('/api/update-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (newPassword.length < 6) return res.status(400).send('Password too short');
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(userRecord.uid, { password: newPassword });
    res.send('Password updated');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// Upload note
app.post('/api/upload', async (req, res) => {
  const { email, title, content } = req.body;
  try {
    await db.collection('notes').add({
      email,
      title,
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).send('Note uploaded');
  } catch {
    res.status(500).send('Upload failed');
  }
});

// Get notes
app.get('/api/notes', async (req, res) => {
  const notes = await db.collection('notes').orderBy('timestamp', 'desc').get();
  res.json(notes.docs.map(doc => doc.data()));
});

// Get my notes
app.get('/api/mynotes/:email', async (req, res) => {
  const notes = await db.collection('notes').where('email', '==', req.params.email).get();
  res.json(notes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
});

// Delete note
app.delete('/api/delete/:id', async (req, res) => {
  await db.collection('notes').doc(req.params.id).delete();
  res.send('Deleted');
});

// Update note
app.put('/api/update/:id', async (req, res) => {
  await db.collection('notes').doc(req.params.id).update(req.body);
  res.send('Updated');
});

// Live sessions
app.post('/api/session', async (req, res) => {
  const { email, link, time } = req.body;
  await db.collection('sessions').add({ email, link, time });
  res.send('Session created');
});

app.get('/api/sessions', async (req, res) => {
  const snap = await db.collection('sessions').get();
  res.json(snap.docs.map(doc => doc.data()));
});

// Serve pages
const pages = ['login', 'signup', 'dashboard', 'uploadnotes', 'viewnotes', 'livesession'];
pages.forEach(p => app.get(`/${p}.html`, (req, res) => res.sendFile(path.join(__dirname, `${p}.html`))));
app.get('/', (req, res) => res.redirect('/login.html'));

app.listen(3000, () => console.log('Server on http://localhost:3000'));

/* FRONTEND FILES STRUCTURE

1. signup.html - Form for username, email, password (min 6 chars), fetch('/api/signup')
2. login.html - Form for email, fetch('/api/login') and store username/email in localStorage
3. dashboard.html - Sidebar, greeting "Hello <username>", logout, note stats, notifications
4. uploadnotes.html - Drag-drop area, note editor, list user notes with edit/delete
5. viewnotes.html - All notes with live search (filter on keyup)
6. livesession.html - Upload and list live session links with time
7. dashboard.js - Shared logic: auth check, logout, stats fetch, notes, alerts

All JS files use fetch API to interact with the above endpoints.
Make sure to include Firestore security rules for access control.
*/
