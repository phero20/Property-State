import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Try to connect and count users
    const userCount = await prisma.user.count();
    console.log('✅ MongoDB connection successful!');
    console.log(`📊 Current user count: ${userCount}`);
    
    // Test creating a simple user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword123'
      }
    });
    console.log('✅ Test user created:', testUser.username);
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();