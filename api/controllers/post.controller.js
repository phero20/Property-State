import { Post, PostDetail } from '../models/Post.js';
import User from '../models/User.js';
import SavedPost from '../models/SavedPost.js'; // <-- Add this import
import cloudinary from '../lib/cloudinary.js';

// Get paginated and filtered posts
export const getPosts = async (req, res) => {
  const query = req.query;
  try {
    // Build filter object for Mongoose
    const filter = {};
    if (query.city) filter.city = { $regex: query.city, $options: 'i' };
    if (query.type) filter.type = query.type;
    if (query.property) filter.property = query.property;
    if (query.bedroom) filter.bedroom = { $gte: parseInt(query.bedroom) };
    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = parseInt(query.minPrice);
      if (query.maxPrice) filter.price.$lte = parseInt(query.maxPrice);
    }
    // Pagination
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    // Query posts and populate user info
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId')
      .select('title price images address city bedroom bathroom type property createdAt userId');
    // Map posts to include ownerInfo
    const postsWithOwner = posts.map(post => {
      const postObj = post.toObject();
      const user = post.userId;
      return {
        ...postObj,
        ownerInfo: user ? {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone || null,
          fullName: user.fullName || user.username,
          avatar: user.avatar,
          verified: false,
          showContactInfo: true,
          memberSince: user.createdAt,
          location: post.city,
          userType: 'standard',
        } : null,
      };
    });
    res.status(200).json(postsWithOwner);
  } catch (err) {
    console.error('❌ Database error in getPosts:', err);
    res.status(200).json([]);
  }
};

// Create a new post
export const addPost = async (req, res) => {
  try {
    const { postData, postDetail } = req.body;
    const tokenUserId = req.user.id;
    if (!postData || !postData.title || !postData.price || !postData.city) {
      return res.status(400).json({ message: "Missing required fields in postData" });
    }
    // Parse numeric fields
    const numericPrice = parseFloat(postData.price);
    const numericBedroom = postData.bedroom ? parseInt(postData.bedroom) : undefined;
    const numericBathroom = postData.bathroom ? parseFloat(postData.bathroom) : undefined;
    // Upload images to Cloudinary if present
    let imageUrls = [];
    if (Array.isArray(postData.images) && postData.images.length > 0) {
      const uploadPromises = postData.images.map(async (img, idx) => {
        try {
          if (!img || typeof img !== 'string') {
            console.error(`Image at index ${idx} is not a string:`, img);
            return null;
          }
          // Ensure the string starts with data:image/
          if (!img.startsWith('data:image/')) {
            console.error(`Image at index ${idx} does not start with data:image/:`, img.substring(0, 30));
            return null;
          }
          const uploadRes = await cloudinary.uploader.upload(img, {
            folder: 'property-listings',
            resource_type: 'image',
          });
          return uploadRes.secure_url;
        } catch (err) {
          console.error(`Cloudinary upload error for image[${idx}]:`, err);
          return null;
        }
      });
      imageUrls = (await Promise.all(uploadPromises)).filter(Boolean);
      if (imageUrls.length === 0) {
        console.error('No images were successfully uploaded to Cloudinary.');
      }
    }

    // Create post with Cloudinary image URLs
    const newPost = await Post.create({
      title: postData.title,
      price: numericPrice,
      images: imageUrls,
      address: postData.address || '',
      city: postData.city,
      bedroom: numericBedroom,
      bathroom: numericBathroom,
      latitude: postData.latitude,
      longitude: postData.longitude,
      type: postData.type || 'rent',
      property: postData.property || 'apartment',
      userId: tokenUserId,
      tags: postData.tags || [],
    });
    // If postDetail is provided, create and link it
    let newPostDetail = null;
    if (postDetail) {
      newPostDetail = await PostDetail.create({
        ...postDetail,
        postId: newPost._id
      });
      newPost.postDetail = newPostDetail._id;
      await newPost.save();
    }
    // Populate user info
    const populatedPost = await Post.findById(newPost._id).populate('userId');
    const responsePost = {
      ...populatedPost.toObject(),
      postDetail: newPostDetail,
      ownerInfo: populatedPost.userId ? {
        id: populatedPost.userId.id,
        username: populatedPost.userId.username,
        email: populatedPost.userId.email,
        phone: populatedPost.userId.phone || null,
        fullName: populatedPost.userId.username,
        avatar: populatedPost.userId.avatar,
        verified: false,
        showContactInfo: true,
        memberSince: populatedPost.userId.createdAt,
        location: `${populatedPost.city}`,
        userType: 'standard',
      } : undefined,
    };
    res.status(201).json(responsePost);
  } catch (err) {
    console.error('❌ Database error creating post:', err);
    res.status(500).json({ message: "Failed to create post in database", error: err.message });
  }
};

// Get a single post by ID
export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    // Validate MongoDB ObjectId
    if (!id || id.length !== 24) {
      return res.status(400).json({ message: "Invalid post ID" });
    }
    // Increment views atomically
    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('userId').populate('postDetail');
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Always ensure _id is present and ownerInfo is null if userId is missing
    const postObj = post.toObject();
    if (!postObj._id) postObj._id = post._id;
    const ownerInfo = post.userId ? {
      id: post.userId.id,
      username: post.userId.username,
      email: post.userId.email,
      fullName: post.userId.fullName || post.userId.username,
      avatar: post.userId.avatar,
      verified: false,
      phone: post.userId.phone || null,
      showContactInfo: true,
      memberSince: post.userId.createdAt,
      location: [
        post.address,
        post.city,
        post.state ? post.state : null,
        post.zipCode ? post.zipCode : null,
        post.country
      ]
        .filter(Boolean)
        .join(', '),
      userType: 'standard',
    } : null;
    const transformedPost = {
      ...postObj,
      ownerInfo,
      postDetail: post.postDetail || null,
    };
    res.status(200).json(transformedPost);
  } catch (err) {
    console.error('❌ Error in getPost:', err);
    res.status(500).json({ message: "Failed to get post", error: err.message });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.user.id || req.user.id;
  const { postData, postDetail } = req.body;
  try {
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (existingPost.userId.toString() !== tokenUserId) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }
    let imageUrls = existingPost.images || [];
    if (postData && Array.isArray(postData.images)) {
      if (postData.images.length > 0) {
        const uploadPromises = postData.images.map(async (img) => {
          if (typeof img === 'string' && img.startsWith('data:image/')) {
            try {
              const uploadRes = await cloudinary.uploader.upload(img, {
                folder: 'property-listings',
                resource_type: 'image',
              });
              return uploadRes.secure_url;
            } catch (err) {
              // keep error for cloudinary upload
              console.error('Cloudinary upload error:', err);
              return null;
            }
          } else if (typeof img === 'string' && img.startsWith('http')) {
            return img;
          } else {
            return null;
          }
        });
        imageUrls = (await Promise.all(uploadPromises)).filter(Boolean);
      } else {
        imageUrls = [];
      }
    }
    const updateData = {
      title: postData.title,
      price: postData.price ? parseFloat(postData.price) : undefined,
      images: imageUrls,
      address: postData.address,
      city: postData.city,
      bedroom: postData.bedroom ? parseInt(postData.bedroom) : undefined,
      bathroom: postData.bathroom ? parseFloat(postData.bathroom) : undefined,
      type: postData.type,
      property: postData.property,
      description: postData.description || '',
    };
    const updatedPost = await Post.findByIdAndUpdate(id, updateData, { new: true }).populate('userId');
    let updatedPostDetail = null;
    if (postDetail) {
      if (updatedPost.postDetail) {
        updatedPostDetail = await PostDetail.findByIdAndUpdate(
          updatedPost.postDetail,
          { ...postDetail },
          { new: true, upsert: true }
        );
      } else {
        updatedPostDetail = await PostDetail.create({ ...postDetail, postId: updatedPost._id });
        updatedPost.postDetail = updatedPostDetail._id;
        await updatedPost.save();
      }
    }
    const populatedPost = await Post.findById(updatedPost._id).populate('userId').populate('postDetail');
    const ownerInfo = populatedPost.userId ? {
      id: populatedPost.userId.id,
      username: populatedPost.userId.username,
      email: populatedPost.userId.email,
      fullName: populatedPost.userId.fullName || populatedPost.userId.username,
      avatar: populatedPost.userId.avatar,
      verified: false,
      phone: populatedPost.userId.phone || null,
      showContactInfo: true,
      memberSince: populatedPost.userId.createdAt,
      location: [
        populatedPost.address,
        populatedPost.city,
        populatedPost.state ? populatedPost.state : null,
        populatedPost.zipCode ? populatedPost.zipCode : null,
        populatedPost.country
      ].filter(Boolean).join(', '),
      userType: 'standard',
    } : null;
    const responsePost = {
      ...populatedPost.toObject(),
      ownerInfo,
      postDetail: populatedPost.postDetail || null,
    };
    res.status(200).json(responsePost);
  } catch (err) {
    // error updating post
    console.error(err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.user.id;
  try {
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (existingPost.userId.toString() !== tokenUserId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    await User.updateMany(
      { savedPosts: id },
      { $pull: { savedPosts: id } }
    );
    await SavedPost.deleteMany({ post: id });
    await Post.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Post deleted and removed from all users' saved posts" });
  } catch (err) {
    // error deleting post
    console.error(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
