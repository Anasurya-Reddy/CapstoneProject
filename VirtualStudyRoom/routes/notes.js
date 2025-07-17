const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db, admin } = require('../services/firebase');

const router = express.Router();

// ✅ GET all notes (safe handling of createdAt)
router.get('/', async (req, res) => {
  try {
    console.log('🔍 GET /api/notes triggered');
    const snapshot = await db.collection('notes').orderBy('createdAt', 'desc').get();

    const notes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        content: data.content || '',
        createdAt: data.createdAt?.toDate?.() || null
      };
    });

    console.log(`✅ Fetched ${notes.length} notes`);
    res.status(200).json(notes);
  } catch (err) {
    console.error('❌ GET /api/notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// ✅ POST create note
router.post('/', async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Missing title or content' });
    }

    const note = {
      title,
      content,
      createdAt: admin.firestore.Timestamp.now()
    };

    const id = uuidv4();
    await db.collection('notes').doc(id).set(note);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('❌ POST /api/notes error:', err);
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// ✅ DELETE a note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('notes').doc(id).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ DELETE /api/notes/:id error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
