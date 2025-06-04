import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
  getPosts, 
  getPost, 
  addPost, 
  updatePost, 
  deletePost 
} from "../controllers/post.controller.js";

const router = express.Router();

// Public routes - no authentication required
router.get("/", getPosts);
router.get("/:id", getPost);

// Protected routes - authentication required
router.post("/", verifyToken, addPost);
router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);

export default router;
