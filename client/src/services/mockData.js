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
    id: 'mock-post-1',
    title: 'Modern Downtown Apartment',
    type: 'rent',
    property: 'apartment',
    price: 1800,
    address: '123 Main St',
    city: 'New York',
    bedroom: 2,
    bathroom: 1,
    currency: 'USD',
    images: ['https://via.placeholder.com/600x400?text=Apartment1'],
    createdAt: new Date().toISOString(),
    postedBy: {
      id: 'mock-user-1',
      username: 'johndoe'
    }
  },
  {
    id: 'mock-post-2',
    title: 'Spacious Family Home',
    type: 'sale',
    property: 'house',
    price: 450000,
    address: '456 Oak Ave',
    city: 'Chicago',
    bedroom: 4,
    bathroom: 2,
    currency: 'USD',
    images: ['https://via.placeholder.com/600x400?text=House1'],
    createdAt: new Date().toISOString(),
    postedBy: {
      id: 'mock-user-2',
      username: 'janesmith'
    }
  },
  {
    id: 'mock-post-3',
    title: 'Cozy Studio Near Campus',
    price: 950,
    address: '789 College Blvd',
    city: 'Boston',
    bedroom: 1,
    bathroom: 1,
    type: 'rent',
    property: 'studio',
    currency: 'USD',
    images: ['https://via.placeholder.com/600x400?text=Studio1'],
    createdAt: new Date().toISOString(),
    postedBy: {
      id: 'mock-user-3',
      username: 'student'
    }
  }
];