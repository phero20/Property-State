import express from 'express'
import { prisma } from '../lib/prisma.js'

const router = express.Router()

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        },
        postDetail: true
      }
    })
    res.json(posts)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create a new post
router.post('/', async (req, res) => {
  try {
    const post = await prisma.post.create({
      data: {
        ...req.body,
        userId: req.user.id // assuming you have authentication
      }
    })
    res.json(post)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router