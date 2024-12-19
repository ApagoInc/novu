import { Injectable } from '@nestjs/common';
import { EnvironmentRepository } from '@novu/dal';
import { nanoid } from 'nanoid';

import { CreateEnvironmentCommand } from './create-environment.command';

import { GenerateUniqueApiKey } from '../generate-unique-api-key/generate-unique-api-key.usecase';
// eslint-disable-next-line max-len
import { CreateNotificationGroupCommand } from '../../../notification-groups/usecases/create-notification-group/create-notification-group.command';
import { CreateNotificationGroup } from '../../../notification-groups/usecases/create-notification-group/create-notification-group.usecase';
import { CreateDefaultLayout, CreateDefaultLayoutCommand } from '../../../layouts/usecases/create-default-layout';
import { CreateLayoutCommand, CreateLayoutUseCase } from '../../../layouts/usecases/create-layout';
import { GetNovuLayout, GetNovuLayoutCommand } from '@novu/application-generic';
import { readdirSync } from 'fs';

@Injectable()
export class CreateEnvironment {
  constructor(
    private environmentRepository: EnvironmentRepository,
    private createNotificationGroup: CreateNotificationGroup,
    private generateUniqueApiKey: GenerateUniqueApiKey,
    private createDefaultLayoutUsecase: CreateDefaultLayout,
    private createLayoutUsecase: CreateLayoutUseCase,
    private getNovuLayout: GetNovuLayout
  ) { }

  async execute(command: CreateEnvironmentCommand) {
    const key = await this.generateUniqueApiKey.execute();

    const environment = await this.environmentRepository.create({
      _organizationId: command.organizationId,
      name: command.name,
      identifier: nanoid(12),
      _parentId: command.parentEnvironmentId,
      apiKeys: [
        {
          key,
          _userId: command.userId,
        },
      ],
    });

    if (!command.parentEnvironmentId) {
      await this.createNotificationGroup.execute(
        CreateNotificationGroupCommand.create({
          organizationId: command.organizationId,
          environmentId: environment._id,
          userId: command.userId,
          name: 'General',
        })
      );

      await this.createDefaultLayoutUsecase.execute(
        CreateDefaultLayoutCommand.create({
          organizationId: command.organizationId,
          environmentId: environment._id,
          userId: command.userId,
        })
      );


      const otherLayoutFiles = (() => {
        const filesDir = `${__dirname}/templates/`
        try {
          console.log(`About to look for other non-default layout files in the dir "${filesDir}"`)
          const lsFilesDir = readdirSync(filesDir)
          // Remove the default (already created) and get only the ones ending in ".handlebars"
          const filesToAdd = lsFilesDir
            .filter((filename) => filename !== 'layout.handlebars')
            .filter(file => file.endsWith('.handlebars'))
          console.log('got remaining non-default layout files to add as:', filesToAdd.join(', '))
          return filesToAdd;
        } catch (err) {
          console.log('failed to get other layout files via reading the dir at', filesDir, '- error:', err)
          const filesByName = [
            'useradminlayout.handlebars',
            'OLDdefaultlayout.handlebars'
          ]
          console.log('just using hardcoded name list instead for layouts:', filesByName.join(", "))
          return filesByName;
        }
      })()

      // const otherLayoutFiles = 
      // [
      // 'useradminlayout.handlebars',
      // 'OLDdefaultlayout.handlebars'
      // ]


      // CreateLayoutCommand.create({
      //   organizationId: command.organizationId,
      //   environmentId: environment._id,
      //   userId: command.userId,
      //   isDefault: false,
      //   content: '',
      //   identifier: '',
      //   name: '',
      //   description: '',
      //   variables: []

      for (const filename of otherLayoutFiles) {

        console.log('Creating layout for file', filename)
        // Go ahead and create the others in that directory
        await this.createLayoutUsecase.execute(
          CreateLayoutCommand.create({
            userId: command.userId,
            name: filename,
            isDefault: false,
            identifier: `${filename}-template-${nanoid(6)}`,
            content: await this.getNovuLayout.execute(GetNovuLayoutCommand.create({ layoutName: filename })),
            environmentId: environment._id,
            organizationId: command.organizationId,
            description: '',
          }))

      }


    }

    return environment;
  }
}
