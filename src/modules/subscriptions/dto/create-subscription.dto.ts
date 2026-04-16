import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PlanType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

export class CreateSubscriptionDto {
  @ApiProperty({ enum: PlanType, example: PlanType.STANDARD })
  @IsEnum(PlanType)
  @IsNotEmpty()
  planId: PlanType;
}
