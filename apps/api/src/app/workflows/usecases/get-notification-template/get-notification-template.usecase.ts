import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationTemplateEntity, NotificationTemplateRepository } from '@novu/dal';
import { GetNotificationTemplateCommand } from './get-notification-template.command';

/**
 * DEPRECATED:
 * This usecase is deprecated and will be removed in the future.
 * Please use the GetWorkflow usecase instead.
 */
@Injectable()
export class GetNotificationTemplate {
  constructor(private notificationTemplateRepository: NotificationTemplateRepository) {}

  async execute(command: GetNotificationTemplateCommand): Promise<NotificationTemplateEntity> {

    console.log('in GetNotificationTemplate usecase, about to run findByInternalId for template. Using the following params:', JSON.stringify({ command }))
    const template = await this.notificationTemplateRepository.findByInternalId(
      command.environmentId,
      command.internalId,
      command.templateId,
    );

    // command.templateId,
    // command.name

    if (!template) {
      throw new NotFoundException(`Template with the supplied id and/or internalId was not found. internalId: ${command.internalId || '(none supplied)'}, templateId: ${command.templateId || '(none supplied)'}`);
    }

    console.log('Found and returning template under internalId / templateId of', `${template.internalId || ('no value for internalId')} / ${template._id || '(no value for _id)'}`)
    return template;
  }
}
