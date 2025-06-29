import mongoose from 'mongoose';

const postDetailSchema = new mongoose.Schema({
  desc: { type: String },
  utilities: { type: String },
  pet: { type: String },
  income: { type: String },
  size: { type: Number },
  school: { type: Number },
  bus: { type: Number },
  restaurant: { type: Number },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', unique: true, required: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  address: { type: String },
  city: { type: String, required: true },
  bedroom: { type: Number },
  bathroom: { type: Number },
  latitude: { type: String },
  longitude: { type: String },
  type: { type: String, default: 'rent' },
  property: { type: String, default: 'apartment' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postDetail: { type: mongoose.Schema.Types.ObjectId, ref: 'PostDetail' },
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
  tags: [{ type: String }],
  views: { type: Number, default: 0 }, 
}, { timestamps: true });

const PostDetail = mongoose.model('PostDetail', postDetailSchema);
const Post = mongoose.model('Post', postSchema);
export { Post, PostDetail };