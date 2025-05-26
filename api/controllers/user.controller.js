import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

export const getUsers = async (req, res) => {
  try {
    const allUsers = await prisma.user.findMany();
    res.status(200).json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ msg: "Couldn't fetch users right now." });
  }
};

export const getUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const foundUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    res.status(200).json(foundUser);
  } catch (error) {
    console.error("Error getting user:", error);
    res.status(500).json({ msg: "Oops! Couldn't get user." });
  }
};

export const updateUser = async (req, res) => {
  const userId = req.params.id;
  const authUserId = req.userId;
  const { password, avatar, ...restInputs } = req.body;

  if (userId !== authUserId) {
    return res.status(403).json({ msg: "Nope, not allowed!" });
  }

  let hashedPassword = null;
  try {
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const changedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...restInputs,
        ...(hashedPassword && { password: hashedPassword }),
        ...(avatar && { avatar }),
      },
    });

    const { password: pw, ...userWithoutPw } = changedUser;

    res.status(200).json(userWithoutPw);
  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({ msg: "Couldn't update user info." });
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.params.id;
  const authUserId = req.userId;

  if (userId !== authUserId) {
    return res.status(403).json({ msg: "Not your account!" });
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    res.status(200).json({ msg: "User account removed." });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ msg: "Couldn't remove user." });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const authUserId = req.userId;

  try {
    const alreadySaved = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: authUserId,
          postId,
        },
      },
    });

    if (alreadySaved) {
      await prisma.savedPost.delete({
        where: { id: alreadySaved.id },
      });
      res.status(200).json({ msg: "Post unsaved." });
    } else {
      await prisma.savedPost.create({
        data: {
          userId: authUserId,
          postId,
        },
      });
      res.status(200).json({ msg: "Post added to saved!" });
    }
  } catch (error) {
    console.error("Save/unsave error:", error);
    res.status(500).json({ msg: "Couldn't update saved posts." });
  }
};

export const profilePosts = async (req, res) => {
  const authUserId = req.userId;
  try {
    const myPosts = await prisma.post.findMany({
      where: { userId: authUserId },
    });
    const savedList = await prisma.savedPost.findMany({
      where: { userId: authUserId },
      include: { post: true },
    });

    const savedPosts = savedList.map((entry) => entry.post);
    res.status(200).json({ myPosts, savedPosts });
  } catch (error) {
    console.error("Profile posts error:", error);
    res.status(500).json({ msg: "Couldn't get your posts." });
  }
};

export const getNotificationNumber = async (req, res) => {
  const authUserId = req.userId;
  try {
    const notifCount = await prisma.chat.count({
      where: {
        userIDs: { hasSome: [authUserId] },
        NOT: { seenBy: { hasSome: [authUserId] } },
      },
    });
    res.status(200).json(notifCount);
  } catch (error) {
    console.error("Notification count error:", error);
    res.status(500).json({ msg: "Couldn't get notifications." });
  }
};
