import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
  getUser, 
  updateUser, 
  getNotifications 
} from "../controllers/user.controller.js";

const router = express.Router();

// IMPORTANT: Put specific routes BEFORE parameterized routes
// Fix for notifications route
router.get("/notifications", verifyToken, getNotifications);

// Other routes
router.get("/:id", getUser);
router.put("/:id", verifyToken, updateUser);

export default router;
