import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestData() { 
  try {
    console.log('🔌 Testing database connection...');
    
    // Check connection
    const userCount = await prisma.user.count();
    console.log('✅ MongoDB connection successful!');
    console.log(`📊 Current user count: ${userCount}`);

    // Create test users
    console.log('🌱 Creating test users...');
    const user1 = await prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        username: 'johndoe',
        email: 'john@example.com',
        password: '$2a$10$6LMBq5qx2Oll0vB6MK.VxeqXrNQiU7iOsH2rf3Wu1rxdhXTTyw88S', // "password123"
        fullName: 'John Doe'
      }
    });
    
    const user2 = await prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        username: 'janesmith',
        email: 'jane@example.com',
        password: '$2a$10$6LMBq5qx2Oll0vB6MK.VxeqXrNQiU7iOsH2rf3Wu1rxdhXTTyw88S', // "password123"
        fullName: 'Jane Smith'
      }
    });
    
    console.log('✅ Test users created successfully');
    
    // Create test posts
    console.log('🌱 Creating test property listings...');
    
    const post1 = await prisma.post.create({
      data: {
        title: 'Modern Apartment in Downtown',
        type: 'rent',
        property: 'apartment',
        price: 1800,
        address: '123 Main St, Apt 45',
        bedroom: 2,
        bathroom: 2,
        city: 'New York',
        images: [
          'https://via.placeholder.com/800x600?text=Modern+Apartment+1',
          'https://via.placeholder.com/800x600?text=Modern+Apartment+2'
        ],
        user: {
          connect: { id: user1.id }
        },
        detail: {
          create: {
            desc: 'Beautiful modern apartment with city views and updated appliances.',
            utilities: 'Water and garbage included',
            pet: 'Small pets allowed with deposit',
            income: '3x rent required',
            size: 850,
            school: 2,
            bus: 1,
            restaurant: 3
          }
        }
      }
    });
    
    const post2 = await prisma.post.create({
      data: {
        title: 'Family Home with Garden',
        type: 'buy',
        property: 'house',
        price: 425000,
        address: '456 Oak Avenue',
        bedroom: 4,
        bathroom: 3,
        city: 'Chicago',
        images: [
          'https://via.placeholder.com/800x600?text=Family+Home+1',
          'https://via.placeholder.com/800x600?text=Family+Home+2',
          'https://via.placeholder.com/800x600?text=Family+Home+3'
        ],
        user: {
          connect: { id: user2.id }
        },
        detail: {
          create: {
            desc: 'Spacious family home with a beautiful garden and updated kitchen.',
            size: 2200,
            school: 1,
            bus: 3,
            restaurant: 5
          }
        }
      }
    });
    
    const post3 = await prisma.post.create({
      data: {
        title: 'Studio Apartment Near Campus',
        type: 'rent',
        property: 'studio',
        price: 950,
        address: '789 College Blvd',
        bedroom: 1,
        bathroom: 1,
        city: 'Boston',
        images: [
          'https://via.placeholder.com/800x600?text=Studio+1'
        ],
        user: {
          connect: { id: user1.id }
        },
        detail: {
          create: {
            desc: 'Cozy studio apartment perfect for students, walking distance to campus.',
            utilities: 'All utilities included',
            pet: 'No pets allowed',
            income: '2.5x rent required',
            size: 450,
            school: 1,
            bus: 1,
            restaurant: 4
          }
        }
      }
    });
    
    // Create saved posts relationship
    await prisma.savedPost.create({
      data: {
        user: { connect: { id: user1.id } },
        post: { connect: { id: post2.id } }
      }
    });
    
    await prisma.savedPost.create({
      data: {
        user: { connect: { id: user2.id } },
        post: { connect: { id: post1.id } }
      }
    });
    
    // Create a chat between users
    const chat = await prisma.chat.create({
      data: {
        participants: {
          connect: [
            { id: user1.id },
            { id: user2.id }
          ]
        }
      }
    });
    
    // Add some messages to the chat
    await prisma.message.createMany({
      data: [
        {
          text: "Hi! I'm interested in your apartment listing.",
          senderId: user2.id,
          chatId: chat.id
        },
        {
          text: "Great! Would you like to schedule a viewing?",
          senderId: user1.id,
          chatId: chat.id
        },
        {
          text: "Yes, I would. Is it available this weekend?",
          senderId: user2.id,
          chatId: chat.id
        }
      ]
    });
    
    console.log('✅ Test data created successfully');
    console.log({
      users: { user1, user2 },
      posts: { post1, post2, post3 },
      chat
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();