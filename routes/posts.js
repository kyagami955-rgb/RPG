const express = require('express');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'username name profilePic');

    res.json(posts.map((post) => ({
      id: post._id,
      caption: post.caption,
      image: post.image,
      type: post.type,
      likes: post.likes.length,
      createdAt: post.createdAt,
      user: post.user,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to load posts' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { caption, type } = req.body;
    const post = await Post.create({
      user: req.user._id,
      caption: caption || '',
      type: type === 'reel' ? 'reel' : 'post',
    });

    req.user.postsCount += 1;
    await req.user.save();

    const result = await Post.findById(post._id).populate('user', 'username name profilePic');
    res.json({
      id: result._id,
      caption: result.caption,
      image: result.image,
      type: result.type,
      likes: result.likes.length,
      createdAt: result.createdAt,
      user: result.user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to create post' });
  }
});

module.exports = router;
