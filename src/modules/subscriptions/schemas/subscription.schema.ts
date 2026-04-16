import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: string;

  @Prop({ required: true })
  planId: string; // 'basic', 'standard', or 'premium'

  @Prop({ required: true })
  stripeSubscriptionId: string;

  @Prop({
    required: true,
    enum: ['active', 'past_due', 'canceled', 'incomplete'],
  })
  status: string;

  @Prop()
  currentPeriodEnd: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
