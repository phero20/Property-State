import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
  getUser, 
  updateUser, 
  getNotifications,
  getUserPosts,
  savePost,
  unsavePost,
  getUserStats,
  getSavedPosts,
  deleteCurrentUser
} from "../controllers/user.controller.js";

const router = express.Router();

// IMPORTANT: Put specific routes BEFORE parameterized routes
// Fix for notifications route
router.get("/notifications", verifyToken, getNotifications);

// Add route for user stats (must be before parameterized routes)
router.get("/stats", verifyToken, getUserStats);

// Add route for getting saved posts (must be before parameterized routes)
router.get("/saved-posts", verifyToken, getSavedPosts);

// Other routes
router.get("/:id", getUser);
router.put("/:id", verifyToken, updateUser);
// Add route for getting all posts by user
router.get("/:id/posts", getUserPosts);
// Add route for saving and unsaving posts
router.post("/save-post/:postId", verifyToken, savePost);
router.delete("/save-post/:postId", verifyToken, unsavePost);
// Delete current user account (authenticated user)
router.delete('/deleteme', verifyToken, deleteCurrentUser);

export default router;
