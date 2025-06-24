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

    // Add pagination to avoid large result sets
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // First try to get only essential fields for better performance
    const posts = await prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        address: true,
        city: true,
        bedroom: true,
        bathroom: true,
        type: true,
        property: true,
        createdAt: true,
        userId: true
      }
    });
    
    // Format response and send
    res.status(200).json(posts);
    
  } catch (err) {
    console.error('❌ Database error in getPosts:', err);
    // Return empty array instead of 500 error for better UX
    res.status(200).json([]);
  }
};

export const addPost = async (req, res) => {
  try {
    const body = req.body;
    const tokenUserId = req.userId;
    
    console.log('📝 Creating post from request:', body.title);
    
    // Validate required fields
    if (!body.title || !body.price || !body.city) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Extract user connection - either from body or token
    let userConnection;
    if (body.user?.connect?.id) {
      // If client sent user connection object
      userConnection = body.user;
    } else {
      // If client sent userId or using token
      userConnection = {
        connect: { id: tokenUserId }
      };
    }
    
    // Parse numeric fields
    const numericPrice = parseFloat(body.price);
    const numericBedroom = body.bedroom ? parseInt(body.bedroom) : 0;
    const numericBathroom = body.bathroom ? parseFloat(body.bathroom) : 0;
    
    // Handle post detail creation
    let postDetailCreate;
    if (body.postDetail?.create) {
      // Client sent properly formatted nested create
      postDetailCreate = body.postDetail;
    } else {
      // Client sent flattened structure - recreate proper structure
      postDetailCreate = {
        create: {
          desc: body.desc || body.description || '',
          utilities: body.utilities || '',
          pet: body.pet || '',
          income: body.income || '',
          size: body.size ? parseInt(body.size) : null,
          school: body.school ? parseInt(body.school) : null,
          bus: body.bus ? parseInt(body.bus) : null,
          restaurant: body.restaurant ? parseInt(body.restaurant) : null,
        }
      };
    }
    
    // Create post with proper structure
    const newPost = await prisma.post.create({
      data: {
        title: body.title,
        price: numericPrice,
        images: body.images || [],
        address: body.address || '',
        city: body.city,
        bedroom: numericBedroom,
        bathroom: numericBathroom,
        type: body.type || 'rent',
        property: body.property || 'apartment',
        user: userConnection,
        postDetail: postDetailCreate
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
    res.status(201).json(responsePost);
    
  } catch (err) {
    console.error('❌ Database error creating post:', err);
    res.status(500).json({ message: "Failed to create post in database", error: err.message });
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
            id: true,
            username: true,
            email: true,
            avatar: true,
            createdAt: true
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Transform to include ownerInfo
    const transformedPost = {
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
        location: `${post.city}`,
        userType: 'standard'
      }
    };

    res.status(200).json(transformedPost);
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
    // First check if post exists and belongs to this user
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { userId: true }
    });
    
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (existingPost.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }
    
    // Handle post details update if provided
    if (body.postDetail) {
      const postDetail = body.postDetail;
      delete body.postDetail; // Remove from main body to avoid Prisma issues
      
      // Update post details separately
      await prisma.postDetail.upsert({
        where: { postId: id },
        update: {
          desc: postDetail.desc,
          utilities: postDetail.utilities,
          pet: postDetail.pet,
          income: postDetail.income,
          size: postDetail.size ? parseInt(postDetail.size) : null,
          school: postDetail.school ? parseInt(postDetail.school) : null,
          bus: postDetail.bus ? parseInt(postDetail.bus) : null,
          restaurant: postDetail.restaurant ? parseInt(postDetail.restaurant) : null,
        },
        create: {
          postId: id,
          desc: postDetail.desc || '',
          utilities: postDetail.utilities || '',
          pet: postDetail.pet || '',
          income: postDetail.income || '',
          size: postDetail.size ? parseInt(postDetail.size) : null,
          school: postDetail.school ? parseInt(postDetail.school) : null,
          bus: postDetail.bus ? parseInt(postDetail.bus) : null,
          restaurant: postDetail.restaurant ? parseInt(postDetail.restaurant) : null,
        }
      });
    }

    // Update main post
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: body.title,
        price: body.price ? parseInt(body.price) : undefined,
        images: body.images,
        address: body.address,
        city: body.city,
        bedroom: body.bedroom ? parseInt(body.bedroom) : undefined,
        bathroom: body.bathroom ? parseFloat(body.bathroom) : undefined,
        latitude: body.latitude,
        longitude: body.longitude,
        type: body.type,
        property: body.property,
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

    // Transform to include ownerInfo
    const transformedPost = {
      ...updatedPost,
      ownerInfo: {
        id: updatedPost.user.id,
        username: updatedPost.user.username,
        email: updatedPost.user.email,
        fullName: updatedPost.user.username,
        avatar: updatedPost.user.avatar,
        verified: false,
        showContactInfo: true,
        memberSince: updatedPost.user.createdAt,
        location: `${updatedPost.city}`,
        userType: 'standard'
      }
    };
    
    res.status(200).json(transformedPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    // First check if post exists and belongs to this user
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { userId: true }
    });
    
    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    if (existingPost.userId !== tokenUserId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    
    // Delete post (postDetail will be automatically deleted due to Cascade)
    await prisma.post.delete({
      where: { id }
    });
    
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
