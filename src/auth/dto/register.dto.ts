import { VALIDATION } from '@/common/constants/validation';
import { IsPasswordMatchingConstraint } from '@/common/decorators/is-password-matching-constraint.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: VALIDATION.EMAIL.VALIDATION_MESSAGE })
  @IsNotEmpty({ message: VALIDATION.EMAIL.NULLABLE_MESSAGE })
  @ApiProperty({ type: String, required: true, default: '8eDfA@example.com' })
  email: string;

  @IsString({ message: VALIDATION.PASSWORD.STRING_MESSAGE })
  @IsNotEmpty({ message: VALIDATION.PASSWORD.NULLABLE_MESSAGE })
  @MinLength(VALIDATION.PASSWORD.LENGTH.MIN, {
    message: VALIDATION.PASSWORD.MIN_LENGTH_MESSAGE,
  })
  @MaxLength(VALIDATION.PASSWORD.LENGTH.MAX, {
    message: VALIDATION.PASSWORD.MAX_LENGTH_MESSAGE,
  })
  @Matches(new RegExp(VALIDATION.PASSWORD.REGEXP), {
    message: VALIDATION.PASSWORD.VALIDATION_MESSAGE,
  })
  @ApiProperty({ type: String, required: true, default: 'SecretPassword123$' })
  password: string;

  @IsString({ message: VALIDATION.CONFIRM_PASSWORD.STRING_MESSAGE })
  @IsNotEmpty({ message: VALIDATION.CONFIRM_PASSWORD.NULLABLE_MESSAGE })
  @Validate(IsPasswordMatchingConstraint, {
    message: VALIDATION.CONFIRM_PASSWORD.VALIDATION_MESSAGE,
  })
  @ApiProperty({ type: String, required: true, default: 'SecretPassword123$' })
  confirmPassword: string;

  @IsOptional()
  @MinLength(VALIDATION.NAME.LENGTH.MIN, {
    message: VALIDATION.NAME.MIN_LENGTH_MESSAGE,
  })
  @MaxLength(VALIDATION.NAME.LENGTH.MAX, {
    message: VALIDATION.NAME.MAX_LENGTH_MESSAGE,
  })
  @IsString({ message: VALIDATION.NAME.STRING_MESSAGE })
  @ApiPropertyOptional({ type: String, required: false, default: 'John Doe' })
  name?: string;
}
