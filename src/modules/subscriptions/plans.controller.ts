import { Controller, Get } from '@nestjs/common';
import { SUBSCRIPTION_PLANS } from './plans.constants';

@Controller('plans')
export class PlansController {
  @Get()
  getPlans() {
    return SUBSCRIPTION_PLANS;
  }
}
