import {
  Injectable,
  Logger,
  InternalServerErrorException,
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
    try {
      this.logger.log(`Creating Checkout Session for User: ${userId}`);
      return await this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${this.configService.get('FRONTEND_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.configService.get('FRONTEND_URL')}/cancel`,
        metadata: { userId },
      });
    } catch (error) {
      this.logger.error(`Checkout Session Error: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to create checkout session',
      );
    }
  }
}
