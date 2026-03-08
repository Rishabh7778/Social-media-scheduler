import express from 'express';
import { register, login } from '../controllers/authController.js';
import { getUserPages } from '../controllers/facebookController.js';
import { verifyToken, isAdmin } from '../middlewares/authmiddleware.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// Example Protected Route for Admin
router.get('/admin-only', verifyToken, isAdmin, (req, res) => {
    res.json({ message: "Welcome Admin! You have full access." });
});

// routes/authRoutes.js mein yeh change karo:
router.get('/facebook', 
  passport.authenticate('facebook', { 
// Agar aap Passport use kar rahe ho ya direct URL:
scope: ['public_profile', 'email', 'pages_show_list', 'pages_manage_posts', 'pages_read_engagement']
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: 'http://localhost:5173/', 
    session: false 
  }),
  (req, res) => {
    // Ab req.user.id mein tumhare database ('users' table) wali ID aayegi!
   // authRoutes.js mein change karo:
const jwtToken = jwt.sign(
  { id: req.user.id, name: req.user.name, role: req.user.role }, // Role add kar diya
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
    res.redirect(`http://localhost:5173/calendar?token=${jwtToken}`);
  }
);

router.get('/facebook/pages', verifyToken, getUserPages);

export default router;