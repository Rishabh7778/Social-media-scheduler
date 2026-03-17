import express from 'express';
import { verifyToken } from '../middlewares/authmiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { createPost, cancelScheduledPost, getUserPosts, deletePost, reschedulePost } from '../controllers/PostController.js';

const router = express.Router();

// Route: POST /api/posts
// Pehle token check hoga, fir image upload hogi ('image' wahi naam hai jo frontend se aayega), fir controller chalega
router.post('/createPost', verifyToken, upload.single('image'), createPost);
router.get('/my-posts', verifyToken, getUserPosts);
router.delete('/cancel-schedule/:id', verifyToken, cancelScheduledPost);
router.delete('/delete/:id', verifyToken, deletePost);
router.put('/reschedule/:id', verifyToken, reschedulePost);


export default router;