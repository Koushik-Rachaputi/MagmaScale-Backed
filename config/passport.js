const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error('❌ Error deserializing user:', err);
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`,
}, async (token, tokenSecret, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails?.[0]?.value || '',
        profilePic: profile.photos?.[0]?.value || '',
      });
      await user.save();
      console.log(`✅ New user created: ${user.displayName} (${user.email})`);
    } else {
      console.log(`✅ Existing user logged in: ${user.displayName} (${user.email})`);
    }

    return done(null, user);
  } catch (err) {
    console.error('❌ Error in Google OAuth Strategy:', err);
    return done(err, null);
  }
}));
