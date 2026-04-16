import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private stripeService: StripeService,
  ) {}

  async signup(signupDto: SignupDto) {
    this.logger.log(`Attempting signup for email: ${signupDto.email}`);

    const exists = await this.usersService.findByEmail(signupDto.email);
    if (exists) {
      this.logger.warn(`Signup failed: Email collision for ${signupDto.email}`);
      throw new ConflictException('Email already registered');
    }

    const stripeCustomer = await this.stripeService.createCustomer(
      signupDto.email,
    );

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const user = await this.usersService.create(
      {
        ...signupDto,
        password: hashedPassword,
      },
      stripeCustomer.id,
    );

    this.logger.log(`User successfully registered: ${signupDto.email}`);
    return this.generateToken(user);
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);

    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      this.logger.warn(`Login failed: User not found - ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);

    if (!isMatch) {
      this.logger.warn(
        `Login failed: Incorrect password for ${loginDto.email}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user);
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
