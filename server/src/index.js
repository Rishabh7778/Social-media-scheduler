import express from 'express';
import session from 'express-session';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import authTable from './models/authTable.js';
import postTable from './models/postTable.js';
import LinkedinTable from './models/LinkedinTable.js';
import FacebookTable from './models/FacebookTable.js';
import SocialAccounts from './models/SocialAccounts.js';
import postRoutes from './routes/postRoutes.js';
import './workers/postWorker.js';
import './config/FacebookPassport.js';
import './config/LinkedInPassport.js'; 
import { rateLimiter } from './middlewares/rate-limiter.js';


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());


await authTable(); 
await postTable();
await SocialAccounts();
await LinkedinTable();
await FacebookTable();
app.use(session({
    secret: process.env.SESSION_SECRET || 'my_super_secret_key',
    resave: false,
    saveUninitialized: false,
}));
// Routes
app.use('/api/auth', rateLimiter, authRoutes);
app.use('/api/posts', rateLimiter, postRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));