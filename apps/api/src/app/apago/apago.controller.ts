import { Body, Controller, Get, Param, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import { SubscriberSession } from '../shared/framework/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { ExternalApiAccessible } from '../auth/framework/external-api.decorator';
import { ApagoService } from './apago.service';
import { SubscriberEntity, TopicSubscribersEntity } from '@novu/dal';
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
import { AdministrativeEvent } from './types';
import { StakeholdersResponseDTO } from './dtos/stakeholders-response.dto';
import { InformativeResponseDTO } from './dtos/informative-response.dto';

type SubscriberEntityWithTopics = SubscriberEntity & { topicSubscribers: TopicSubscribersEntity[] };

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
    const user = await this.apagoService.checkUserPermission({
      accountId,
      userId: subscriberSession.subscriberId,
      permissions: ['Stakeholder_View'],
    });

    if (user == null) throw new UnauthorizedException();

    const data: Array<StakeholdersResponseDTO> = [];
    let page = 0;
    const pageSize = 30;

    while (true) {
      const res = await this.filterTopicsUseCase.execute(
        FilterTopicsCommand.create({
          environmentId: subscriberSession._environmentId,
          key: `stakeholder:${jobId}`,
          organizationId: subscriberSession._organizationId,
          page,
          pageSize,
        })
      );

      for (const item of res.data) {
        const key = item.key;

        const [type, jobId, payload] = key.split(':');

        const json = this.apagoService.parsePayload(payload);

        if (!json) continue;

        for (const subscriber of item.subscribers) {
          const index = data.findIndex((val) => val.subscriberId == subscriber);
          if (index > -1) {
            const stageIndex = data[index].stages.findIndex((val) => val.stage == json.stage);
            if (stageIndex > -1) data[index].stages[stageIndex].parts.push(json.part);
            else data[index].stages.push({ stage: json.stage, parts: [json.part] });
          } else {
            data.push({ subscriberId: subscriber, stages: [{ stage: json.stage, parts: [json.part] }] });
          }
        }
      }

      if (res.totalCount < (page + 1) * pageSize) break;
      if (page == 100) break;

      page++;
    }

    return data;
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

    try {
      const subscriber: SubscriberEntityWithTopics = (await this.getSubscriberUseCase.execute(
        GetSubscriberCommand.create({
          environmentId: subscriberSession._environmentId,
          organizationId: subscriberSession._organizationId,
          subscriberId: body.userId,
          topic: 'stakeholder:',
        })
      )) as SubscriberEntityWithTopics;

      const diffrence = subscriber.topicSubscribers.filter((x) => !newTopics.includes(x.topicKey));

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
    const user = await this.apagoService.checkUserPermission({
      accountId,
      userId: subscriberSession.subscriberId,
      permissions: [],
    });

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

    const subscriber: SubscriberEntityWithTopics = (await this.getSubscriberUseCase.execute(
      GetSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: subscriberSession.subscriberId,
        topic: 'informative:',
      })
    )) as SubscriberEntityWithTopics;

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
      const diffrence = subscriber.topicSubscribers.filter((x) => !newTopics.includes(x.topicKey));

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
    const user = await this.apagoService.checkUserPermission({
      userId: subscriberSession.subscriberId,
      accountId,
      permissions: [],
    });

    if (!user) throw new UnauthorizedException();

    const data: Array<InformativeResponseDTO> = [];

    const subscriber: SubscriberEntityWithTopics = (await this.getSubscriberUseCase.execute(
      GetSubscriberCommand.create({
        environmentId: subscriberSession._environmentId,
        organizationId: subscriberSession._organizationId,
        subscriberId: subscriberSession.subscriberId,
        topic: `informative:${accountId}`,
      })
    )) as SubscriberEntityWithTopics;

    for (const topic of subscriber.topicSubscribers) {
      const key = topic.topicKey;

      const [type, accountId, payload] = key.split(':');

      const json = this.apagoService.parsePayload(payload);

      if (!json) continue;

      const index = data.findIndex((val) => val.event == json.event);
      if (index > -1) {
        data[index].parts.push(json.part);
      } else {
        data.push({ event: json.event, parts: [json.part], channel: json.channel });
      }
    }

    return data;
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
}
