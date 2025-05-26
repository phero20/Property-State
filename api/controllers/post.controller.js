import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  let query = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city ? query.city : undefined,
        type: query.type ? query.type : undefined,
        property: query.property ? query.property : undefined,
        bedroom: query.bedroom ? parseInt(query.bedroom) : undefined,
        price: {
          gte: query.minPrice ? parseInt(query.minPrice) : undefined,
          lte: query.maxPrice ? parseInt(query.maxPrice) : undefined,
        },
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    console.log("error getting posts", err);
    res.status(500).json({ message: "could not get posts" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id: id },
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    const token = req.cookies && req.cookies.token;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (!err) {
          const saved = await prisma.savedPost.findUnique({
            where: {
              userId_postId: {
                postId: id,
                userId: payload.id,
              },
            },
          });
          res.status(200).json({ ...post, isSaved: saved ? true : false });
        }
      });
    }
    res.status(200).json({ ...post, isSaved: false });
  } catch (err) {
    console.log("couldn't get post", err);
    res.status(500).json({ message: "could not get post" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        ...body.postData,
        userId: tokenUserId,
        postDetail: {
          create: body.postDetail,
        },
      },
    });
    res.status(200).json(newPost);
  } catch (err) {
    console.log("add post fail", err);
    res.status(500).json({ message: "could not make post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    res.status(200).json();
  } catch (err) {
    console.log("update post error", err);
    res.status(500).json({ message: "could not update post" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id: id },
    });

    if (post.userId !== tokenUserId) {
      return res.status(403).json({ message: "not allowed!" });
    }

    await prisma.post.delete({
      where: { id: id },
    });

    res.status(200).json({ msg: "post deleted lol" });
  } catch (err) {
    console.log("delete post fail", err);
    res.status(500).json({ msg: "couldn't delete post, oops" });
  }
};
