import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ type: Number, default: 1 })
  id: number;

  @ApiProperty({ type: Boolean, default: true })
  isCreated: boolean;
}
