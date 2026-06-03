const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, default: '' },
    image: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    type: { type: String, enum: ['post', 'reel'], default: 'post' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
