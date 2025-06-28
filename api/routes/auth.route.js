import express from "express";
import { login, logout, register } from "../controllers/auth.controller.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
