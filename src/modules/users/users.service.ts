import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { SignupDto } from '../auth/dto/signup.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(
    signupDto: SignupDto,
    stripeCustomerId: string,
  ): Promise<UserDocument> {
    this.logger.log(`Creating new user in DB for email: ${signupDto.email}`);
    const newUser = new this.userModel({
      ...signupDto,
      stripeCustomerId,
    });
    return newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}
