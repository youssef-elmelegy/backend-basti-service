import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

class ContentDto {
  @ApiProperty()
  validTo!: Date;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  systemIdentity!: string;

  @ApiProperty()
  creds!: number;

  @ApiProperty()
  tag!: number;

  @ApiProperty()
  value!: string;
}

export class MasaratSigninResponse {
  /**
		@description
			1=Success, 
			2=Failed, 
			3=Unknown
	*/
  @ApiProperty({ description: 'Response type: 1=Success, 2=Failed, 3=Unknown' })
  type!: number;

  @ApiProperty()
  messages!: string[];

  @ApiProperty()
  traceId!: string;

  @ApiProperty()
  content!: ContentDto;
}

export class MasaratOpenSessionResponse {
  /**
		@description
			1=Success, 
			2=Failed, 
			3=Unknown
	*/
  @ApiProperty({ description: 'Response type: 1=Success, 2=Failed, 3=Unknown' })
  type!: number;

  @ApiProperty()
  messages!: string[];

  @ApiProperty()
  traceId!: string;

  @ApiProperty()
  content!: ContentDto;
}

export class MasaratCompleteSessionResponse {
  /**
		@description
			1=Success, 
			2=Failed, 
			3=Unknown
	*/
  @ApiProperty({ description: 'Response type: 1=Success, 2=Failed, 3=Unknown' })
  type!: number;

  @ApiProperty()
  messages!: string[];

  @ApiProperty()
  traceId!: string;

  @ApiProperty()
  content!: string;
}

export class MasaratOpenSessionDto {
  @ApiProperty({
    description: `
		Customer Card ID: All banks must enter 9 digits (card number + prefix),
		In the case of the Trade and Development Bank, 10 digits (card number only) must be entered
	`,
  })
  @IsString()
  @Length(9, 10)
  cardNumber!: string;
}

export class MasaratCompleteSessionDto {
  @ApiProperty({ description: 'Payment OTP' })
  @IsString()
  otp!: string;
}
