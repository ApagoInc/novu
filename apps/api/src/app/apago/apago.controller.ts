import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  Logger
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
import { InformativeBodyDto, InformativeBulkBodyDto, InformativeEventTriggerBodyDto } from './dtos/informative.dto';
import { ParseEventRequest, ParseEventRequestCommand } from '../events/usecases/parse-event-request';
import { ApiService } from './api.service';
import { JwtAuthGuard } from '../auth/framework/auth.guard';
import { GetPreferences } from '../subscribers/usecases/get-preferences/get-preferences.usecase';
import { GetPreferencesCommand } from '../subscribers/usecases/get-preferences/get-preferences.command';
import { ChannelTypeEnum } from '@novu/shared';
import { GetSubscriber } from '../subscribers/usecases/get-subscriber';
import { GetSubscriberCommand } from '../subscribers/usecases/get-subscriber/get-subscriber.command';
import { Exception } from 'handlebars';


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
    private getTopicUseCase: GetTopicUseCase,
    private getPreferenceUsecase: GetPreferences,
    private getSubscriberUsecase: GetSubscriber
  ) {}



  
  /** Check if a user exists in Novu */
  @Get('/exists/:accountId/:userId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async getNovuSubscriberForUser(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Param('accountId') accountId: string,
    @Param('userId') userId: string
  ) {



    // TODO - consider, do we need to really check any apago API permissions or users here?
    // This is going to run when a user's edit page is loaded.
    // It can only be loaded by a user that has User_Edit.


    // -----

    // Logger.log(`Checking permissions for the user that fired this check, by navigating to the user edit screen.`)
    // const user = await this.apagoService.checkUserPermission({
    //   userId: subscriberSession.subscriberId,
    //   accountId,
    //   permissions: [],
    // });

    // if (!user) throw new UnauthorizedException('User not found!');

    // if (userId !== subscriberSession.subscriberId) {
    //   //A user is viewing another user's user edit page, so we check for permission
    //   const isAdmin = await this.apagoService.checkUserPermission({
    //     userId,
    //     accountId,
    //     permissions: [],
    //   });

    //   if (!isAdmin) throw new UnauthorizedException();
    // }

    Logger.log(`Attempting to fetch the novu subscriber under ID: ${userId}`)

    // See if the user is in Novu
    const novuUser = await this.getSubscriberUsecase.execute(
      GetSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: userId
      })
    );


  Logger.log(`Value of novuUser:`)
  Logger.log(novuUser)

  if (!novuUser) {
    throw new NotFoundException(`Subscriber under user ID ${userId} does not yet exist in Novu.`);
  }
  

  return {'result': `User under subscriber ID ${userId} exists in Novu`};
  }


  @Post('/subscriber/manualCreate/:accountId/:userId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))  
  async manualCreateSubscriber(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Param('accountId') accountId: string,
    @Param('userId') userId: string
  ) {

    // TODO - should we also check perms of the one calling this?
    // Or do we already know by the fact that the user is viewing User_Edit, that they have access to do this?
    // TODO - I guess in theory, someone could call the URL without being on the UI, so we should check perms of the actor.

    const user = await this.apagoService.checkUserPermission({
      accountId,
      userId,
      permissions: [],
    });

    if (!user || !user.Status) throw new UnauthorizedException("Could not create user - unauthorized.");

    if (user.Status && user.Status !== "active") {
      throw new UnauthorizedException(`User under userId ${userId} must be in status active to be added to Novu.`)
    }


    Logger.log(`*** - Subscriber under subscriberId ${userId} ${user.Email || "(no email)"} does not exist - MANUALLY creating now. ${new Date().toLocaleTimeString()}`)

    try {
    await this.createSubscriberUsecase.execute(
      CreateSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: userId,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
      })
    );

    return {newSubscriberId: userId};
    } catch (err) {

      throw new Exception(`Something went wrong while trying to manually create the new subscriber: ${err}`)
    }
  }

  

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

  @Post('/informative/:accountId/:userId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async updateInformative(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Body() body: InformativeBulkBodyDto,
    @Param('accountId') accountId: string,
    @Param('userId') userId: string
  ) {
    const user = await this.apagoService.checkUserPermission({
      accountId,
      userId,
      permissions: [],
    });

    if (!user || !user.Status) throw new UnauthorizedException();

    if (user.Status && user.Status !== "active") {
      throw new UnauthorizedException(`User under userId ${userId} must be in status active to be updated in Novu`)
    }

    if (userId !== subscriberSession.subscriberId) {
      //A user tries to make changes for another user so we check for permission
      const isAdmin = await this.apagoService.checkUserPermission({
        userId,
        accountId,
        permissions: ['User_Edit'],
      });

      if (!isAdmin) throw new UnauthorizedException();
    }


    // 




    // See if the user is in Novu
    const novuUser = await this.getSubscriberUsecase.execute(
      GetSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: userId
      })
    );


  Logger.log(`Value of novuUser:`)
  Logger.log(novuUser)

  if (!novuUser) {
    throw new NotFoundException(`Subscriber under user ID ${userId} does not yet exist in Novu.`);
  }





    // 

    const list = body.eventList;

    const updateFunctions: Array<Promise<void>> = [];

    for (const item of list) {
      const updateSingleEvent = async () => {
        const find = this.apagoService.informativeEvents
          .flatMap((val) => val.events)
          .find((val) => val.value == item.event);

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

        let newTopics: string[] = [];

        if (find.has_parts && item.parts && item.parts.length > 0) {
          newTopics = item.parts.map((part) =>
            this.apagoService.getInformativeKey({
              accountId,
              part,
              titles: item.titles,
              event: item.event,
            })
          );
        } else if (!find.has_parts) {
          newTopics.push(
            this.apagoService.getInformativeKey({
              accountId,
              titles: item.titles,
              event: item.event,
            })
          );
        }

        let diffrence: string[] = [];

        try {
          const subscriber = await this.getSubscriberTopics.execute(
            GetTopicsCommand.create({
              environmentId: subscriberSession._environmentId,
              organizationId: subscriberSession._organizationId,
              subscriberId: userId,
              topic: `informative:${accountId}:${item.event}`,
              email: user.Email,
              firstName: user.FirstName,
              lastName: user.LastName,
            })
          );

          diffrence = subscriber.subscriptions.filter((item) => !newTopics.includes(item.key)).map((item) => item.key);
        } catch (error) {


          Logger.log(`*** - Subscriber under subscriberId ${userId} ${user.Email || "(no email)"} does not exist - creating now. ${new Date().toLocaleTimeString()}`)

          await this.createSubscriberUsecase.execute(
            CreateSubscriberCommand.create({
              environmentId: subscriberSession._environmentId,
              organizationId: subscriberSession._organizationId,
              subscriberId: userId,
              email: user.Email,
              firstName: user.FirstName,
              lastName: user.LastName,
            })
          );
        }

        await this.addBulkSubscribersUseCase.execute(
          AddBulkSubscribersCommand.create({
            environmentId: subscriberSession._environmentId,
            organizationId: subscriberSession._organizationId,
            subscribers: [userId],
            topicKeys: newTopics,
            templateId: template._id,
            removeKeys: diffrence,
          })
        );

        await this.updatePreferenceUsecase.execute(
          UpdateSubscriberPreferenceCommand.create({
            environmentId: subscriberSession._environmentId,
            organizationId: subscriberSession._organizationId,
            subscriberId: userId,
            templateId: template._id,
            channel: { enabled: item.inApp ? true : false, type: ChannelTypeEnum.IN_APP },
          })
        );

        await this.updatePreferenceUsecase.execute(
          UpdateSubscriberPreferenceCommand.create({
            environmentId: subscriberSession._environmentId,
            organizationId: subscriberSession._organizationId,
            subscriberId: userId,
            templateId: template._id,
            channel: { enabled: item.email ? true : false, type: ChannelTypeEnum.EMAIL },
          })
        );
      };
      updateFunctions.push(updateSingleEvent());
    }

    await Promise.all(updateFunctions);

    return { success: true };
  }

  @Post('/informative/:accountId/:templateId/:userId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async updateChannel(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Body() body: { channel: ChannelPreference },
    @Param('accountId') accountId: string,
    @Param('templateId') templateId: string,
    @Param('userId') userId: string
  ) {
    const user = await this.apagoService.checkUserPermission({
      userId,
      accountId,
      permissions: [],
    });

    if (!user) throw new UnauthorizedException();

    if (userId !== subscriberSession.subscriberId) {
      //A user tries to make changes for another user so we check for permission
      const isAdmin = await this.apagoService.checkUserPermission({
        userId,
        accountId,
        permissions: ['User_Edit'],
      });

      if (!isAdmin) throw new UnauthorizedException();
    }

    return await this.updatePreferenceUsecase.execute(
      UpdateSubscriberPreferenceCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: userId,
        templateId: templateId,
        ...(body.channel && { channel: body.channel }),
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

    const obj = {};

    try {
      const subscriber = await this.getSubscriberTopics.execute(
        GetTopicsCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          subscriberId: userId,
          email: user.Email,
          firstName: user.FirstName,
          lastName: user.LastName,
          topic: `informative:${accountId}`,
        })
      );

      if (subscriber.subscriptions) {
        const preferences = await this.getPreferenceUsecase.execute(
          GetPreferencesCommand.create({
            environmentId: subscriberSession._environmentId,
            organizationId: subscriberSession._organizationId,
            subscriberId: userId,
          })
        );

        for (const topic of subscriber.subscriptions) {
          const key = topic.key;

          const [type, accountId, event, ...rest] = key.split(':');

          const find = this.apagoService.informativeEvents
            .flatMap((val) => val.events)
            .find((val) => val.value == event);

          if (!find) continue;

          const preference = preferences.find((val) => val.template.name === find.label);

          const in_app = preference?.preference.channels.in_app;
          const email = preference?.preference.channels.email;

          if (obj[event] && find?.has_parts) {
            obj[event].parts.push(rest[0]);
          } else {
            obj[event] = {
              event: event,
              key: key,
              ...(find?.has_parts && { parts: [rest[0]] }),
              templateId: topic._templateId,
              channels: {
                in_app: typeof in_app === 'undefined' ? false : in_app,
                email: typeof email === 'undefined' ? false : email,
              },
              titles: rest[find.has_parts ? 1 : 0],
            };
          }
        }
      }
    } catch (error) {}

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
        await apiService.login();
        await apiService.setAccount(body.accountId);
        const toList: string[] = [];

        for (const subscriber of topic.subscribers) {
          const hasJobInList = await apiService.getJobList(
            subscriber,
            body.jobAccountId as string,
            body.jobId as string
          );
          if (hasJobInList) toList.push(subscriber);
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
}
