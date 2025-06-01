import prisma from "../lib/prisma.js";

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    console.log('📊 Getting posts from DATABASE with filters:', query);
    
    // Build where clause for filtering
    const where = {};
    
    if (query.city) {
      where.city = {
        contains: query.city,
        mode: 'insensitive'
      };
    }
    
    if (query.type) {
      where.type = query.type;
    }
    
    if (query.property) {
      where.property = query.property;
    }
    
    if (query.bedroom) {
      where.bedroom = {
        gte: parseInt(query.bedroom)
      };
    }
    
    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = parseInt(query.minPrice);
      if (query.maxPrice) where.price.lte = parseInt(query.maxPrice);
    }

    // Fetch posts from database with user information
    const posts = await prisma.post.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            createdAt: true
          }
        },
        postDetail: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform posts to include ownerInfo for frontend compatibility
    const transformedPosts = posts.map(post => ({
      ...post,
      ownerInfo: {
        id: post.user.id,
        username: post.user.username,
        email: post.user.email,
        fullName: post.user.username,
        avatar: post.user.avatar,
        verified: false,
        showContactInfo: true,
        memberSince: post.user.createdAt,
        location: `${post.city || 'Unknown City'}`,
        userType: 'standard'
      }
    }));

    console.log(`✅ Returning ${transformedPosts.length} posts from DATABASE`);
    res.status(200).json(transformedPosts);
    
  } catch (err) {
    console.error('❌ Database error:', err);
    res.status(500).json({ message: "Failed to get posts from database" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    console.log('📝 Creating post in DATABASE:', body.title);
    console.log('👤 User ID from token:', tokenUserId);
    console.log('📊 Post data received:', {
      title: body.title,
      price: body.price,
      city: body.city,
      type: body.type,
      property: body.property,
      imagesCount: body.images?.length || 0
    });

    // Validate required fields
    if (!body.title || !body.price || !body.city) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create post with postDetail in database
    const newPost = await prisma.post.create({
      data: {
        title: body.title,
        price: parseInt(body.price),
        images: body.images || [],
        address: body.address || '',
        city: body.city,
        bedroom: parseInt(body.bedroom) || 0,
        bathroom: parseFloat(body.bathroom) || 0,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        type: body.type,
        property: body.property,
        userId: tokenUserId,
        postDetail: body.postDetail ? {
          create: {
            desc: body.postDetail.desc || '',
            utilities: body.postDetail.utilities || '',
            pet: body.postDetail.pet || '',
            income: body.postDetail.income || '',
            size: body.postDetail.size ? parseInt(body.postDetail.size) : null,
            school: body.postDetail.school ? parseInt(body.postDetail.school) : null,
            bus: body.postDetail.bus ? parseInt(body.postDetail.bus) : null,
            restaurant: body.postDetail.restaurant ? parseInt(body.postDetail.restaurant) : null,
          }
        } : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
            createdAt: true
          }
        },
        postDetail: true
      }
    });

    // Transform response to include ownerInfo
    const responsePost = {
      ...newPost,
      ownerInfo: {
        id: newPost.user.id,
        username: newPost.user.username,
        email: newPost.user.email,
        fullName: newPost.user.username,
        avatar: newPost.user.avatar,
        verified: false,
        showContactInfo: true,
        memberSince: newPost.user.createdAt,
        location: `${newPost.city}`,
        userType: 'standard'
      }
    };

    console.log('✅ Post created successfully in DATABASE:', newPost.id);
    res.status(200).json(responsePost);
    
  } catch (err) {
    console.error('❌ Database error creating post:', err);
    res.status(500).json({ message: "Failed to create post in database" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
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

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

export const updatePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;
  const body = req.body;

  try {
    const updatedPost = await prisma.post.update({
      where: { id, userId: tokenUserId },
      data: body,
    });
    res.status(200).json(updatedPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    await prisma.post.delete({
      where: { id, userId: tokenUserId },
    });
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
