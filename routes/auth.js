// const express = require('express');
// const passport = require('passport');
// const dotenv = require('dotenv');
// dotenv.config(); // ✅ Must be before passport config

// require('../config/passport'); // Ensure this line imports your passport configuration

// const router = express.Router();

// // Route to start Google authentication
// router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// // Google OAuth callback
// router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
//   res.redirect('/profile');
// });

// // Profile route (show user details)
// router.get('/profile', (req, res) => {
//   if (req.isAuthenticated()) {
//     res.send(`Hello, ${req.user.displayName}`);
//   } else {
//     res.redirect('/');
//   }
// });

// // Logout route
// router.get('/logout', (req, res) => {
//   req.logout((err) => {
//     res.redirect('/');
//   });
// });

// module.exports = router;

const express = require('express');
const passport = require('passport');
const dotenv = require('dotenv');
dotenv.config();

require('../config/passport');

const router = express.Router();

// Route to start Google authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:4200/login' }), 
  (req, res) => {
    // Successful authentication, redirect to frontend with user data
    res.redirect(`http://localhost:4200/?user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

// Profile route (get user details)
router.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      user: req.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router;