import { IsString } from 'class-validator';

export class SubmitAgendaDto {
  @IsString()
  agendaUrl: string;
}
