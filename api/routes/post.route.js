import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Test data for development
const testPosts = [
  {
    id: '1',
    title: 'Beautiful Downtown Apartment',
    price: 2500,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop'
    ],
    address: '123 Main Street',
    city: 'New York',
    bedroom: 2,
    bathroom: 2,
    latitude: '40.7128',
    longitude: '-74.0060',
    type: 'rent',
    property: 'apartment',
    userId: '1',
    user: {
      username: 'john_doe',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
    },
    postDetail: {
      desc: 'Beautiful apartment with modern amenities in the heart of downtown.',
      utilities: 'Included',
      pet: 'Allowed',
      income: '3x rent',
      size: 1200,
      school: 5,
      bus: 2,
      restaurant: 1
    }
  },
  {
    id: '2',
    title: 'Luxury Family House for Sale',
    price: 750000,
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop'
    ],
    address: '456 Oak Avenue',
    city: 'Los Angeles',
    bedroom: 4,
    bathroom: 3,
    latitude: '34.0522',
    longitude: '-118.2437',
    type: 'buy',
    property: 'house',
    userId: '2',
    user: {
      username: 'jane_smith',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
    },
    postDetail: {
      desc: 'Spacious family home with a large backyard and modern kitchen.',
      utilities: 'Not included',
      pet: 'Not allowed',
      income: 'Good credit required',
      size: 2800,
      school: 3,
      bus: 10,
      restaurant: 5
    }
  },
  {
    id: '3',
    title: 'Modern Studio Apartment',
    price: 1800,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop'
    ],
    address: '789 Pine Street',
    city: 'Chicago',
    bedroom: 1,
    bathroom: 1,
    latitude: '41.8781',
    longitude: '-87.6298',
    type: 'rent',
    property: 'apartment',
    userId: '3',
    user: {
      username: 'mike_wilson',
      avatar: null
    },
    postDetail: {
      desc: 'Modern studio with great city views and all amenities included.',
      utilities: 'Included',
      pet: 'Not allowed',
      income: '2.5x rent',
      size: 600,
      school: 8,
      bus: 3,
      restaurant: 2
    }
  }
];

// Controller functions
const getPosts = async (req, res) => {
  try {
    console.log('📊 Getting posts with filters:', req.query);
    
    let filteredPosts = [...testPosts];
    
    // Apply filters
    if (req.query.city) {
      filteredPosts = filteredPosts.filter(post => 
        post.city.toLowerCase().includes(req.query.city.toLowerCase())
      );
    }
    
    if (req.query.type) {
      filteredPosts = filteredPosts.filter(post => post.type === req.query.type);
    }
    
    if (req.query.property) {
      filteredPosts = filteredPosts.filter(post => post.property === req.query.property);
    }
    
    if (req.query.bedroom) {
      filteredPosts = filteredPosts.filter(post => post.bedroom >= parseInt(req.query.bedroom));
    }
    
    if (req.query.minPrice) {
      filteredPosts = filteredPosts.filter(post => post.price >= parseInt(req.query.minPrice));
    }
    
    if (req.query.maxPrice) {
      filteredPosts = filteredPosts.filter(post => post.price <= parseInt(req.query.maxPrice));
    }
    
    console.log(`✅ Returning ${filteredPosts.length} posts`);
    
    // Return posts directly in data array format
    res.json(filteredPosts);
  } catch (error) {
    console.error('❌ Error getting posts:', error);
    res.status(500).json({ message: 'Failed to get posts' });
  }
};

const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📊 Getting post with ID:', id);
    
    const post = testPosts.find(p => p.id === id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    console.log('✅ Returning post:', post.title);
    res.json(post);
  } catch (error) {
    console.error('❌ Error getting post:', error);
    res.status(500).json({ message: 'Failed to get post' });
  }
};

const addPost = async (req, res) => {
  try {
    console.log('📝 Creating new post:', req.body);
    
    const newPost = {
      id: (testPosts.length + 1).toString(),
      ...req.body,
      userId: req.userId,
      user: {
        username: 'current_user', // This would come from the authenticated user
        avatar: null
      }
    };
    
    // In a real app, this would be saved to database
    testPosts.push(newPost);
    
    console.log('✅ Post created successfully:', newPost.id);
    res.status(201).json({ 
      message: 'Post created successfully!', 
      post: newPost 
    });
  } catch (error) {
    console.error('❌ Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Updating post:', id);
    
    const postIndex = testPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (testPosts[postIndex].userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }
    
    testPosts[postIndex] = { ...testPosts[postIndex], ...req.body };
    
    console.log('✅ Post updated successfully');
    res.json({ 
      message: 'Post updated successfully!', 
      post: testPosts[postIndex] 
    });
  } catch (error) {
    console.error('❌ Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting post:', id);
    
    const postIndex = testPosts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user owns the post
    if (testPosts[postIndex].userId !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    
    testPosts.splice(postIndex, 1);
    
    console.log('✅ Post deleted successfully');
    res.json({ message: 'Post deleted successfully!' });
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

// Routes
router.get("/", getPosts);
router.get("/:id", getPost);
router.post("/", verifyToken, addPost);
router.put("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);

export default router;
