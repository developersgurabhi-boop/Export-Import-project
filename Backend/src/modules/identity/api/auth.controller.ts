import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Authenticated, Public } from '../../../platform/authorization/decorators';
import { CurrentAuth } from '../../../platform/authorization/current-auth.decorator';
import type { AuthContext } from '../../../platform/authorization/auth-context';
import { ZodValidationPipe } from '../../../platform/validation/zod-validation.pipe';
import { AuthService } from '../application/auth.service';
import { loginSchema, type LoginInput } from '../dto/identity.schemas';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
    return this.auth.login(body);
  }

  @Get('me')
  @Authenticated()
  me(@CurrentAuth() auth: AuthContext) {
    return this.auth.me(auth);
  }
}
