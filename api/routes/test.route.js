import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/should-be-logged-in", verifyToken, (req, res) => {
  console.log('✅ User authenticated:', req.userId);
  res.status(200).json({ message: "You are Authenticated", userId: req.userId });
});

router.get("/should-be-admin", verifyToken, (req, res) => {
  console.log('❌ Admin check - not authorized');
  res.status(403).json({ message: "Not authorized!" });
});

export default router;
