import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Subscription } from './schemas/subscription.schema';
import { UsersService } from '../users/users.service';
import { StripeService } from '../stripe/stripe.service';
import { BadRequestException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let model: any;
  let stripeService: any;

  const mockSubscriptionModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockStripeService = {
    createCheckoutSession: jest.fn(),
    stripeInstance: {
      subscriptions: {
        retrieve: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getModelToken(Subscription.name),
          useValue: mockSubscriptionModel,
        },
        { provide: UsersService, useValue: mockUsersService },
        { provide: StripeService, useValue: mockStripeService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    model = module.get(getModelToken(Subscription.name));
    stripeService = module.get<StripeService>(StripeService);
  });

  describe('startSubscription', () => {
    it('should throw BadRequestException if user already has an active subscription', async () => {
      model.findOne.mockResolvedValue({ status: 'active' });

      await expect(
        service.startSubscription('user123', 'basic'),
      ).rejects.toThrow(BadRequestException);

      expect(model.findOne).toHaveBeenCalledWith({
        userId: 'user123',
        status: 'active',
      });
    });

    it('should create a checkout session if no active subscription exists', async () => {
      model.findOne.mockResolvedValue(null);
      mockUsersService.findById.mockResolvedValue({
        id: 'user123',
        stripeCustomerId: 'cus_123',
      });
      stripeService.createCheckoutSession.mockResolvedValue({
        url: 'http://stripe.com/checkout',
      });

      const result = await service.startSubscription('user123', 'basic');

      expect(result.url).toBe('http://stripe.com/checkout');
      expect(stripeService.createCheckoutSession).toHaveBeenCalled();
    });
  });

  describe('handleSuccessfulPayment', () => {
    it('should update the subscription status in the database', async () => {
      const mockSession = {
        metadata: { userId: 'user123' },
        subscription: 'sub_123',
      };
      const mockStripeSub = {
        items: { data: [{ price: { id: 'price_1TMkON8H4dOzEicpdKq9QjNn' } }] },
        status: 'active',
        current_period_end: 1713256000,
      };

      stripeService.stripeInstance.subscriptions.retrieve.mockResolvedValue(
        mockStripeSub,
      );

      await service.handleSuccessfulPayment(mockSession);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'user123' },
        expect.objectContaining({
          planId: 'basic',
          status: 'active',
        }),
        expect.any(Object),
      );
    });
  });
});
