import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.js';

// 1. REGISTER
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body; // role optional rakho

        // Check if user exists
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) return res.status(400).json({ message: "User already exists" });

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert User (Default role is 'user' if not provided)
        const userRole = role || 'user';
        await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, userRole]
        );

        res.status(201).json({ message: "User created successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(400).json({ message: "Invalid Credentials" });

        const user = rows[0];

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" });

        // Create JWT Token (User ID aur Role dono daalo payload mein)
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. LOGOUT (Ultra-Secure Version)
export const logout = async (req, res) => {
    try {
        // 1. Agar session exist karta hai toh use securely destroy karo
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Session destroy error:", err);
                    return res.status(500).json({ message: "Logout failed on server" });
                }
                
                // 2. Cookie ko browser se clear karo
                res.clearCookie('connect.sid');
                
                // 3. Response bhejo
                return res.status(200).json({ 
                    success: true,
                    message: "Logged out successfully. Session and Cookie cleared." 
                });
            });
        } else {
            // Agar pehle se hi session nahi hai, toh bas message bhej do
            return res.status(200).json({ message: "Already logged out." });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export const userDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const cacheKey = `user:${userId}`;

        // 1. Pehle Redis (Cache) mein data dhoondo
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            // console.log("🚀 Redis Cache Hit! SQL ki zaroorat nahi padi.");
            // Redis hamesha string deta hai, isliye parse karke JSON banayein
            return res.json(JSON.parse(cachedData));
        }

        // 2. Agar Redis mein nahi hai (Cache Miss), toh Database se fetch karo
        console.log("🐢 Redis Cache Miss! Database se fetch kar raha hoon...");
        const [rows] = await db.execute('SELECT id, name, email FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = rows[0];

        // 3. Database se mila data Redis mein save karo 
        // setEx(key, seconds, value) -> 864000 seconds = 10 din
        await redisClient.setEx(cacheKey, 864000, JSON.stringify(user));

        // 4. Final response bhej do
        res.json(user);

    } catch (err) {
        console.error("Redis/DB Error:", err);
        res.status(500).json({ error: err.message, message: "Failed to fetch user details" });
    }
};


