require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 4000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

app.use(cors());
app.use(express.json());
app.use(session({
  secret: process.env.JWT_SECRET || 'kenynamy-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: true },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.use(express.static(__dirname));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

mongoose.set('strictQuery', false);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kenynamy';

const startServer = () => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (DEMO_MODE) {
      console.log('Demo mode enabled. Google demo login is available.');
    }
  });
};

if (DEMO_MODE) {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('MongoDB connected');
      startServer();
    })
    .catch((err) => {
      console.warn('MongoDB connection unavailable, starting in demo mode without database:', err.message || err);
      startServer();
    });
} else {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('MongoDB connected');
      startServer();
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
}
