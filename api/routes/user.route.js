import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Mock controller functions for now
const savePost = async (req, res) => {
  res.json({ 
    message: "Post saved successfully!", 
    postId: req.body.postId,
    userId: req.userId 
  });
};

const getSavedPosts = async (req, res) => {
  res.json({ message: "Get saved posts - not implemented yet", savedPosts: [] });
};

const getProfile = async (req, res) => {
  res.json({ 
    message: "Get profile - not implemented yet", 
    userId: req.userId 
  });
};

router.post("/save", verifyToken, savePost);
router.get("/saved", verifyToken, getSavedPosts);
router.get("/profile", verifyToken, getProfile);

export default router;
