import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  phone: { type: String },
  dateOfBirth: { type: String },
  gender: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  userType: { type: String },
  emailNotifications: { type: Boolean },
  smsNotifications: { type: Boolean },
  marketingEmails: { type: Boolean },
  profileVisibility: { type: String },
  showContactInfo: { type: Boolean },
  showOnlineStatus: { type: Boolean },
  language: { type: String },
  currency: { type: String },
  timezone: { type: String },
  avatar: { type: String },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  sentMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
  conversationsAsUser1: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
  conversationsAsUser2: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], 

}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;