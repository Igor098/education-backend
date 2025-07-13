import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { mapUserToDto } from './mappers/user.mapper';
import { UserResponseDto } from './dto/user-response.dto';
import { MutationAuthorization } from './decorators/auth.decorator';

@Controller('auth')
@ApiTags('Authorization')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    type: RegisterDto,
  })
  @ApiResponse({
    type: RegisterResponseDto,
  })
  public async registerUser(
    @Body() dto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    const created = await this.authService.registerUser(dto);
    return {
      id: created,
      isCreated: true,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: LoginDto,
  })
  @ApiResponse({
    type: UserResponseDto,
  })
  public async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ): Promise<UserResponseDto> {
    const user = await this.authService.login(req, res, dto);
    return await mapUserToDto(user);
  }

  @MutationAuthorization()
  @ApiHeader({
    name: 'X-CSRF-Token',
    description:
      'CSRF токен, который нужно передать в каждом запросе с изменением данных',
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(req, res);
  }
}
