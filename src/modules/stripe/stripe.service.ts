import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StripeNode from 'stripe';

@Injectable()
export class StripeService {
  private stripe: StripeNode.Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private configService: ConfigService) {
    const STRIPE_SECRET_KEY =
      this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!STRIPE_SECRET_KEY) {
      throw new InternalServerErrorException(
        `Server couldn't configure stripe`,
      );
    }

    this.stripe = new StripeNode(STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia' as any,
    });
  }

  async createCustomer(email: string, name?: string) {
    try {
      this.logger.log(`Creating Stripe customer for email: ${email}`);
      return await this.stripe.customers.create({
        email,
        name,
        metadata: { source: 'nestjs-api' },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Stripe Customer Creation Error: ${error instanceof Error && error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to initialize payment profile',
      );
    }
  }

  get stripeInstance() {
    return this.stripe;
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    userId: string,
  ) {
    const baseUrl = this.configService.get('FRONTEND_URL');
    const successUrl = `${baseUrl}/api/v1/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/api/v1/subscriptions/cancel`;

    return await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });
  }

  verifyWebhook(rawBody: Buffer, signature: string) {
    try {
      return this.stripeInstance.webhooks.constructEvent(
        rawBody,
        signature,
        this.configService.get<string>('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      this.logger.error(
        `Webhook Signature Verification Failed: ${err.message}`,
      );
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}
