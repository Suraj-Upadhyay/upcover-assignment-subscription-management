import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: true })
  stripeSubscriptionId: string;

  @Prop({
    required: true,
    enum: ['active', 'canceled', 'incomplete', 'past_due'],
  })
  status: string;

  @Prop()
  currentPeriodEnd: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
