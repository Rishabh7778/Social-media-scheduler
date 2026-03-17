import express from 'express';
import { register, login } from '../controllers/authController.js';
import { getAllAccounts } from '../controllers/SocialController.js'; 
import { verifyToken, isAdmin } from '../middlewares/authmiddleware.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { userDetails, logout } from '../controllers/authController.js';

const router = express.Router();



// --- Auth Routes ---
router.post('/register', register);
router.post('/login', login);

// Admin Route
router.get('/admin-only', verifyToken, isAdmin, (req, res) => {
    res.json({ message: "Welcome Admin! You have full access." });
});


// --- FACEBOOK AUTH ---
router.get('/facebook', 
  passport.authenticate('facebook', { 
    scope: ['public_profile', 'email', 'pages_show_list', 'pages_manage_posts', 'pages_read_engagement']
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: 'http://localhost:5173/', session: false }),
  (req, res) => {
    const jwtToken = jwt.sign(
      { id: req.user.id, name: req.user.name, role: req.user.role, provider: req.user.provider }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`http://localhost:5173/calendar?token=${jwtToken}`);
  }
);

// --- LINKEDIN AUTH (Naya Addition) ---
router.get('/linkedin', 
  passport.authenticate('linkedin') // Scopes humne config/passport.js mein define kiye hain
);

router.get('/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: 'http://localhost:5173/', session: false }),
  (req, res) => {
    // LinkedIn se login ke baad bhi wahi same JWT generate karenge
    const jwtToken = jwt.sign(
      { id: req.user.id, name: req.user.name, role: req.user.role, provider: req.user.provider }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`http://localhost:5173/dashboard/schedule?token=${jwtToken}`);
  }
);

// --- SOCIAL ACCOUNTS DATA ---
// Is route ko generic rakhte hain taaki FB aur LinkedIn dono ke pages/profiles mil jayein
router.get('/social-accounts', verifyToken, getAllAccounts); 
router.get('/userData', verifyToken, userDetails);

router.post('/logout', logout);

export default router;