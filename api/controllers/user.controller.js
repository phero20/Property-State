import User from '../models/User.js';
import {Post} from '../models/Post.js';
import SavedPost from '../models/SavedPost.js';
import crypto from 'crypto';

export const getUsers = async (req, res) => {
  try {
    const allUsers = await User.find();
    res.status(200).json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ msg: "Couldn't fetch users right now." });
  }
};

export const getUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const foundUser = await User.findById(userId);
    res.status(200).json(foundUser);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ msg: "Oops! Couldn't get user." });
  }
};

export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const authUserId = req.user.id;
  const { fullName, phone, city, state, showContactInfo } = req.body;
  if (userId !== authUserId) {
    return res.status(403).json({ msg: "Nope, not allowed!" });
  }

  try {
    const updateData = {
      fullName,
      phone,
      city,
      state,
      showContactInfo
    };

    const changedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!changedUser) return res.status(404).json({ msg: "User not found." });
    const { password: pw, ...userWithoutPw } = changedUser.toObject();
    res.status(200).json({success : true,
      userWithoutPw});
  } catch (error) {
    console.error('Update failed:', error);
    res.status(500).json({ msg: "Couldn't update user info." });
  }
};


export const savePost = async (req, res) => {
  const postId = req.params.postId;
  const tokenUserId = req.user.id;

  try {
    // Check if post is already saved in User's savedPosts
    const user = await User.findById(tokenUserId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.savedPosts.includes(postId)) {
      return res.status(400).json({ message: "Post already saved" });
    }
    // Add to User's savedPosts
    user.savedPosts.push(postId);
    await user.save();
    // Add to SavedPost collection if not exists
    const existingSavedPost = await SavedPost.findOne({ user: tokenUserId, post: postId });
    if (!existingSavedPost) {
      await SavedPost.create({ user: tokenUserId, post: postId });
    }
    res.status(200).json({ message: "Post saved successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to save post" });
  }
};

export const unsavePost = async (req, res) => {
  const postId = req.params.postId;
  const tokenUserId = req.user.id;
  try {
    // Remove from User's savedPosts
    const user = await User.findById(tokenUserId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    await user.save();
    // Remove from SavedPost collection
    await SavedPost.deleteOne({ user: tokenUserId, post: postId });
    res.status(200).json({ message: "Post unsaved successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to unsave post" });
  }
};

export const profilePosts = async (req, res) => {
  const authUserId = req.user.id;
  try {
    const myPosts = await Post.find({ author: authUserId });
    const savedList = await SavedPost.find({ user: authUserId }).populate('post');
    const savedPosts = savedList.map((entry) => entry.post);
    res.status(200).json({ myPosts, savedPosts });
  } catch (error) {
    console.error('Profile posts error:', error);
    res.status(500).json({ msg: "Couldn't get your posts." });
  }
};

export const getSavedPosts = async (req, res) => {
  const tokenUserId = req.user.id;
  try {
    const savedPosts = await SavedPost.find({ user: tokenUserId }).populate({
      path: 'post',
      populate: { path: 'userId', select: 'username avatar' }
    });
    const posts = savedPosts.map((savedPost) => savedPost.post);
    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get saved posts" });
  }
};

export const getProfile = async (req, res) => {
  const tokenUserId = req.user.id;
  try {
    const user = await User.findById(tokenUserId).select('id username email avatar createdAt');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get profile" });
  }
};

export const getNotificationNumber = async (req, res) => {
  // TODO: Implement notification count with Mongoose if needed
  // For now, return a static value or implement logic as needed
  res.status(200).json(0);
};

// Add or update the getNotifications function
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // For now, just return a static number
    // In the future, you can query your database for actual notifications
    res.status(200).json(3);
  } catch (error) {
    console.error("❌ Error getting notifications:", error);
    res.status(500).json({ message: "Failed to get notifications" });
  }
};

// Example: get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get all posts for a specific user
export const getUserPosts = async (req, res) => {
  const userId = req.params.id;
  try {
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error('❌ Error fetching user posts:', err);
    res.status(500).json({ message: "Failed to get user's posts", error: err.message });
  }
};

// Get stats for the currently authenticated user
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    // Get user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Total posts
    const totalPosts = await Post.countDocuments({ userId });
    // Total views (sum of views for all posts by user)
    const posts = await Post.find({ userId }, 'views');
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
    // Saved posts count
    const savedPosts = user.savedPosts ? user.savedPosts.length : 0;
    // Total messages (sent + received)
    // For now, count sentMessages array; for more accuracy, count from Message model
    // const totalMessages = user.sentMessages ? user.sentMessages.length : 0;
    // More accurate: count all messages where senderId = userId or recipient is in user's conversations
    const Message = (await import('../models/Message.js')).default;
    const totalMessages = await Message.countDocuments({ senderId: userId });

    res.status(200).json({
      totalPosts,
      totalViews,
      savedPosts,
      totalMessages
    });
  } catch (err) {
    console.error('❌ Error getting user stats:', err);
    res.status(500).json({ message: "Failed to get user stats" });
  }
};

// Delete current user account (authenticated user)
export const deleteCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find all posts authored by this user (field is userId)
    const userPosts = await Post.find({ userId: userId }, '_id');
    const userPostIds = userPosts.map(p => p._id);

    // Remove user
    await User.findByIdAndDelete(userId);
    // Remove user's posts
    await Post.deleteMany({ userId: userId });
    // Remove user's saved posts
    await SavedPost.deleteMany({ user: userId });
    // Remove all user's posts from all users' savedPosts arrays
    if (userPostIds.length > 0) {
      await User.updateMany(
        { savedPosts: { $in: userPostIds } },
        { $pull: { savedPosts: { $in: userPostIds } } }
      );
      // Remove all SavedPost docs for these posts
      await SavedPost.deleteMany({ post: { $in: userPostIds } });
    }
    res.status(200).json({ msg: 'Account and all related data deleted.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ msg: "Couldn't delete account." });
  }
};
