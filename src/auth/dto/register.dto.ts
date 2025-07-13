import { VALIDATION } from '@/common/constants/validation';
import { IsPasswordMatchingConstraint } from '@/common/decorators/is-password-matching-constraint.decorator';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: VALIDATION.EMAIL.VALIDATION_MESSAGE })
  @IsNotEmpty({ message: VALIDATION.EMAIL.NULLABLE_MESSAGE })
  email: string;

  @IsString({ message: VALIDATION.PASSWORD.STRING_MESSAGE })
  @IsNotEmpty({ message: VALIDATION.PASSWORD.NULLABLE_MESSAGE })
  @Min(VALIDATION.PASSWORD.LENGTH.MIN, {
    message: VALIDATION.PASSWORD.MIN_LENGTH_MESSAGE,
  })
  @Max(VALIDATION.PASSWORD.LENGTH.MAX, {
    message: VALIDATION.PASSWORD.MAX_LENGTH_MESSAGE,
  })
  @Matches(new RegExp(VALIDATION.PASSWORD.REGEXP), {
    message: VALIDATION.PASSWORD.VALIDATION_MESSAGE,
  })
  password: string;

  @IsString({ message: VALIDATION.CONFIRM_PASSWORD.STRING_MESSAGE })
  @IsNotEmpty({ message: VALIDATION.CONFIRM_PASSWORD.NULLABLE_MESSAGE })
  @Validate(IsPasswordMatchingConstraint, {
    message: VALIDATION.CONFIRM_PASSWORD.VALIDATION_MESSAGE,
  })
  confirmPassword: string;

  @IsOptional()
  @Min(VALIDATION.NAME.LENGTH.MIN, {
    message: VALIDATION.NAME.MIN_LENGTH_MESSAGE,
  })
  @Max(VALIDATION.NAME.LENGTH.MAX, {
    message: VALIDATION.NAME.MAX_LENGTH_MESSAGE,
  })
  @IsString({ message: VALIDATION.NAME.STRING_MESSAGE })
  name?: string;
}
