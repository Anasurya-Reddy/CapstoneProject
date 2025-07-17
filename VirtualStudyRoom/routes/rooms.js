const express = require('express');
const router = express.Router();
const {
  db, collection, doc, setDoc, getDocs, deleteDoc,
  query, where, Timestamp
} = require('../services/firebase');

// Create a room
router.post('/', async (req, res) => {
  try {
    const { name, link, schedule, duration } = req.body;

    if (!name || !link || !schedule || !duration) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const scheduleDate = new Date(schedule);
    const expiresAt = new Date(scheduleDate.getTime() + duration * 60000);

    const roomRef = doc(collection(db, 'rooms'));
    await setDoc(roomRef, {
      name,
      link,
      schedule: Timestamp.fromDate(scheduleDate),
      duration: parseInt(duration),
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      isActive: true
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all active rooms
router.get('/', async (req, res) => {
  try {
    const now = Timestamp.now();
    const q = query(collection(db, 'rooms'), where('expiresAt', '>', now));
    const snapshot = await getDocs(q);

    const rooms = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        name: data.name,
        link: data.link,
        schedule: data.schedule.toDate().toISOString(),
        duration: data.duration,
        expiresAt: data.expiresAt.toDate().toISOString()
      };
    });

    res.status(200).json(rooms);
  } catch (err) {
    console.error('Fetch rooms error:', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Count active rooms
router.get('/count', async (req, res) => {
  try {
    const now = Timestamp.now();
    const q = query(collection(db, 'rooms'), where('expiresAt', '>', now));
    const snapshot = await getDocs(q);
    res.json({ count: snapshot.size });
  } catch (error) {
    res.status(500).json({ error: 'Count fetch failed' });
  }
});

// Optional: auto-delete expired rooms every hour
setInterval(async () => {
  try {
    const now = Timestamp.now();
    const expiredQuery = query(collection(db, 'rooms'), where('expiresAt', '<=', now));
    const snapshot = await getDocs(expiredQuery);
    const deletions = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletions);
    console.log(`Deleted ${deletions.length} expired rooms`);
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}, 3600000); // every hour

module.exports = router;
