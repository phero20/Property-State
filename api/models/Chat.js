import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  user1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  user1Unread: { type: Number, default: 0 },
  user2Unread: { type: Number, default: 0 },
  lastMessage: { type: String },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;