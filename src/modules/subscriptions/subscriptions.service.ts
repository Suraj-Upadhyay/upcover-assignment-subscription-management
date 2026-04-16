import { BadRequestException, Injectable } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { SUBSCRIPTION_PLANS } from './plans.constants';

@Injectable()
export class SubscriptionsService {
  constructor(
    private usersService: UsersService,
    private stripeService: StripeService,
  ) {}

  async startSubscription(userId: string, planId: string) {
    const user = await this.usersService.findById(userId);
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);

    if (!plan) throw new BadRequestException('Invalid plan');

    const session = await this.stripeService.createCheckoutSession(
      user.stripeCustomerId,
      plan.priceId,
      userId,
    );

    return { url: session.url };
  }
}
