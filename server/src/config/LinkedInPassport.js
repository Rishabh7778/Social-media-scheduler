import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import passport from 'passport';
import axios from 'axios'; 
import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_CALLBACK_URL,
  scope: ['openid', 'profile', 'email', 'w_member_social'],
  state: true,
  skipUserProfile: true 
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { data: linkedInUser } = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const linkedinId = linkedInUser.sub; 
    const name = linkedInUser.name;
    const email = linkedInUser.email;
    const provider = 'linkedin';

    console.log("✅ LinkedIn Profile Fetched:", name);

    const [existingAccounts] = await db.execute(
      'SELECT * FROM social_accounts WHERE social_id = ? AND provider = ?',
      [linkedinId, provider]
    );

    let dbUserId;

    if (existingAccounts.length > 0) {
      dbUserId = existingAccounts[0].user_id;
      await db.execute(
        'UPDATE social_accounts SET access_token = ?, profile_name = ? WHERE social_id = ? AND provider = ?',
        [accessToken, name, linkedinId, provider]
      );
      console.log("✅ Existing LinkedIn user updated!");
    } else {
      // 🚨 FIX: Check email to prevent duplicate error
      const [existingMainUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);

      if (existingMainUser.length > 0) {
        dbUserId = existingMainUser[0].id;
        console.log("🔗 Email matched, linking LinkedIn to existing user.");
      } else {
        const randomPassword = crypto.randomBytes(20).toString('hex'); 
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        const [newUser] = await db.query(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
          [name, email, hashedPassword] 
        );
        dbUserId = newUser.insertId;
      }

      await db.query(
        'INSERT INTO social_accounts (user_id, provider, social_id, profile_name, access_token) VALUES (?, ?, ?, ?, ?)',
        [dbUserId, provider, linkedinId, name, accessToken]
      );
      console.log("✅ New LinkedIn user linked/saved!");
    }

    // 🚨 MAGIC YAHAN HAI: Humne 'provider' bhi bhej diya
    const user = { 
      id: dbUserId, 
      name: name,
      email: email,
      provider: 'linkedin' // 👈 Ye ab token mein jayega
    };
    
    return done(null, user);
  } catch (err) {
    console.error("❌ LinkedIn Auth Error:", err.response?.data || err.message);
    return done(err, null);
  }
}));

export default passport;