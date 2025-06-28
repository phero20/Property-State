import { Post, PostDetail } from '../models/Post.js';
import User from '../models/User.js';
import SavedPost from '../models/SavedPost.js'; // <-- Add this import
import cloudinary from '../lib/cloudinary.js';

export const getPosts = async (req, res) => {
  const query = req.query;
  try {
    console.log('get posts running with query:', query);
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
    // Query posts
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title price images address city bedroom bathroom type property createdAt userId');
    res.status(200).json(posts);
  } catch (err) {
    console.error('❌ Database error in getPosts:', err);
    res.status(200).json([]);
  }
};

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
  console.log('data is',postData)
    // Upload images to Cloudinary if present
    let imageUrls = [];
    if (Array.isArray(postData.images) && postData.images.length > 0) {
      const uploadPromises = postData.images.map(async (img, idx) => {
        try {
          if (!img || typeof img !== 'string') {
            console.error(`Image at index ${idx} is not a string:`, img);
            return null;
          }
          // Log the first 100 chars for debugging
          console.log(`Uploading image[${idx}]:`, img.substring(0, 100));
          // Ensure the string starts with data:image/
          if (!img.startsWith('data:image/')) {
            console.error(`Image at index ${idx} does not start with data:image/:`, img.substring(0, 30));
            return null;
          }
          const uploadRes = await cloudinary.uploader.upload(img, {
            folder: 'property-listings',
            resource_type: 'image',
          });
          console.log(`Cloudinary upload success for image[${idx}]:`, uploadRes.secure_url);
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
    console.log('Populated user:', populatedPost.userId);
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
    // console.log("responsePost",responsePost)
    res.status(201).json(responsePost);
  } catch (err) {
    console.error('❌ Database error creating post:', err);
    res.status(500).json({ message: "Failed to create post in database", error: err.message });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    // Validate MongoDB ObjectId
    console.log('get post callled with id:', id);
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
    console.log(transformedPost)
    res.status(200).json(transformedPost);
  } catch (err) {
    console.error('❌ Error in getPost:', err);
    res.status(500).json({ message: "Failed to get post", error: err.message });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.user.id || req.user.id;
  const { postData, postDetail } = req.body;
  try {
    // First check if post exists and belongs to this user
    console.log('data from frontend',postData, postDetail)
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (existingPost.userId.toString() !== tokenUserId) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }
    // Upload new images to Cloudinary if any are base64
    let imageUrls = existingPost.images || [];
    if (postData && Array.isArray(postData.images)) {
      if (postData.images.length > 0) {
        // Always re-upload any base64 images, keep URLs as is
        const uploadPromises = postData.images.map(async (img) => {
          if (typeof img === 'string' && img.startsWith('data:image/')) {
            try {
              const uploadRes = await cloudinary.uploader.upload(img, {
                folder: 'property-listings',
                resource_type: 'image',
              });
              return uploadRes.secure_url;
            } catch (err) {
              console.error('Cloudinary upload error:', err);
              return null;
            }
          } else if (typeof img === 'string' && img.startsWith('http')) {
            // Already a Cloudinary or remote URL, keep as is
            return img;
          } else {
            // Not a valid image string, skip
            return null;
          }
        });
        imageUrls = (await Promise.all(uploadPromises)).filter(Boolean);
        console.log(`Updated image URLs:`, imageUrls);
      } else {
        // If images array is empty, clear images
        imageUrls = [];
      }
    }
    // Update post (remove latitude, longitude; add description)
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
    // Update or create postDetail if provided
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
    // Populate postDetail for response
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
    console.log(err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.user.id;
  try {
    // First check if post exists and belongs to this user
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (existingPost.userId.toString() !== tokenUserId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    // Remove post ID from all users' savedPosts arrays
    await User.updateMany(
      { savedPosts: id },
      { $pull: { savedPosts: id } }
    );
    // Remove all SavedPost documents for this post
    await SavedPost.deleteMany({ post: id });
    await Post.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Post deleted and removed from all users' saved posts" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
