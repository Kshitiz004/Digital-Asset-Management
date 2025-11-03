import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for updating asset metadata
 */
export class UpdateAssetDto {
  @ApiProperty({
    example: 'vacation,summer,2024',
    description: 'Comma-separated tags',
    required: false,
  })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiProperty({
    example: 'My summer vacation photos',
    description: 'Asset description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

