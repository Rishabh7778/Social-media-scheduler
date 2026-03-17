import axios from 'axios';
import db from '../config/db.js';

// controller/socialController.js (Ya jahan aapka getAllAccounts hai)
export const getAllAccounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      'SELECT provider, access_token, social_id FROM social_accounts WHERE user_id = ?', 
      [userId]
    );

    // 🔥 Parallel processing start: Saari API calls ek saath jayengi
    const accountPromises = rows.map(async (row) => {
      if (row.provider === 'facebook') {
        try {
          const fbRes = await axios.get(`https://graph.facebook.com/v20.0/me/accounts?access_token=${row.access_token}`);
          return fbRes.data.data.map(page => ({
            id: page.id,
            name: page.name,
            platform: 'facebook',
            access_token: page.access_token,
            image: `https://graph.facebook.com/${page.id}/picture`
          }));
        } catch (e) { return []; }
      } 
      
      if (row.provider === 'linkedin') {
        try {
          const liRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${row.access_token}` }
          });
          return [{
            id: liRes.data.sub,
            name: liRes.data.name,
            platform: 'linkedin',
            access_token: row.access_token,
            image: liRes.data.picture || null
          }];
        } catch (e) { return []; }
      }
      return [];
    });

    const results = await Promise.all(accountPromises);
    const finalAccounts = results.flat(); // Saare arrays ko merge kar diya

    res.json(finalAccounts);

  } catch (error) {
    console.error("Fetch Accounts Error:", error.message);
    res.status(500).json({ error: "Failed to fetch social accounts" });
  }
};