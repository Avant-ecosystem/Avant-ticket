import { PartialType } from '@nestjs/mapped-types';
import { CreateMercadoPagoDto } from './create-mercado-pago.dto';

export class UpdateMercadoPagoDto extends PartialType(CreateMercadoPagoDto) {}
