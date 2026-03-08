import axios from 'axios';
import db from '../../database/db.js';

export const getUserPages = async (req, res) => {
  try {
    const userId = req.user.id;
    // 1. Database se token nikalo
    const [rows] = await db.execute('SELECT access_token FROM social_accounts WHERE user_id = ?', [userId]);
    
    if (rows.length === 0) return res.status(404).json({ message: "No FB Token found" });

    const userToken = rows[0].access_token;
    console.log("User Token:", userToken); // Token check karo

    // 2. Facebook API call
    const fbRes = await axios.get(`https://graph.facebook.com/v20.0/me/accounts?access_token=${userToken}`);
    
    console.log("Facebook Response Data:", fbRes.data); // YE SABSE IMPORTANT HAI
    
    res.json(fbRes.data.data); // Pages ki list array mein
  } catch (error) {
    console.error("FB API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "FB API Failed" });
  }
};