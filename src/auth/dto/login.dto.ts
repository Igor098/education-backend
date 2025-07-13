import { VALIDATION } from '@/common/constants/validation';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: VALIDATION.LOGIN.ERROR_MESSAGE })
  email: string;

  @IsString({ message: VALIDATION.PASSWORD.STRING_MESSAGE })
  @IsNotEmpty({ message: VALIDATION.PASSWORD.NULLABLE_MESSAGE })
  @Matches(new RegExp(VALIDATION.PASSWORD.REGEXP), {
    message: VALIDATION.LOGIN.ERROR_MESSAGE,
  })
  password: string;
}
