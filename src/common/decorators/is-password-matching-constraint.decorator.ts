import { RegisterDto } from '@/auth/dto/register.dto';
import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsPasswordMatching', async: false })
export class IsPasswordMatchingConstraint
  implements ValidatorConstraintInterface
{
  public validate(
    passwordConfirm: string,
    args: ValidationArguments,
  ): Promise<boolean> | boolean {
    const object = args.object as RegisterDto;
    return !!object.password && object.password === passwordConfirm;
  }

  public defaultMessage(_?: ValidationArguments): string {
    return 'Пароли не совпадают';
  }
}
