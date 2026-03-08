import express from 'express';
import { createPost } from '../controllers/PostController.js';
import { verifyToken } from '../middlewares/authmiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Route: POST /api/posts
// Pehle token check hoga, fir image upload hogi ('image' wahi naam hai jo frontend se aayega), fir controller chalega
router.post('/createPost', verifyToken, upload.single('image'), createPost);

export default router;