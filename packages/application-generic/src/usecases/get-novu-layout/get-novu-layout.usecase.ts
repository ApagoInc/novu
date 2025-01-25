import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { GetNovuLayoutCommand } from './get-novu-layout.command';
import { ApiException } from '../../utils/exceptions';

@Injectable()
export class GetNovuLayout {
  async execute(command: GetNovuLayoutCommand): Promise<string> {
    const template = await this.loadTemplateContent(command.layoutName);
    if (!template) throw new ApiException('Novu template under name ' + command.layoutName + ' not found');

    return template;
  }

  private async loadTemplateContent(name: string) {
    const location = `${__dirname}/templates/emailtemplates/templates/${name}`
    const content = await readFile(location).catch((err => {
      console.log('error reading file at location', location, '-', err)
      return undefined;
    }))
    return content.toString();
  }
}
