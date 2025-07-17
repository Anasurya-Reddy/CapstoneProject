const admin = require('firebase-admin');

const firebase = require('./services/firebase');
const db = firebase.db;

// Verify user session
const verifySession = async (session) => {
    if (!session || !session.user || !session.user.uid) {
        return null;
    }

    try {
        const user = await admin.auth().getUser(session.user.uid);
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        return {
            uid: user.uid,
            email: user.email,
            name: user.displayName || userDoc.data()?.name
        };
    } catch (error) {
        console.error('Session verification failed:', error);
        return null;
    }
};

// Check user permission
const checkPermission = async (userId, resourceId, resourceType) => {
    try {
        const resource = await db.collection(resourceType).doc(resourceId).get();
        if (!resource.exists) return false;
        
        const data = resource.data();
        return data.creator === userId || data.members?.includes(userId);
    } catch (error) {
        console.error('Permission check failed:', error);
        return false;
    }
};

module.exports = {
    verifySession,
    checkPermission
};
