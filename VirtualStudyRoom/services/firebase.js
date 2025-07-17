const admin = require('firebase-admin');

// Load service account credentials
const serviceAccount = require('../serviceAccountKey.json');

// Initialize only if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 
                 `https://${serviceAccount.project_id}.firebaseio.com`
  });
}

const db = admin.firestore();
const auth = admin.auth();
const fieldValue = admin.firestore.FieldValue;
const projectId = serviceAccount.project_id;

module.exports = {
  admin,
  db,
  auth,
  fieldValue,
  projectId
};
