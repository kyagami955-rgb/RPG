const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kenynamy-secret';
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_USERS = {};

// Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'emailOrUsername',
      passwordField: 'password',
    },
    async (emailOrUsername, password, done) => {
      try {
        const user = await User.findOne({
          $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }],
        });

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Passport Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

          if (user) {
            user.googleId = profile.id;
            await user.save();
          } else {
            const randomUsername = profile.displayName.replace(/\s+/g, '') + Math.random().toString(36).slice(-4);
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value.toLowerCase(),
              username: randomUsername.toLowerCase(),
              profilePic: profile.photos[0]?.value || '',
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, username: user.username, bio: user.bio, profilePic: user.profilePic, followers: user.followers.length, following: user.following.length, postsCount: user.postsCount } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email/username or password' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, username: user.username, bio: user.bio, profilePic: user.profilePic, followers: user.followers.length, following: user.following.length, postsCount: user.postsCount } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/check', async (req, res) => {
  try {
    const { emailOrUsername } = req.body;
    if (!emailOrUsername) {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }],
    });

    res.json({ exists: Boolean(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during user check' });
  }
});

// Google OAuth Routes
if (DEMO_MODE) {
  // Demo mode: show mock Google login page
  router.get('/google', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Sign-In - Demo Mode</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 450px;
            padding: 40px;
            text-align: center;
          }
          .google-logo {
            font-size: 48px;
            margin-bottom: 20px;
            font-weight: bold;
            color: #4285F4;
          }
          h1 { 
            color: #202124;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #5f6368;
            font-size: 14px;
            margin-bottom: 30px;
            line-height: 1.5;
          }
          .demo-badge {
            display: inline-block;
            background: #FFF3CD;
            color: #856404;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 25px;
            font-weight: 600;
          }
          .form-group {
            margin-bottom: 20px;
            text-align: left;
          }
          label {
            display: block;
            color: #202124;
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 600;
          }
          input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #dadce0;
            border-radius: 4px;
            font-size: 14px;
            font-family: inherit;
            transition: all 0.2s;
          }
          input:focus {
            outline: none;
            border-color: #4285F4;
            box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
          }
          .button-group {
            display: flex;
            gap: 12px;
            margin-top: 30px;
          }
          button {
            flex: 1;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-cancel {
            background: #f8f9fa;
            color: #3c4043;
            border: 1px solid #dadce0;
          }
          .btn-cancel:hover {
            background: #f1f3f4;
          }
          .btn-continue {
            background: #4285F4;
            color: white;
          }
          .btn-continue:hover {
            background: #3367d6;
          }
          .error { color: #d32f2f; font-size: 14px; margin-top: 10px; display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="google-logo">G</div>
          <h1>Kenynamy</h1>
          <p class="subtitle">Sign in with your email</p>
          <div class="demo-badge">🧪 Demo Mode</div>
          
          <form id="demoForm">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label for="displayName">Display Name</label>
              <input type="text" id="displayName" name="displayName" placeholder="Your Name" required>
            </div>
            <div class="form-group">
              <label for="profilePic">Profile Picture URL (optional)</label>
              <input type="url" id="profilePic" name="profilePic" placeholder="https://example.com/photo.jpg">
            </div>
            <div class="error" id="error"></div>
            <div class="button-group">
              <button type="button" class="btn-cancel" onclick="window.history.back()">Cancel</button>
              <button type="submit" class="btn-continue">Continue</button>
            </div>
          </form>
        </div>

        <script>
          document.getElementById('demoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const displayName = document.getElementById('displayName').value;
            const profilePic = document.getElementById('profilePic').value;

            try {
              const response = await fetch('/api/auth/google/demo-callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, displayName, profilePic })
              });
              
              if (response.ok) {
                const data = await response.json();
                window.location.href = '/?token=' + data.token + '&user=' + encodeURIComponent(JSON.stringify(data.user));
              } else {
                const error = await response.json();
                document.getElementById('error').textContent = error.message;
                document.getElementById('error').style.display = 'block';
              }
            } catch (err) {
              document.getElementById('error').textContent = 'An error occurred';
              document.getElementById('error').style.display = 'block';
            }
          });
        </script>
      </body>
      </html>
    `);
  });

  // Demo callback
  router.post('/google/demo-callback', async (req, res) => {
    try {
      const { email, displayName, profilePic } = req.body;
      
      if (!email || !displayName) {
        return res.status(400).json({ message: 'Email and display name are required' });
      }

      const lowerEmail = email.toLowerCase();
      let user = DEMO_USERS[lowerEmail];

      if (!user) {
        const randomUsername = displayName.replace(/\s+/g, '') + Math.random().toString(36).slice(-4);
        user = {
          _id: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          googleId: `demo_${lowerEmail}`,
          name: displayName,
          email: lowerEmail,
          username: randomUsername.toLowerCase(),
          bio: 'Signed in with demo Google',
          profilePic: profilePic || '',
          followers: [],
          following: [],
          postsCount: 0,
        };
        DEMO_USERS[lowerEmail] = user;
      } else if (!user.googleId) {
        user.googleId = `demo_${lowerEmail}`;
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          bio: user.bio,
          profilePic: user.profilePic,
          followers: user.followers.length,
          following: user.following.length,
          postsCount: user.postsCount,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error during Google sign-in' });
    }
  });
} else {
  // Production: use real Google OAuth
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      const token = jwt.sign({ id: req.user._id }, JWT_SECRET, { expiresIn: '7d' });
      const user = req.user;
      res.redirect(
        `/?token=${token}&user=${encodeURIComponent(JSON.stringify({
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          bio: user.bio,
          profilePic: user.profilePic,
          followers: user.followers.length,
          following: user.following.length,
          postsCount: user.postsCount,
        }))}`
      );
    }
  );
}

module.exports = router;
