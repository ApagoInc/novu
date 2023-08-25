import { IsOptional } from 'class-validator';
import { PaginationRequestDto } from '../../shared/dtos/pagination-request';

export class WorkflowsRequestDto extends PaginationRequestDto(10, 100) {
  @IsOptional()
  query?: string;
}
