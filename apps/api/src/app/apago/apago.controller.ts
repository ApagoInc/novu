import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { SubscriberSession, UserSession } from '../shared/framework/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ExternalApiAccessible } from '../auth/framework/external-api.decorator';
import { ApagoService } from './apago.service';
import { SubscriberEntity } from '@novu/dal';
import { AddBulkSubscribersCommand, AddBulkSubscribersUseCase } from '../topics/use-cases/add-bulk-subscribers';
import { GetTopicsCommand, GetTopics } from '../subscribers/usecases/get-topics';
import { FilterTopicsUseCase, FilterTopicsCommand, GetTopicCommand, GetTopicUseCase } from '../topics/use-cases';
import { CreateSubscriber, CreateSubscriberCommand } from '@novu/application-generic';
import { UpdatePreference } from '../subscribers/usecases/update-preference/update-preference.usecase';
import { UpdateSubscriberPreferenceCommand } from '../subscribers/usecases/update-subscriber-preference';
import { ChannelPreference } from '../shared/dtos/channel-preference';
import { GetNotificationTemplateCommand } from '../workflows/usecases/get-notification-template/get-notification-template.command';
import { GetNotificationTemplate } from '../workflows/usecases/get-notification-template/get-notification-template.usecase';
import slugify from 'slugify';
import { IJwtPayload, TriggerRecipientsTypeEnum } from '@novu/shared';
import { StakeholderBodyDto, StakeholderEventTriggerBodyDto, StakeholdersResponseDto } from './dtos/stakeholders.dto';
import { InformativeBodyDto, InformativeEventTriggerBodyDto } from './dtos/informative.dto';
import { ParseEventRequest, ParseEventRequestCommand } from '../events/usecases/parse-event-request';
import { ApiService } from './api.service';
import { JwtAuthGuard } from '../auth/framework/auth.guard';

@Controller('/apago')
export class ApagoController {
  constructor(
    private apagoService: ApagoService,
    private addBulkSubscribersUseCase: AddBulkSubscribersUseCase,
    private filterTopicsUseCase: FilterTopicsUseCase,
    private createSubscriberUsecase: CreateSubscriber,
    private getSubscriberTopics: GetTopics,
    private updatePreferenceUsecase: UpdatePreference,
    private getWorkflowUsecase: GetNotificationTemplate,
    private parseEventRequest: ParseEventRequest,
    private getTopicUseCase: GetTopicUseCase
  ) {}

  @Get('/stakeholders/:accountId/:jobId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async stakeholders(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Param('jobId') jobId: string,
    @Param('accountId') accountId: string
  ) {
    const user = await this.apagoService.checkUserPermission({
      accountId,
      userId: subscriberSession.subscriberId,
      permissions: ['Stakeholder_View'],
    });

    if (user == null) throw new UnauthorizedException();

    const data: StakeholdersResponseDto[] = [];

    const res = await this.filterTopicsUseCase.execute(
      FilterTopicsCommand.create({
        environmentId: subscriberSession._environmentId,
        key: `stakeholder:${jobId}`,
        organizationId: subscriberSession._organizationId,
        noPagination: true,
      })
    );

    for (const item of res.data) {
      const key = item.key;

      const [type, jobId, stage, part] = key.split(':');

      for (const subscriber of item.subscribers) {
        const index = data.findIndex((val) => val.subscriberId == subscriber);
        if (index > -1) {
          const stageIndex = data[index].stages.findIndex((val) => val.stage == stage);
          if (stageIndex > -1) data[index].stages[stageIndex].parts.push(part);
          else data[index].stages.push({ stage: stage, parts: [part] });
        } else {
          data.push({ subscriberId: subscriber, stages: [{ stage: stage, parts: [part] }] });
        }
      }
    }

    return data;
  }

  @Post('/stakeholders/:accountId/:jobId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async updateStakeholder(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Body() body: StakeholderBodyDto,
    @Param('jobId') jobId: string,
    @Param('accountId') accountId: string
  ) {
    const stakeholderUser = await this.apagoService.checkStakeholderPermissions({
      userId: subscriberSession.subscriberId,
      jobId,
      accountId,
      stakeholderId: body.userId,
      stage: body.stage,
    });

    if (!stakeholderUser) throw new UnauthorizedException();

    const newTopics = body.parts.map((part) =>
      this.apagoService.getStakeholderKey({
        jobId: jobId,
        part,
        stage: body.stage,
      })
    );

    let diffrence: string[] = [];

    try {
      const subscriber = await this.getSubscriberTopics.execute(
        GetTopicsCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          subscriberId: stakeholderUser.UserID,
          email: stakeholderUser.Email,
          firstName: stakeholderUser.FirstName,
          lastName: stakeholderUser.LastName,
          topic: `stakeholder:${jobId}:${body.stage}`,
        })
      );

      diffrence = subscriber.subscriptions.filter((x) => !newTopics.includes(x.key)).map((item) => item.key);
    } catch (error) {
      await this.createSubscriberUsecase.execute(
        CreateSubscriberCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          subscriberId: stakeholderUser.UserID,
          email: stakeholderUser.Email,
          firstName: stakeholderUser.FirstName,
          lastName: stakeholderUser.LastName,
        })
      );
    }

    await this.addBulkSubscribersUseCase.execute(
      AddBulkSubscribersCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscribers: [body.userId],
        topicKeys: newTopics,
        removeKeys: diffrence,
      })
    );

    return { success: true };
  }

  @Post('/informative/:accountId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async updateInformative(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Body() body: InformativeBodyDto,
    @Param('accountId') accountId: string
  ) {
    const user = await this.apagoService.checkUserPermission({
      accountId,
      userId: subscriberSession.subscriberId,
      permissions: [],
    });

    if (!user) throw new UnauthorizedException();

    const find = this.apagoService.informativeEvents
      .flatMap((val) => val.events)
      .find((val) => val.value == body.event);

    if (!find) throw new NotFoundException('Event not found!');

    const template = await this.getWorkflowUsecase.execute(
      GetNotificationTemplateCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        name: find?.label,
        userId: subscriberSession.subscriberId,
      })
    );

    if (!template) throw new NotFoundException('Template not found!');

    const newTopics =
      body?.parts && body.parts.length > 0
        ? body.parts.map((part) =>
            this.apagoService.getInformativeKey({
              accountId,
              part,
              titles: body.titles,
              event: body.event,
            })
          )
        : [
            this.apagoService.getInformativeKey({
              accountId,
              titles: body.titles,
              event: body.event,
            }),
          ];

    const subscriber = await this.getSubscriberTopics.execute(
      GetTopicsCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: subscriberSession.subscriberId,
        topic: `informative:${accountId}:${body.event}`,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
      })
    );

    const diffrence = subscriber.subscriptions.filter((item) => !newTopics.includes(item.key)).map((item) => item.key);

    await this.addBulkSubscribersUseCase.execute(
      AddBulkSubscribersCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscribers: [subscriberSession.subscriberId],
        topicKeys: newTopics,
        templateId: template._id,
        removeKeys: diffrence,
      })
    );

    return { success: true, template: template._id };
  }

  @Post('/informative/:accountId/:templateId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async updateChannel(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Body() body: { channel: ChannelPreference },
    @Param('accountId') accountId: string,
    @Param('templateId') templateId: string
  ) {
    const user = await this.apagoService.checkUserPermission({
      userId: subscriberSession.subscriberId,
      accountId,
      permissions: [],
    });

    if (!user) throw new UnauthorizedException();

    return await this.updatePreferenceUsecase.execute(
      UpdateSubscriberPreferenceCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: subscriberSession.subscriberId,
        templateId: templateId,
        ...(body.channel && { channel: body.channel }),
      })
    );
  }

  @Get('/informative/:accountId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async informative(@SubscriberSession() subscriberSession: SubscriberEntity, @Param('accountId') accountId: string) {
    const user = await this.apagoService.checkUserPermission({
      userId: subscriberSession.subscriberId,
      accountId,
      permissions: [],
    });

    if (!user) throw new UnauthorizedException('User not found!');

    const subscriber = await this.getSubscriberTopics.execute(
      GetTopicsCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: subscriberSession.subscriberId,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        topic: `informative:${accountId}`,
      })
    );

    const obj = {};
    if (subscriber.subscriptions) {
      for (const topic of subscriber.subscriptions) {
        const key = topic.key;

        const [type, accountId, event, ...rest] = key.split(':');

        const find = this.apagoService.informativeEvents.flatMap((val) => val.events).find((val) => val.value == event);

        if (!find) continue;

        const in_app = topic?.preferences?.channels?.in_app;
        const email = topic?.preferences?.channels?.email;

        if (obj[event] && find?.has_parts) {
          obj[event].parts.push(rest[0]);
        } else {
          obj[event] = {
            event: event,
            ...(find?.has_parts && { parts: [rest[0]] }),
            templateId: topic._templateId,
            channels: {
              in_app: typeof in_app === 'undefined' ? false : true,
              email: typeof email === 'undefined' ? false : true,
            },
            titles: rest[find.has_parts ? 1 : 0],
          };
        }
      }
    }

    const res = this.apagoService.informativeEvents.map((item) => {
      return {
        ...item,
        events: item.events.map((val) => {
          const subscription = obj[val.value];
          return {
            ...val,
            subscription,
          };
        }),
      };
    });

    return res;
  }

  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  @Post('/:accountId/identify')
  async identifyAll(@SubscriberSession() subscriberSession: SubscriberEntity, @Param('accountId') accountId: string) {
    const user = await this.apagoService.checkUserPermission({
      userId: subscriberSession.subscriberId,
      accountId,
      permissions: [],
    });

    if (!user) throw new UnauthorizedException();

    await this.createSubscriberUsecase.execute(
      CreateSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: subscriberSession.subscriberId,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
      })
    );

    return { success: true };
  }

  @ExternalApiAccessible()
  @UseGuards(JwtAuthGuard)
  @Post('/trigger/informative')
  async triggerInformativeEvents(
    @UserSession() user: IJwtPayload,
    @Body() body: InformativeEventTriggerBodyDto
  ): Promise<{ success: boolean }> {
    const event = this.apagoService.informativeEvents
      .flatMap((val) => val.events)
      .find((val) => val.value == body.event);

    if (!event) throw new NotFoundException(`Event ${body.event} not found!`);

    if (!event?.administrative) {
      const allTitles = this.apagoService.getInformativeEvents({ ...body, titles: 'allTitles' });

      try {
        await this.parseEventRequest.execute(
          ParseEventRequestCommand.create({
            userId: user._id,
            environmentId: user.environmentId,
            organizationId: user.organizationId,
            identifier: `${slugify(event?.label, {
              lower: true,
              strict: true,
            })}`,
            payload: body.payload || {},
            overrides: {},
            to: [{ type: 'Topic' as TriggerRecipientsTypeEnum.TOPIC, topicKey: allTitles }],
          })
        );
      } catch (error) {
        if (error?.status !== 404) throw error;
      }

      const myTitles = this.apagoService.getInformativeEvents({ ...body, titles: 'myTitles' });

      const topic = await this.getTopicUseCase.execute(
        GetTopicCommand.create({
          environmentId: user.environmentId,
          topicKey: myTitles,
          organizationId: user.organizationId,
        })
      );

      if (topic.subscribers.length > 0) {
        const apiService = new ApiService();
        await apiService.init();
        await apiService.setAccount(body.accountId);
        const users = await apiService.getUsers();
        const toList: string[] = [];

        for (const subscriber of topic.subscribers) {
          const user = users.find((val) => val.UserID == subscriber);
          if (!user?.JobsList) continue;
          const jobList = user.JobsList[body.jobAccountId as string] || [];

          if (!jobList.includes(body.jobId)) continue;
          toList.push(subscriber);
        }

        try {
          await this.parseEventRequest.execute(
            ParseEventRequestCommand.create({
              userId: user._id,
              environmentId: user.environmentId,
              organizationId: user.organizationId,
              identifier: `${slugify(event?.label, {
                lower: true,
                strict: true,
              })}`,
              payload: body.payload || {},
              overrides: {},
              to: toList,
            })
          );
        } catch (error) {
          if (error?.status !== 404) throw error;
        }
      }

      return { success: true };
    }

    const topicKey = this.apagoService.getInformativeEvents(body);

    try {
      await this.parseEventRequest.execute(
        ParseEventRequestCommand.create({
          userId: user._id,
          environmentId: user.environmentId,
          organizationId: user.organizationId,
          identifier: `${slugify(event?.label, {
            lower: true,
            strict: true,
          })}`,
          payload: body.payload || {},
          overrides: {},
          to: [{ type: 'Topic' as TriggerRecipientsTypeEnum.TOPIC, topicKey }],
        })
      );
    } catch (error) {
      if (error?.status !== 404) throw error;
    }

    return { success: true };
  }

  @ExternalApiAccessible()
  @UseGuards(JwtAuthGuard)
  @Post('/trigger/stakeholder')
  async trackStakeholderEvent(
    @UserSession() user: IJwtPayload,
    @Body() body: StakeholderEventTriggerBodyDto
  ): Promise<{ success: boolean }> {
    const topicKey = this.apagoService.getStakeholderKey(body);

    const stage = this.apagoService.stakeholderStages.find((val) => val.value == body.stage);

    if (!stage) throw new NotFoundException(`Stage ${body.stage} not found!`);

    try {
      await this.parseEventRequest.execute(
        ParseEventRequestCommand.create({
          userId: user._id,
          environmentId: user.environmentId,
          organizationId: user.organizationId,
          identifier: `${slugify(stage?.label, {
            lower: true,
            strict: true,
          })}sss`,
          payload: body.payload || {},
          overrides: {},
          to: [{ type: 'Topic' as TriggerRecipientsTypeEnum.TOPIC, topicKey }],
        })
      );
    } catch (error) {
      if (error?.status !== 404) throw error;
    }

    return { success: true };
  }
}
