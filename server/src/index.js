import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import authTable from '../database/authTable.js';
import postTable from '../database/postTable.js';
import socialAccountTable from '../database/social_accounts.js';
import postRoutes from './routes/postRoutes.js';
import './workers/postWorker.js';
import './config/passport.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


await authTable(); 
await postTable();
await socialAccountTable();
app.use(session({
    secret: process.env.SESSION_SECRET || 'my_super_secret_key',
    resave: false,
    saveUninitialized: false,
}));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));