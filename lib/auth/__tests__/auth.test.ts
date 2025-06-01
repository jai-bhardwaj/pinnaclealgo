import { authOptions } from '@/lib/auth'; // Corrected import path
// Removed direct bcrypt import, will mock the module
// import bcrypt from 'bcryptjs';
// Removed direct prisma import, will mock the module
// import { prisma } from '@/lib/prisma';

// Mock the entire @prisma/client module
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findFirst: jest.fn(), // Mock findFirst method
    },
    // Mock other Prisma models/methods as needed
  })),
  // Mock other Prisma exports if necessary (e.g., Prisma Client exceptions)
}));

// Mock the entire bcryptjs module
jest.mock('bcryptjs', () => ({
  // Provide a custom mock implementation for the compare function
  compare: jest.fn((password, hash) => {
    // Simple mock comparison: return true if password matches a predefined value for the hash
    // In real tests, you might want a more sophisticated mock based on test case needs
    if (hash === 'hashedpassword123' && password === 'password123') {
      return Promise.resolve(true);
    } else if (hash === 'hashedpassword123' && password === 'wrongpassword') {
      return Promise.resolve(false);
    }
    // Default to false for other cases
    return Promise.resolve(false);
  }),
  // Mock other bcrypt functions if used (e.g., hash)
}));

// Get the mocked prisma client instance
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get the mocked bcrypt compare function
const { compare: mockedBcryptCompare } = require('bcryptjs');

// Cast the mocked prisma.user.findFirst to a Jest mock function
const mockedUserFindFirst = prisma.user.findFirst as jest.Mock;

describe('Credentials Provider Authorize Function', () => {

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserFindFirst.mockReset();
    mockedBcryptCompare.mockReset();
  });

  // Assuming Credentials provider is the first provider in authOptions
  const credentialsProvider = authOptions.providers.find(provider => provider.id === 'credentials');

  if (!credentialsProvider) {
    throw new Error('Credentials provider not found in authOptions');
  }

  const authorize = (credentialsProvider as any).authorize; // Cast to any to access authorize

  // Mock user data for successful cases
  const mockUser = {
    id: 'user-id-123',
    username: 'testuser',
    email: 'test@example.com',
    isActive: true,
    hashedPassword: 'hashedpassword123',
  };

  it('should return a user object for valid credentials', async () => {
    // Mock prisma.user.findFirst to return the mock user
    mockedUserFindFirst.mockResolvedValue(mockUser);

    // Mock bcrypt.compare to return true
    mockedBcryptCompare.mockResolvedValue(true);

    const credentials = {
      username: 'testuser',
      password: 'password123',
    };

    const user = await authorize(credentials, {} as any);

    // Expectations
    expect(mockedUserFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { username: credentials.username },
          { email: credentials.username },
        ],
      },
      select: expect.objectContaining({
        id: true,
        username: true,
        email: true,
        isActive: true,
        hashedPassword: true,
      }),
    });
    expect(mockedBcryptCompare).toHaveBeenCalledWith(credentials.password, mockUser.hashedPassword);
    expect(user).toEqual({
      id: mockUser.id,
      username: mockUser.username,
      email: mockUser.email,
      isActive: mockUser.isActive,
    });
  });

  it('should return null for user not found', async () => {
    // Mock prisma.user.findFirst to return null
    mockedUserFindFirst.mockResolvedValue(null);

    const credentials = {
      username: 'nonexistentuser',
      password: 'password123',
    };

    const user = await authorize(credentials, {} as any);

    expect(mockedUserFindFirst).toHaveBeenCalled();
    expect(mockedBcryptCompare).not.toHaveBeenCalled();
    expect(user).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Mock prisma.user.findFirst to return the mock user
    mockedUserFindFirst.mockResolvedValue(mockUser);

    // Mock bcrypt.compare to return false
    mockedBcryptCompare.mockResolvedValue(false);

    const credentials = {
      username: 'testuser',
      password: 'wrongpassword',
    };

    const user = await authorize(credentials, {} as any);

    expect(mockedUserFindFirst).toHaveBeenCalled();
    expect(mockedBcryptCompare).toHaveBeenCalled();
    expect(user).toBeNull();
  });

  it('should return null for missing credentials', async () => {
    const credentials = {};

    const user = await authorize(credentials, {} as any);

    expect(mockedUserFindFirst).not.toHaveBeenCalled();
    expect(mockedBcryptCompare).not.toHaveBeenCalled();
    expect(user).toBeNull();
  });

  it('should return null if an error occurs during authorization', async () => {
    // Mock prisma.user.findFirst to throw an error
    mockedUserFindFirst.mockRejectedValue(new Error('Database error'));

    const credentials = {
      username: 'testuser',
      password: 'password123',
    };

    const user = await authorize(credentials, {} as any);

    expect(mockedUserFindFirst).toHaveBeenCalled();
    expect(mockedBcryptCompare).not.toHaveBeenCalled();
    expect(user).toBeNull();
  });
}); 