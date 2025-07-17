const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const firebase = require('../services/firebase');
const db = firebase.db;
const FieldValue = firebase.fieldValue;

// 1. First initialize multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'public/uploads/');
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + '-' + file.originalname);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || 
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.mimetype === 'text/plain') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC/DOCX, and TXT files are allowed'));
        }
    }
});

// Add error handling middleware
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).json({ error: err.message });
    } else if (err) {
        res.status(500).json({ error: err.message });
    }
    next();
});

// 2. Then define your middleware and routes
const requireAuth = (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
    next();
};

// Dashboard routes
router.get('/dashboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// User API
router.get('/api/user', requireAuth, (req, res) => {
    res.json(req.session.user);
});

// Items API
router.get('/api/recent-items', requireAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('items')
            .where('userId', '==', req.session.user.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
            
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load items' });
    }
});

// Activity API
router.get('/api/recent-activity', requireAuth, async (req, res) => {
    try {
        const activities = [
            {
                icon: 'fa-book',
                title: 'Joined "Advanced Calculus" study room',
                timestamp: new Date(Date.now() - 3600000)
            },
            {
                icon: 'fa-file-alt',
                title: 'Created note "Lecture 5 Summary"',
                timestamp: new Date(Date.now() - 86400000)
            },
            {
                icon: 'fa-comment',
                title: 'Posted in "Chemistry Help" discussion',
                timestamp: new Date(Date.now() - 172800000)
            }
        ];
        
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load activity' });
    }
});

// Rooms API
router.get('/api/rooms', requireAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('rooms')
            .where('schedule', '>=', new Date().toISOString())
            .orderBy('schedule')
            .get();

        const rooms = await Promise.all(snapshot.docs.map(async doc => {
            const room = doc.data();
            const userDoc = await db.collection('users').doc(room.creatorId).get();
            return {
                id: doc.id,
                ...room,
                creatorName: userDoc.data()?.name || 'Unknown',
                schedule: new Date(room.schedule).toLocaleString()
            };
        }));
        
        res.json(rooms);
    } catch (error) {
        console.error('Room load error:', error);
        res.status(500).json({ error: 'Failed to load rooms' });
    }
});

router.post('/api/rooms', requireAuth, async (req, res) => {
    try {
        const { name, link, schedule } = req.body;
        
        const newRoom = {
            name,
            link,
            schedule,
            creatorId: req.session.user.uid,
            createdAt: FieldValue.serverTimestamp(),
            members: [req.session.user.uid]
        };

        const docRef = await db.collection('rooms').add(newRoom);
        res.status(201).json({ id: docRef.id });
    } catch (error) {
        console.error('Room creation error:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Rooms page
router.get('/rooms', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/rooms.html'));
});

// Notes API
router.get('/api/notes', requireAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('notes')
            .where('userId', '==', req.session.user.uid)
            .orderBy('createdAt', 'desc')
            .get();

        const notes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load notes' });
    }
});

// Remove the duplicate notes POST route that appears earlier in your file
// Keep only this one:
router.post('/api/notes', requireAuth, upload.single('file'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.session.user.uid;
        
        let fileData = {};
        if (req.file) {
            fileData = {
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`
            };
        }

        const newNote = {
            title,
            content,
            userId,
            ...fileData,
            createdAt: FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('notes').add(newNote);
        res.status(201).json({ id: docRef.id });
    } catch (error) {
        console.error('Note creation error:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to create note' 
        });
    }
});

router.delete('/api/notes/:id', requireAuth, async (req, res) => {
    try {
        await db.collection('notes').doc(req.params.id).delete();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// Notes count endpoint
router.get('/api/notes/count', requireAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('notes')
            .where('userId', '==', req.session.user.uid)
            .count()
            .get();
            
        res.json({ count: snapshot.data().count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to count notes' });
    }
});

// Notes page
router.get('/notes', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/notes.html'));
});

// Error handling middleware for file uploads
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).json({ error: err.message });
    } else if (err) {
        res.status(500).json({ error: err.message });
    }
    next();
});

router.post('/api/notes', requireAuth, upload.single('file'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const userId = req.session.user.uid;
        
        let fileData = {};
        if (req.file) {
            fileData = {
                fileName: req.file.originalname,
                fileUrl: `/uploads/${req.file.filename}`
            };
        }

        const newNote = {
            title,
            content,
            userId,
            ...fileData,
            createdAt: FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('notes').add(newNote);
        res.status(201).json({ id: docRef.id });
        
    } catch (error) {
        console.error('Note creation error:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Add these endpoints
router.get('/api/rooms/count', requireAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('rooms')
            .where('schedule', '>=', new Date().toISOString())
            .count()
            .get();
        res.json({ count: snapshot.data().count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to count rooms' });
    }
});

router.get('/api/notes/count', requireAuth, async (req, res) => {
    try {
        const snapshot = await db.collection('notes')
            .where('userId', '==', req.session.user.uid)
            .count()
            .get();
        res.json({ count: snapshot.data().count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to count notes' });
    }
});



module.exports = router;