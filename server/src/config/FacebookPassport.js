import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import db from '../config/db.js'; 
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

dotenv.config();

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'emails'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const facebookId = profile.id;
        const name = profile.displayName;
        const provider = 'facebook';
        
        const email = profile.emails && profile.emails.length > 0 
                      ? profile.emails[0].value 
                      : `${facebookId}@dummy-facebook.com`;

        // 1. Check if social account exists
        const [existingAccounts] = await db.execute(
          'SELECT * FROM social_accounts WHERE social_id = ? AND provider = ?',
          [facebookId, provider]
        );

        let dbUserId;

        if (existingAccounts.length > 0) {
          dbUserId = existingAccounts[0].user_id;
          await db.execute(
            'UPDATE social_accounts SET access_token = ?, profile_name = ? WHERE social_id = ? AND provider = ?',
            [accessToken, name, facebookId, provider]
          );
          console.log("✅ Existing Facebook user updated!");
        } else {
          // 🚨 FIX: Check email to prevent duplicate error
          const [existingMainUser] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);

          if (existingMainUser.length > 0) {
            dbUserId = existingMainUser[0].id; // Purani ID use karo
            console.log("🔗 Email matched, linking Facebook to existing user.");
          } else {
            // Naya user banao
            const randomPassword = crypto.randomBytes(20).toString('hex'); 
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const [newUser] = await db.query(
              'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
              [name, email, hashedPassword]
            );
            dbUserId = newUser.insertId; 
          }

          // Social account link karo
          await db.query(
            'INSERT INTO social_accounts (user_id, provider, social_id, profile_name, access_token) VALUES (?, ?, ?, ?, ?)',
            [dbUserId, provider, facebookId, name, accessToken]
          );
          console.log("✅ New Facebook user linked/saved!");
        }

        // 🚨 MAGIC YAHAN HAI: Humne 'provider' bhi bhej diya
        const user = { 
          id: dbUserId, 
          name: name,
          email: email,
          provider: 'facebook' // 👈 Ye ab token mein jayega
        };
        
        return done(null, user);
      } catch (error) {
        console.error("❌ Database error in Passport Facebook:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
 
export default passport;