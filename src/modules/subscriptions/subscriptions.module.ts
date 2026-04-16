import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { UsersModule } from '../users/users.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PlansController } from './plans.controller';
import { SubscriptionsWebhookController } from './subscriptions.webhook.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    UsersModule,
  ],
  providers: [SubscriptionsService],
  controllers: [
    SubscriptionsController,
    PlansController,
    SubscriptionsWebhookController,
  ],
})
export class SubscriptionsModule {}
