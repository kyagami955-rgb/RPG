const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

router.get('/me', auth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
      followers: user.followers.length,
      following: user.following.length,
      postsCount: user.postsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load profile' });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = req.user;
    if (name) user.name = name;
    if (bio) user.bio = bio;
    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to update profile' });
  }
});

router.post('/me/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const user = req.user;
    user.profilePic = photoUrl;
    await user.save();

    res.json({ message: 'Profile photo updated', profilePic: photoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to upload photo' });
  }
});

module.exports = router;
