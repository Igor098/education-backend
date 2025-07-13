import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor() {
    super(
      'Слишком много попыток входа. Пожалуйста, попробуйте позже.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
