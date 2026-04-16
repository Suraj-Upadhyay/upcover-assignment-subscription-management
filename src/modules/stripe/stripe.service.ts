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
}
