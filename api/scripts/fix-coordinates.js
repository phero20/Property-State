// Create this script to fix your data
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixCoordinates() {
  try {
    // Get direct access to MongoDB
    const db = prisma._getClient();
    const postsCollection = db.db().collection('Post');
    
    // Find all posts with string coordinates
    const postsToFix = await postsCollection.find({
      $or: [
        { latitude: { $type: 'string' } },
        { longitude: { $type: 'string' } }
      ]
    }).toArray();
    
    console.log(`Found ${postsToFix.length} posts with string coordinates to fix`);
    
    // Update each post
    for (const post of postsToFix) {
      const updates = {};
      
      if (typeof post.latitude === 'string') {
        updates.latitude = parseFloat(post.latitude);
      }
      
      if (typeof post.longitude === 'string') {
        updates.longitude = parseFloat(post.longitude);
      }
      
      // Only update if we have changes
      if (Object.keys(updates).length > 0) {
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: updates }
        );
        console.log(`Updated post ${post._id}: converted coordinates to numbers`);
      }
    }
    
    console.log('✅ All coordinates fixed successfully');
  } catch (error) {
    console.error('❌ Error fixing coordinates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCoordinates();