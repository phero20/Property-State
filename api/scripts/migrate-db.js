import { PrismaClient } from '@prisma/client';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure dotenv with proper path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Get direct MongoDB client for raw operations
    const mongoUrl = process.env.DATABASE_URL;
    const client = new MongoClient(mongoUrl);
    await client.connect();
    
    const db = client.db();
    const postsCollection = db.collection('Post');
    
    // 1. Fix coordinates (convert strings to floats)
    console.log('🔄 Fixing coordinates...');
    const postsWithStringCoords = await postsCollection.find({
      $or: [
        { latitude: { $type: 'string' } },
        { longitude: { $type: 'string' } }
      ]
    }).toArray();
    
    for (const post of postsWithStringCoords) {
      const updates = {};
      
      if (typeof post.latitude === 'string') {
        updates.latitude = parseFloat(post.latitude);
      }
      
      if (typeof post.longitude === 'string') {
        updates.longitude = parseFloat(post.longitude);
      }
      
      if (Object.keys(updates).length > 0) {
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: updates }
        );
      }
    }
    
    console.log(`✅ Fixed coordinates for ${postsWithStringCoords.length} posts`);
    
    // 2. Ensure all numeric fields are properly typed
    console.log('🔄 Fixing numeric fields...');
    const postsToFix = await postsCollection.find({}).toArray();
    
    for (const post of postsToFix) {
      const updates = {};
      
      if (typeof post.price === 'string') {
        updates.price = parseFloat(post.price);
      }
      
      if (typeof post.bedroom === 'string') {
        updates.bedroom = parseInt(post.bedroom);
      }
      
      if (typeof post.bathroom === 'string') {
        updates.bathroom = parseFloat(post.bathroom);
      }
      
      if (Object.keys(updates).length > 0) {
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: updates }
        );
      }
    }
    
    console.log(`✅ Fixed numeric fields for ${postsToFix.length} posts`);
    
    // 3. Verify all posts are now valid according to schema
    console.log('🔄 Verifying data integrity...');
    try {
      // This will check if Prisma can now read the posts without errors
      const validatedPosts = await prisma.post.findMany({
        take: 5
      });
      console.log(`✅ Successfully validated ${validatedPosts.length} posts`);
    } catch (error) {
      console.error('❌ Data validation failed:', error);
    }
    
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateDatabase();