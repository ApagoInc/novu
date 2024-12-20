import { Injectable, NotFoundException } from '@nestjs/common';
import { LayoutEntity, LayoutRepository } from '@novu/dal';
import { ITemplateVariable } from '@novu/shared';

import { FindLayoutsCommand } from './find-layouts.command';
import { LayoutDto } from '../get-layout/layout.dto';

@Injectable()
export class FindLayoutsUseCase {
  constructor(private layoutRepository: LayoutRepository) {}

  async execute(command: FindLayoutsCommand): Promise<LayoutDto[]> {
    console.log('in FindLayoutsUseCase - about to run and find all layouts');
    const layouts = await this.layoutRepository.find({
      _environmentId: command.environmentId,
    });

    console.log(
      'Result of layouts find query for environment id',
      command.environmentId,
      '-',
      layouts.length,
      'layouts queried successfully'
    );

    if (!layouts) {
      throw new NotFoundException(
        `No layouts found for environment ${command.environmentId}`
      );
    }

    return layouts.map((layout) => this.mapFromEntity(layout));
  }

  private mapFromEntity(layout: LayoutEntity): LayoutDto {
    return {
      ...layout,
      _id: layout._id,
      _organizationId: layout._organizationId,
      _environmentId: layout._environmentId,
      variables: this.mapVariablesFromEntity(layout.variables),
      isDeleted: layout.deleted,
    };
  }

  private mapVariablesFromEntity(
    variables?: ITemplateVariable[]
  ): ITemplateVariable[] {
    if (!variables || variables.length === 0) {
      return [];
    }

    return variables.map((variable) => {
      const { name, type, defaultValue, required } = variable;

      return {
        name,
        type,
        defaultValue,
        required,
      };
    });
  }
}
