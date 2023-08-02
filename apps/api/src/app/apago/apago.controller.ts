import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { IJwtPayload } from '@novu/shared';
import { SubscriberSession, UserSession } from '../shared/framework/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ExternalApiAccessible } from '../auth/framework/external-api.decorator';
import { JwtAuthGuard } from '../auth/framework/auth.guard';
import { ApagoService } from './apago.service';
import { SubscriberEntity } from '@novu/dal';
import { AddBulkSubscribersCommand, AddBulkSubscribersUseCase } from '../topics/use-cases/add-bulk-subscribers';
import { GetSubscriberCommand, GetSubscriber } from '../subscribers/usecases/get-subscriber';
import {
  RemoveBulkSubscribersCommand,
  RemoveBulkSubscribersUseCase,
} from '../topics/use-cases/remove-bulk-subscribers';
import { FilterTopicsUseCase, FilterTopicsCommand } from '../topics/use-cases';
import { UpdateStakeholdersRequestDTO } from './dtos/update-stakeholders-request.dto';
import { UpdateInformativeRequestDTO } from './dtos/update-informative-request.dto';
import { CreateSubscriber, CreateSubscriberCommand } from '@novu/application-generic';
import axios from 'axios';
import { AdministrativeEvent, InformativeEvent } from './types';

@Controller('/apago')
export class ApagoController {
  constructor(
    private apagoService: ApagoService,
    private getSubscriberUseCase: GetSubscriber,
    private addBulkSubscribersUseCase: AddBulkSubscribersUseCase,
    private removeBulkSubscribersUseCase: RemoveBulkSubscribersUseCase,
    private filterTopicsUseCase: FilterTopicsUseCase,
    private createSubscriberUsecase: CreateSubscriber
  ) {}

  @Get('/stakeholders/:accountId/:jobId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async stakeholders(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Param('jobId') jobId: string,
    @Param('accountId') accountId: string
  ) {
    const job = await this.apagoService.getJob(jobId, accountId);

    if (!job) throw new NotFoundException(`Job not found for id ${jobId}`);

    const account = await this.apagoService.checkUserAccount(subscriberSession.subscriberId, accountId);

    if (!account) throw new UnauthorizedException();

    const res: any = {};
    let page = 0;
    const pageSize = 30;

    while (true) {
      const data = await this.filterTopicsUseCase.execute(
        FilterTopicsCommand.create({
          environmentId: subscriberSession._environmentId,
          key: `stakeholder:${jobId}`,
          organizationId: subscriberSession._organizationId,
          page,
          pageSize,
        })
      );

      for (const item of data.data) {
        const key = item.key;

        const [type, jobId, payload] = key.split(':');

        const json = this.apagoService.parsePayload(payload);

        if (!json) continue;

        for (const subscriber of item.subscribers) {
          if (res[subscriber]) {
            const stages = res[subscriber][json.stage] || [];
            res[subscriber] = {
              ...res[subscriber],
              [json.stage]: [...stages, json.part],
            };
          } else {
            res[subscriber] = {
              [json.stage]: [json.part],
            };
          }
        }
      }

      if (data.totalCount < (page + 1) * pageSize) break;
      if (page == 100) break;

      page++;
    }

    return res;
  }

  @Post('/stakeholders/:accountId/:jobId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async updateStakeholder(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Body() body: UpdateStakeholdersRequestDTO,
    @Param('jobId') jobId: string,
    @Param('accountId') accountId: string
  ) {
    const job = await this.apagoService.getJob(jobId, accountId);

    if (!job) throw new NotFoundException(`Job not found for id ${jobId}`);

    const assignerUser = await this.apagoService.checkUserRole(subscriberSession.subscriberId, accountId, body.stage);

    const stakeholderUser = await this.apagoService.checkUserRole(body.userId, accountId, body.stage);

    if (!assignerUser || !stakeholderUser) throw new UnauthorizedException();

    const newTopics = body.parts.map((part) =>
      this.apagoService.getStakeholderKey({
        jobId: jobId,
        part,
        stage: body.stage,
      })
    );

    try {
      const subscriber = await this.getSubscriberUseCase.execute(
        GetSubscriberCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          subscriberId: body.userId,
          fetchTopics: true,
          topic: 'stakeholder:',
        })
      );

      const diffrence = (subscriber as any).topicSubscribers.filter((x: any) => !newTopics.includes(x));

      await this.removeBulkSubscribersUseCase.execute(
        RemoveBulkSubscribersCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          topicKeys: diffrence
            .map((item) => item.topicKey)
            .filter((item) => {
              try {
                const [type, jobId, payload] = item.split(':');
                const json = this.apagoService.parsePayload(payload);
                if (json.stage == body.stage) return true;
              } catch (error) {}
              return false;
            }),
          subscribers: [body.userId],
        })
      );
    } catch (error) {
      await this.createSubscriberUsecase.execute(
        CreateSubscriberCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          subscriberId: body.userId,
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
      })
    );

    return { success: true };
  }

  @Post('/informative/:accountId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async updateInformative(
    @SubscriberSession() subscriberSession: SubscriberEntity,
    @Body() body: UpdateInformativeRequestDTO,
    @Param('accountId') accountId: string
  ) {
    const user = await this.apagoService.checkUserAccount(subscriberSession.subscriberId, accountId);

    if (!user) throw new UnauthorizedException();

    const administrative = this.apagoService.administrativeEvents.includes(body.event as AdministrativeEvent);

    const newTopics = administrative
      ? [
          this.apagoService.getInformativeKey({
            accountId: body.accountId,
            userId: subscriberSession.subscriberId,
            channel: body.channel,
            administrative: true,
            allTitles: body.allTitles,
            event: body.event,
          }),
        ]
      : body.parts.map((part) =>
          this.apagoService.getInformativeKey({
            accountId: body.accountId,
            userId: subscriberSession.subscriberId,
            channel: body.channel,
            part,
            allTitles: body.allTitles,
            event: body.event,
          })
        );

    const subscriber = await this.getSubscriberUseCase.execute(
      GetSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: subscriberSession.subscriberId,
        fetchTopics: true,
        topic: 'informative:',
      })
    );

    if (subscriber == null) {
      await this.createSubscriberUsecase.execute(
        CreateSubscriberCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          subscriberId: body.userId,
          email: user.Email,
          firstName: user.FirstName,
          lastName: user.LastName,
        })
      );
    } else {
      const diffrence = (subscriber as any).topicSubscribers.filter((x: any) => !newTopics.includes(x));

      await this.removeBulkSubscribersUseCase.execute(
        RemoveBulkSubscribersCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          topicKeys: diffrence
            .map((item) => item.topicKey)
            .filter((item) => {
              try {
                const [type, accountId, payload] = item.split(':');
                const json = this.apagoService.parsePayload(payload);
                if (json.event == body.event) return true;
              } catch (error) {}
              return false;
            }),
          subscribers: [subscriberSession.subscriberId],
        })
      );
    }

    await this.addBulkSubscribersUseCase.execute(
      AddBulkSubscribersCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscribers: [subscriberSession.subscriberId],
        topicKeys: newTopics,
      })
    );

    return { success: true };
  }

  @Get('/informative/:accountId')
  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  async informative(@SubscriberSession() subscriberSession: SubscriberEntity, @Param('accountId') accountId: string) {
    const checkUserAccount = await this.apagoService.checkUserAccount(subscriberSession.subscriberId, accountId);

    if (!checkUserAccount) throw new UnauthorizedException();

    const res: any = {};

    const subscriber = await this.getSubscriberUseCase.execute(
      GetSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: subscriberSession.subscriberId,
        fetchTopics: true,
        topic: `informative:${accountId}`,
      })
    );

    for (const topic of (subscriber as any).topicSubscribers) {
      const key = (topic as any).topicKey as string;
      const [type, accountId, payload] = key.split(':');

      const json = this.apagoService.parsePayload(payload);

      if (!json) continue;

      if (res[json.event]) {
        res[json.event]['parts'] = [...res[json.event]['parts'], json.part];
        res[json.event]['keys'] = [...res[json.event]['keys'], key];
      } else {
        res[json.event] = {
          parts: [json.part],
          keys: [key],
          ...json,
          type,
        };
      }
    }

    return res;
  }

  @ExternalApiAccessible()
  @UseGuards(JwtAuthGuard)
  @Post('/trigger/stakeholder')
  async triggerStakeholderNotification(
    @UserSession() user: IJwtPayload,
    @Body() body: any,
    @Headers('Authorization') apiKey: string
  ) {
    const topicKey = this.apagoService.getStakeholderKey({ jobId: body.jobId, part: body.part, stage: body.stage });

    await axios.post(
      'http://localhost:3000/v1/events/trigger',
      {
        to: [{ type: 'Topic', topicKey }],
        name: 'all',
        payload: body.payload || {},
      },
      { headers: { Authorization: apiKey } }
    );

    return { success: true };
  }

  @ExternalApiAccessible()
  @UseGuards(JwtAuthGuard)
  @Post('/trigger/informative')
  async triggerInformativeNotification(
    @UserSession() user: IJwtPayload,
    @Body() body: any,
    @Headers('Authorization') apiKey: string
  ) {
    const channels = ['email', 'inapp', 'all'];
    const all = [true, false];

    const allTopicKeys = channels.map((channel) => ({
      channel,
      keys: all.map((allTitles) => ({
        type: 'Topic',
        topicKey: this.apagoService.getInformativeKey({
          event: body.event,
          part: body.part,
          accountId: body.accountId,
          userId: body.userId,
          channel,
          allTitles,
        }),
      })),
    }));

    for (const keys of allTopicKeys) {
      for (const key of keys.keys) {
        try {
          await axios.post(
            'http://localhost:3000/v1/events/trigger',
            {
              to: [key],
              name: keys.channel,
              payload: body.payload || {},
            },
            { headers: { Authorization: apiKey } }
          );
        } catch (error) {}
      }
    }

    return { success: true };
  }

  @ExternalApiAccessible()
  @UseGuards(AuthGuard('subscriberJwt'))
  @Post('/identify')
  async identifyAll(@SubscriberSession() subscriberSession: SubscriberEntity) {
    const user = await this.apagoService.getUser(subscriberSession.subscriberId);

    if (!user) return null;

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
}
