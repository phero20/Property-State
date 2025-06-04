// Mock data for when server is down (development only)
export const mockNotifications = 3;

export const mockUserStats = {
  postsCount: 5,
  savedCount: 8,
  viewsCount: 120,
  memberSince: '2023-01-15T00:00:00.000Z'
};

export const mockProfilePosts = [
  {
    id: 'mock-post-1',
    title: 'Modern Downtown Apartment',
    type: 'rent',
    property: 'apartment',
    price: 1800,
    address: '123 Main St',
    city: 'New York',
    images: ['https://via.placeholder.com/600x400?text=Apartment1'],
    createdAt: new Date().toISOString(),
    user: {
      id: 'mock-user-1',
      username: 'johndoe',
      fullName: 'John Doe',
      avatar: null
    }
  },
  {
    id: 'mock-post-2',
    title: 'Spacious Family Home',
    type: 'buy',
    property: 'house',
    price: 450000,
    address: '456 Oak Ave',
    city: 'Chicago',
    images: ['https://via.placeholder.com/600x400?text=House1'],
    createdAt: new Date().toISOString(),
    user: {
      id: 'mock-user-2',
      username: 'janesmith',
      fullName: 'Jane Smith',
      avatar: null
    }
  }
];

export const mockSavedPosts = [
  {
    id: 'mock-saved-1',
    title: 'Cozy Studio Near Campus',
    type: 'rent',
    property: 'studio',
    price: 950,
    address: '789 College Blvd',
    city: 'Boston',
    images: ['https://via.placeholder.com/600x400?text=Studio1'],
    createdAt: new Date().toISOString(),
    user: {
      id: 'mock-user-3',
      username: 'student',
      fullName: 'Student User',
      avatar: null
    }
  }
];

export const mockPosts = [
  {
    id: 'mock-listing-1',
    title: 'Beautiful Downtown Apartment',
    price: 2500,
    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=250&fit=crop'],
    address: '123 Main Street',
    city: 'New York',
    bedroom: 2,
    bathroom: 2,
    type: 'rent',
    property: 'apartment',
    createdAt: new Date().toISOString(),
    user: {
      id: 'mock-user-1',
      username: 'johndoe',
      fullName: 'John Doe',
      avatar: null
    },
    postDetail: {
      desc: 'This is sample data displayed when the API server is not running.',
      utilities: 'Included',
      pet: 'Allowed',
      income: '3x rent required',
      size: 1200
    }
  },
  {
    id: 'mock-listing-2',
    title: 'Modern Family Home For Sale',
    price: 450000,
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=250&fit=crop'],
    address: '456 Park Avenue',
    city: 'Los Angeles',
    bedroom: 4,
    bathroom: 3,
    type: 'buy',
    property: 'house',
    createdAt: new Date().toISOString(),
    user: {
      id: 'mock-user-2',
      username: 'janesmith',
      fullName: 'Jane Smith',
      avatar: null
    },
    postDetail: {
      desc: 'Spacious family home in a great neighborhood.',
      utilities: 'Not included',
      pet: 'Allowed',
      size: 2400
    }
  },
  {
    id: 'mock-listing-3',
    title: 'Studio Apartment Near Campus',
    price: 1100,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop'],
    address: '789 University Drive',
    city: 'Boston',
    bedroom: 0, // Studio
    bathroom: 1,
    type: 'rent',
    property: 'studio',
    createdAt: new Date().toISOString(),
    user: {
      id: 'mock-user-3',
      username: 'student',
      fullName: 'Student User',
      avatar: null
    },
    postDetail: {
      desc: 'Cozy studio apartment close to campus.',
      utilities: 'Water and internet included',
      pet: 'No pets',
      income: '2.5x rent required',
      size: 500
    }
  }
];