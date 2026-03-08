import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';
import db from '../../database/db.js'; 

dotenv.config();

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const facebookId = profile.id;
        const name = profile.displayName;
        const provider = 'facebook';

        // 1. Check karte hain kya ye Facebook account pehle se humare database mein hai?
        const [existingAccounts] = await db.execute(
          'SELECT * FROM social_accounts WHERE social_id = ? AND provider = ?',
          [facebookId, provider]
        );

        let dbUserId;

        if (existingAccounts.length > 0) {
          // 🎉 USER PEHLE SE HAI: Bas unka naya token update kar do (kyunki purana expire ho sakta hai)
          dbUserId = existingAccounts[0].user_id;
          await db.execute(
            'UPDATE social_accounts SET access_token = ?, profile_name = ? WHERE social_id = ?',
            [accessToken, name, facebookId]
          );
          console.log("Existing user token updated in DB!");
        } else {
          // 🚀 NAYA USER: Pehle 'users' table mein entry banao, phir 'social_accounts' mein
          // (Kyunki Facebook ne email nahi diya, hum ek dummy email bana lenge)
          const dummyEmail = `${facebookId}@facebook.com`;
          const dummyPassword = 'FACEBOOK_LOGIN_NO_PASSWORD'; 
          
          const [newUser] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, dummyEmail, dummyPassword]
          );
          
          dbUserId = newUser.insertId; // Naye user ki ID mil gayi

          // Ab is naye user ka token 'social_accounts' table mein save kar do
          await db.query(
            'INSERT INTO social_accounts (user_id, provider, social_id, profile_name, access_token) VALUES (?, ?, ?, ?, ?)',
            [dbUserId, provider, facebookId, name, accessToken]
          );
          console.log("New Facebook user saved to DB!");
        }

        // Yeh 'user' object aage authRoutes.js mein req.user bankar jayega
        const user = { 
          id: dbUserId, // Ab hum Facebook ID ki jagah apne database ki Asli ID bhej rahe hain
          facebookId: facebookId, 
          name: name 
        };
        
        return done(null, user);
      } catch (error) {
        console.error("Database error in Passport:", error);
        return done(error, null);
      }
    }
  )
);

// Passport ko session manage karne ke liye ye functions chahiye hote hain
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;