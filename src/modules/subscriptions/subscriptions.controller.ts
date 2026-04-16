import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SUBSCRIPTION_PLANS } from './plans.constants';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List hardcoded plans' })
  getPlans() {
    return SUBSCRIPTION_PLANS;
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Checkout Session' })
  async createCheckout(@Body() dto: CreateSubscriptionDto, @Req() req: any) {
    return this.subService.startSubscription(req.user.id, dto.planId);
  }

  @Get('success')
  async success() {
    return '<h1>Success!</h1><p>Your subscription is active. You can close this window.</p>';
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMySubscription(@Req() req: any) {
    return this.subService.getSubscription(req.user.id);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel active subscription' })
  async cancel(@Req() req: any) {
    return this.subService.cancelSubscription(req.user.id);
  }
}
