import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { UsersService } from '../users/users.service';
import { SUBSCRIPTION_PLANS } from './plans.constants';
import { InjectModel } from '@nestjs/mongoose';
import {
  Subscription as MySubscription,
  SubscriptionDocument,
} from './schemas/subscription.schema';
import { Model } from 'mongoose';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(MySubscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private usersService: UsersService,
    private stripeService: StripeService,
  ) {}

  async startSubscription(userId: string, planId: string) {
    const existingSub = await this.subscriptionModel.findOne({
      userId,
      status: 'active',
    });

    if (existingSub) {
      throw new BadRequestException(
        'You already have an active subscription. Please manage it via your billing portal.',
      );
    }

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

  async handleSuccessfulPayment(session: any) {
    const userId = session.metadata.userId;
    const stripeSubscriptionId = session.subscription;

    this.logger.log(`Processing successful payment for user: ${userId}`);

    const subscription: any =
      await this.stripeService.stripeInstance.subscriptions.retrieve(
        stripeSubscriptionId,
      );

    const priceId = subscription.items.data[0].price.id;
    const plan = SUBSCRIPTION_PLANS.find((p) => p.priceId === priceId);

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.subscriptionModel.findOneAndUpdate(
      { userId },
      {
        planId: plan?.id || 'basic',
        stripeSubscriptionId,
        status: subscription.status || 'active',
        currentPeriodEnd: periodEnd,
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    this.logger.log(`✅ Subscription activated for User: ${userId}`);
  }
}
