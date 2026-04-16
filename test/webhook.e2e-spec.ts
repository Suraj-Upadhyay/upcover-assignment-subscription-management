import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { StripeService } from '../src/modules/stripe/stripe.service';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

describe('Webhooks (e2e)', () => {
  let app: INestApplication;

  const mockStripeService = {
    verifyWebhook: jest.fn((rawBody) => {
      return JSON.parse(rawBody.toString());
    }),
    stripeInstance: {
      subscriptions: {
        retrieve: jest.fn().mockResolvedValue({
          items: {
            data: [{ price: { id: 'price_1TMkON8H4dOzEicpdKq9QjNn' } }],
          },
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 10000,
        }),
      },
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StripeService)
      .useValue(mockStripeService)
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('should process checkout.session.completed and update DB', async () => {
    const mockPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: '69e09a700f97abb2214a05a5' },
          subscription: 'sub_test_123',
        },
      },
    };

    return request(app.getHttpServer())
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', 'mock-sig')
      .send(mockPayload)
      .expect(201);
  });

  afterAll(async () => {
    if (app) {
      const connection: Connection = app.get(getConnectionToken());
      await connection.close();
      await app.close();
    }
  });
});
