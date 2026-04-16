import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
  RawBodyRequest,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from './subscriptions.service';

@Controller('webhooks')
export class SubscriptionsWebhookController {
  private readonly logger = new Logger(SubscriptionsWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly subService: SubscriptionsService,
  ) {}

  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') sig: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!sig) throw new BadRequestException('Missing stripe-signature');

    const event = this.stripeService.verifyWebhook(req.rawBody, sig);

    this.logger.log(`Received Webhook Event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      await this.subService.handleSuccessfulPayment(session);
    }

    return { received: true };
  }
}
