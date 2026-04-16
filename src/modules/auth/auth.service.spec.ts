import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { StripeService } from '../stripe/stripe.service';
import { ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let stripeService: any;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockStripeService = {
    createCustomer: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    stripeService = module.get<StripeService>(StripeService);
  });

  describe('signup', () => {
    it('should throw ConflictException if email already exists', async () => {
      // Arrange: mock existing user
      mockUsersService.findByEmail.mockResolvedValue({
        email: 'test@test.com',
      });

      // Act & Assert (Removed 'name' property to match your SignupDto)
      await expect(
        service.signup({ email: 'test@test.com', password: '123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a Stripe customer and a new user on signup', async () => {
      // Arrange
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockStripeService.createCustomer.mockResolvedValue({
        id: 'cus_stripe_123',
      });
      mockUsersService.create.mockResolvedValue({
        id: 'mongo_123',
        email: 'new@test.com',
      });

      // Act (Removed 'name' property to match your SignupDto)
      const result = await service.signup({
        email: 'new@test.com',
        password: '123',
      });

      // Assert
      expect(stripeService.createCustomer).toHaveBeenCalledWith('new@test.com');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.any(Object),
        'cus_stripe_123',
      );
      expect(result).toHaveProperty('access_token');
    });
  });
});
