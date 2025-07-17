const express = require('express');
const router = express.Router();
const { auth, db } = require('../services/firebase');

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      createdAt: new Date().toISOString()
    });

    req.session.user = {
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName
    };

    res.json({ success: true, redirect: '/dashboard' });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message.includes('email') ? 'Email already exists' : 'Signup failed' 
    });
  }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Note: Firebase Admin can't verify passwords directly
        // This is a placeholder - you'll need to:
        // 1. Use Firebase Client SDK for actual auth, OR
        // 2. Implement proper password verification
        
        const user = await auth.getUserByEmail(email);
        
        req.session.user = {
            uid: user.uid,
            email: user.email,
            name: user.displayName
        };
        
        res.json({ 
            success: true, 
            redirect: '/dashboard' 
        });
        
    } catch (error) {
        res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
        });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, redirect: '/' });
    });
});


module.exports = router;
