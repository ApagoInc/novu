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
import { CreateSubscriber, CreateSubscriberCommand } from '@novu/application-generic';
import { GetNotificationTemplateCommand } from '../workflows/usecases/get-notification-template/get-notification-template.command';
import { GetNotificationTemplate } from '../workflows/usecases/get-notification-template/get-notification-template.usecase';
import slugify from 'slugify';
import { IJwtPayload } from '@novu/shared';
import { StakeholderBodyDto, StakeholderEventTriggerBodyDto, StakeholdersResponseDto } from './dtos/stakeholders.dto';
import { InformativeSubscriptionsDto, InformativeEventTriggerBodyDto } from './dtos/informative.dto';
import { ParseEventRequest, ParseEventRequestCommand } from '../events/usecases/parse-event-request';
import { ApiService } from './api.service';
import { JwtAuthGuard } from '../auth/framework/auth.guard';
import {
  SetInformativeSubscriptions,
  SetInformativeSubscriptionsCommand,
} from './usecases/set-informative-subscriptions';
import {
  GetInformativeSubscriptions,
  GetInformativeSubscriptionsCommand,
} from './usecases/get-informative-subscriptions';
import { GetStakeholders, GetStakeholdersCommand } from './usecases/get-stakeholders';
import { SetStakeholders, SetStakeholdersCommand } from './usecases/set-stakeholders';
import { StakeholderSubscribers, StakeholderSubscribersCommand } from './usecases/stakeholder-subscribers';
import { InformativeSubscribers, InformativeSubscribersCommand } from './usecases/informative-subscribers';

@Controller('/apago')
export class ApagoController {
  constructor(
    private apagoService: ApagoService,
    private createSubscriberUsecase: CreateSubscriber,
    private getWorkflowUsecase: GetNotificationTemplate,
    private parseEventRequest: ParseEventRequest,
    private setInformativeSubscriptions: SetInformativeSubscriptions,
    private getInformativeSubscriptions: GetInformativeSubscriptions,
    private getStakeholders: GetStakeholders,
    private setStakeholders: SetStakeholders,
    private stakeholderSubscribers: StakeholderSubscribers,
    private informativeSubscribers: InformativeSubscribers
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

    return this.getStakeholders.execute(
      GetStakeholdersCommand.create({
        organizationId: subscriberSession._organizationId,
        environmentId: subscriberSession._environmentId,
        jobId,
      })
    );
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

    const subscriber = await this.createSubscriberUsecase.execute(
      CreateSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: stakeholderUser.UserID,
        firstName: stakeholderUser.FirstName,
        lastName: stakeholderUser.LastName,
        email: stakeholderUser.Email,
      })
    );

    await this.setStakeholders.execute(
      SetStakeholdersCommand.create({
        organizationId: subscriberSession._organizationId,
        environmentId: subscriberSession._environmentId,
        accountId,
        jobId,
        parts: body.parts,
        subscriberId: subscriber._id,
        stage: body.stage,
      })
    );

    return { success: true };
  }

  @Post('/informative/:accountId/:userId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async updateInformative(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Body() body: InformativeSubscriptionsDto,
    @Param('accountId') accountId: string,
    @Param('userId') userId: string
  ) {
    const user = await this.apagoService.checkUserPermission({
      accountId,
      userId,
      permissions: [],
    });

    if (!user || !user.Status) throw new UnauthorizedException();

    if (user.Status && user.Status !== 'active') {
      throw new UnauthorizedException(`User under userId ${userId} must be in status active to be updated in Novu`);
    }

    const subscriber = await this.createSubscriberUsecase.execute(
      CreateSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: user.UserID,
        firstName: user.FirstName,
        lastName: user.LastName,
        email: user.Email,
      })
    );

    return this.setInformativeSubscriptions.execute(
      SetInformativeSubscriptionsCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        accountId,
        subscriberId: subscriber._id,
        list: body.list,
        externalSubsciberId: subscriber.subscriberId,
      })
    );
  }

  @Get('/informative/:accountId/:userId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async informative(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Param('accountId') accountId: string,
    @Param('userId') userId: string
  ) {
    const user = await this.apagoService.checkUserPermission({
      userId: userId,
      accountId,
      permissions: [],
    });

    if (!user) throw new UnauthorizedException('User not found!');

    if (userId !== subscriberSession.subscriberId) {
      //A user tries to make changes for another user so we check for permission
      const isAdmin = await this.apagoService.checkUserPermission({
        userId,
        accountId,
        permissions: [],
      });

      if (!isAdmin) throw new UnauthorizedException();
    }

    const subscriber = await this.createSubscriberUsecase.execute(
      CreateSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: user.UserID,
        firstName: user.FirstName,
        lastName: user.LastName,
        email: user.Email,
      })
    );

    const data = await this.getInformativeSubscriptions.execute(
      GetInformativeSubscriptionsCommand.create({
        subscriberId: subscriber._id,
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        accountId,
      })
    );

    const mapped = await Promise.all(
      this.apagoService.informativeEvents.map(async (item) => {
        const events = await Promise.all(
          item.events.map(async (event) => {
            const subscription = data.find((val) => val.template?.name == event.label);

            if (!subscription) {
              const template = await this.getWorkflowUsecase.execute(
                GetNotificationTemplateCommand.create({
                  environmentId: subscriberSession._environmentId,
                  organizationId: subscriberSession._organizationId,
                  name: event?.label,
                  userId: subscriberSession.subscriberId,
                })
              );
              return { ...event, template: { _id: template._id } };
            }
            return { ...event, subscription };
          })
        );
        return {
          ...item,
          events,
        };
      })
    );

    return mapped;
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

    if (!user) throw new UnauthorizedException(`Lakeside auth failed`);

    return this.createSubscriberUsecase.execute(
      CreateSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: user.UserID,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
      })
    );
  }

  @ExternalApiAccessible()
  @UseGuards(JwtAuthGuard)
  @Post('/trigger/informative')
  async triggerInformativeEvents(@UserSession() user: IJwtPayload, @Body() body: InformativeEventTriggerBodyDto) {
    const event = this.apagoService.informativeEvents
      .flatMap((val) => val.events)
      .find((val) => val.value == body.event);

    if (!event) throw new NotFoundException(`Event ${body.event} not found!`);

    const template = await this.getWorkflowUsecase.execute(
      GetNotificationTemplateCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        name: event.label,
        userId: user._id,
      })
    );

    if (!template) throw new NotFoundException(`Template for event ${body.event} not found!`);

    const subscribers = await this.informativeSubscribers.execute(
      InformativeSubscribersCommand.create({
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        templateId: template._id,
        accountId: body.accountId,
        part: body.part,
      })
    );

    let toList: string[] = [];

    if (!event?.administrative) {
      toList = subscribers.filter((item) => item.allTitles === true).map((item) => item.subscriber.subscriberId);
      const myTitles = subscribers.filter((item) => item.allTitles !== true);

      if (myTitles.length > 0) {
        const apiService = new ApiService();
        await apiService.init();
        await apiService.login();
        await apiService.setAccount(body.accountId);

        for (const subscriber of myTitles) {
          const hasJobInList = await apiService.getJobList(
            subscriber.subscriber.subscriberId,
            body.jobAccountId as string,
            body.jobId as string
          );
          if (hasJobInList) toList.push(subscriber.subscriber.subscriberId);
        }
      }
    } else {
      toList = subscribers.map((item) => item.subscriber.subscriberId);
    }

    return this.parseEventRequest.execute(
      ParseEventRequestCommand.create({
        userId: user._id,
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        identifier: template.triggers[0].identifier,
        payload: body.payload || {},
        overrides: {},
        to: toList,
      })
    );
  }

  @ExternalApiAccessible()
  @UseGuards(JwtAuthGuard)
  @Post('/trigger/stakeholder')
  async trackStakeholderEvent(@UserSession() user: IJwtPayload, @Body() body: StakeholderEventTriggerBodyDto) {
    const stage = this.apagoService.stakeholderStages.find((val) => val.value == body.stage);

    if (!stage) throw new NotFoundException(`Stage ${body.stage} not found!`);

    const subscribers = await this.stakeholderSubscribers.execute(
      StakeholderSubscribersCommand.create({
        stage: body.stage,
        jobId: body.jobId,
        part: body.part,
        organizationId: user.organizationId,
        environmentId: user.environmentId,
      })
    );

    const toList = subscribers.map((item) => item.subscriber.subscriberId);

    return this.parseEventRequest.execute(
      ParseEventRequestCommand.create({
        userId: user._id,
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        identifier: `${slugify(stage?.label, {
          lower: true,
          strict: true,
        })}`,
        payload: body.payload || {},
        overrides: {},
        to: toList,
      })
    );
  }
}
