import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { StripeService } from '../src/modules/stripe/stripe.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

describe('Subscriptions (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  const mockStripeService = {
    createCheckoutSession: jest
      .fn()
      .mockResolvedValue({ url: 'http://stripe.com/test' }),
    createCustomer: jest.fn().mockResolvedValue({ id: 'cus_test' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StripeService)
      .useValue(mockStripeService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api/v1');
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        email: `test-${Date.now()}@example.com`,
        password: 'Password123',
      });

    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    if (app) {
      const connection: Connection = app.get(getConnectionToken());
      await connection.close();
      await app.close();
    }
  });

  describe('POST /api/v1/subscriptions/checkout', () => {
    it('should return 401 if no token is provided', () => {
      return request(app.getHttpServer())
        .post('/api/v1/subscriptions/checkout')
        .send({ planId: 'basic' })
        .expect(401);
    });

    it('should return 400 if planId is invalid (DTO Validation Test)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/subscriptions/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: 'super-premium-free' })
        .expect(400);
    });

    it('should return 201 and stripe URL for valid request', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planId: 'basic' })
        .expect(201);

      expect(response.body).toHaveProperty('url', 'http://stripe.com/test');
    });
  });
});
