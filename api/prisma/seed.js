import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      username: 'john_doe',
      password: '$2b$10$hashedpassword', // In real app, hash this
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      username: 'jane_smith',
      password: '$2b$10$hashedpassword', // In real app, hash this
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face'
    }
  });

  // Create test posts
  const post1 = await prisma.post.create({
    data: {
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
      userId: user1.id,
      postDetail: {
        create: {
          desc: 'Beautiful apartment with modern amenities in the heart of downtown.',
          utilities: 'Included',
          pet: 'Allowed',
          income: '3x rent',
          size: 1200,
          school: 5,
          bus: 2,
          restaurant: 1
        }
      }
    }
  });

  const post2 = await prisma.post.create({
    data: {
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
      userId: user2.id,
      postDetail: {
        create: {
          desc: 'Spacious family home with a large backyard and modern kitchen.',
          utilities: 'Not included',
          pet: 'Not allowed',
          income: 'Good credit required',
          size: 2800,
          school: 3,
          bus: 10,
          restaurant: 5
        }
      }
    }
  });

  console.log('Database seeded successfully');
  console.log({ user1, user2, post1, post2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });