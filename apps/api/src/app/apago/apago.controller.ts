import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
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
    // Let's be very clear:
    // userId is the user EDITING stakeholders.
    // stakeholderId is the user being edited as a stakeholder.
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

  /**
   * POST changes for a given user's informative notification subscriptions.
   */
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

    // TODO - don't allow subscriptions to any events of type 'discrete'

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

    if (user?.Status !== 'active') {
      throw new UnauthorizedException({
        reason: 'user_not_active',
        message: `User must be in Status 'active' to participate in Novu notifications.`,
      });
    }

    if (!user) throw new UnauthorizedException('User not found.');

    if (userId !== subscriberSession.subscriberId) {
      //A user tries to make changes for another user so we check for permission
      const isAdmin = await this.apagoService.checkUserPermission({
        userId,
        accountId,
        permissions: [],
      });

      if (!isAdmin)
        throw new UnauthorizedException(
          `User must be an admin in order to make changes for a different Novu subscriber.`
        );
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

    // TODO -
    // Maybe right now, it's easiest to just:
    // filter the download event category on the UI, and at the subscribe(POST, the route above) level.
    // Given that since the event is 'discrete', it will never go out to anyone else who subscribes anyways.

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
            console.log('mapping event', event.value, 'subscriptions...');
            const subscription = data.find((val) => {
              console.log(
                `checking val.template.internalId of "${val.template?.internalId}" to see if it matches event value of "${event.value}"`
              );
              return val.template?.internalId === event.value;
            });

            if (!subscription) {
              const template = await this.getWorkflowUsecase.execute(
                GetNotificationTemplateCommand.create({
                  environmentId: subscriberSession._environmentId,
                  organizationId: subscriberSession._organizationId,
                  // name: event?.label,
                  userId: subscriberSession.subscriberId,
                  internalId: event.value,
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

  /**
   * A route used to identify the active novu subscriber once they interact with the Scout FE.
   * If not found, the user will be created.
   * @param subscriberSession
   * @param accountId
   * @returns
   */
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

  /**
   * POST a novu informative notification "trigger". This fires a notification.
   * @param user
   * @param body
   * @returns
   */
  @ExternalApiAccessible()
  @UseGuards(JwtAuthGuard)
  @Post('/trigger/informative')
  async triggerInformativeEvents(@UserSession() user: IJwtPayload, @Body() body: InformativeEventTriggerBodyDto) {
    /** Tag the console messages for this trigger run */
    const tag = `[${String(Date.now())}]`;

    // We also support sending discrete notifications to just one or several recipients, IF that is requested here.
    const specialOptions = body.payload?.specialOptions;
    console.log(tag, 'body, and body.payload:', JSON.stringify(body), JSON.stringify(body.payload));
    const discrete =
      specialOptions &&
      specialOptions.discrete &&
      (specialOptions.discrete === 'true' || specialOptions.discrete === true);
    const recipients =
      discrete && specialOptions.recipients && Array.isArray(specialOptions.recipients)
        ? specialOptions.recipients
        : undefined;

    // TODO - better validation on recipients
    console.log(
      tag,
      'in /trigger/informative post - got the following values:',
      JSON.stringify({
        specialOptions,
        discrete,
        recipients,
      })
    );

    if (discrete) {
      if (!recipients || (recipients && recipients.length === 0)) {
        throw new BadRequestException('Cannot post discrete notification without at least one recipient.');
      }
    }

    const event = this.apagoService.informativeEvents
      .flatMap((val) => val.events)
      .find((val) => val.value == body.event);

    if (!event) throw new NotFoundException(`Event ${body.event} not found!`);

    const template = await this.getWorkflowUsecase.execute(
      GetNotificationTemplateCommand.create({
        internalId: event.value,
        environmentId: user.environmentId,
        organizationId: user.organizationId,
        // name: event.label,
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

    const jobAssociatedAccounts: { [acct in 'parentAcct' | 'bookAcct' | 'tepAcct']?: string } | undefined =
      body.payload.jobAssociatedAccounts;

    if (jobAssociatedAccounts) {
      console.log(
        'got a jobAssociatedAccounts value of',
        jobAssociatedAccounts,
        '- for myTitles subscribers, these accounts will be checked on their JobsList.'
      );
    } else {
      console.log(
        `No jobAssociatedAccounts value was found. This could cause the job we're notifying for to not be found even if the user does have the job in their JobsList.`
      );
    }

    let toList: string[] = [];
    if (discrete && recipients) {
      // TODO - pass subscriber IDs (which are LSP user IDs)
      toList = recipients;
    } else {
      if (!event?.administrative) {
        console.log('debug - preparing toList');
        toList = subscribers.filter((item) => item.allTitles === true).map((item) => item.subscriber.subscriberId);

        console.log('debug - first iteration of toList, with only the "allTitles: true" subscribers:', toList);
        const myTitles = subscribers.filter((item) => item.allTitles !== true);

        console.log('debug - list of users with allTitles: false (myTitles users):', myTitles);

        if (myTitles.length > 0) {
          console.log('debug - preparing to check for jobs in subscribed users lists:');

          const apiService = new ApiService();
          await apiService.init();
          await apiService.login();
          // however many accounts the job might possibly be in here,
          // we have to check for them.
          if (jobAssociatedAccounts) {
            console.log(
              'Will check JobsList for following accounts from the jobAssociatedAccounts list:',
              JSON.stringify(jobAssociatedAccounts)
            );
            const acctsToCheck = Object.values(jobAssociatedAccounts);
            console.log('accounts to check', acctsToCheck);
          }

          await apiService.setAccount(body.accountId);

          console.log(
            'debug - before checking each myTitles subscriber JobsList for job',
            body.jobId,
            'in account',
            body.jobAccountId,
            "- the api service's account has been set to",
            body.accountId
          );

          // TODO - consider updating this to set the apiService account to always be jobAssociatedAccount.parentAcct.
          // Might work the best.

          for (const subscriber of myTitles) {
            console.log(
              'debug - checking JobsList of subscriber',
              subscriber.subscriber.subscriberId,
              '- seeing if the job is in their jobslist'
            );

            const hasJobInList = await apiService.getJobList(
              subscriber.subscriber.subscriberId,
              body.jobAccountId as string,
              body.jobId as string,
              body.payload?.jobAssociatedAccounts
            );
            if (hasJobInList) {
              console.log(
                'user',
                subscriber.subscriber.subscriberId,
                'had the job in their JobsList - adding this user to the toList, to receive this notification'
              );
              toList.push(subscriber.subscriber.subscriberId);
            } else {
              console.log(
                'user',
                subscriber.subscriber.subscriberId,
                'did NOT have the job in their JobsList - user will not be added to the toList'
              );
            }
          }
        }
      } else {
        toList = subscribers.map((item) => item.subscriber.subscriberId);
      }
    }

    console.log(
      'Got the following final value for toList, right before sending notifications:',
      JSON.stringify(toList)
    );

    // There is one rare additional case, where we also want to inform a relevant group of stakeholders about one of these events.
    // If a "COMPONENT_PROOF_APPROVED" event happens, we need to notify the stakeholders for that job and part(s).
    // Currently, the above is the only case where a special trigger promise will be added to the `specialTriggers` array.
    const specialTriggers: Promise<any>[] = [];
    if (body.event === 'COMPONENT_PROOF_APPROVED') {
      console.log(
        'Got a COMPONENT_PROOF_APPROVED event. Going to also notify all stakeholders for job',
        body.jobId,
        'and part',
        body.part
      );

      // Determine if we should de-deduplicate cases of what would be informing someone of the same thing twice through two different mediums.
      const dedupeCompletionNotifs = 'dedupeCompletionNotifs' in body ? body.dedupeCompletionNotifs : true;

      console.log(
        '[COMPONENT_PROOF_APPROVED special stakeholder trigger] - Value for dedupeCompletionNotifs (default is true):',
        String(dedupeCompletionNotifs)
      );

      const approveToPrintStakeholderSubs = await this.stakeholderSubscribers.execute(
        StakeholderSubscribersCommand.create({
          stage: 'Preflight2_Signoff',
          jobId: body.jobId || '',
          part: body.part || '',
          organizationId: user.organizationId,
          environmentId: user.environmentId,
        })
      );

      // If dedupeCompletionNotifs is true and any users are on both notification lists -
      // we will filter the 'Approve to Print Complete' notification to keep it from going to these users.
      // These users will only receive the normal informative "COMPONENT_PROOF_APPROVED" notification.

      // Subscribers that should receive this special stakeholder notification
      const approveToPrintStakeholderSubIdList = approveToPrintStakeholderSubs
        .map((item) => item.subscriber.subscriberId)
        .filter(
          dedupeCompletionNotifs
            ? (val) => {
                if (toList.includes(val)) {
                  console.log(
                    '- filtering user ID',
                    val,
                    'out from the users that will receive the stakeholder approve to print complete notification. User will only receive the original "Component Proof Approved" informative notification.'
                  );
                  return false;
                }
                return true;
              }
            : (val) => val
        );

      console.log(
        'in POST /trigger/informative for special stakeholders approve to print case - got the following approve to print stakeholders id list, to send to:',
        JSON.stringify(approveToPrintStakeholderSubIdList)
      );

      // Add the extra 'trigger' we have to run for stakeholder approve to print complete to the specialTriggers list
      specialTriggers.push(
        this.parseEventRequest.execute(
          ParseEventRequestCommand.create({
            userId: user._id,
            environmentId: user.environmentId,
            organizationId: user.organizationId,
            identifier: `${slugify('Approve to Print-complete', {
              lower: true,
              strict: true,
            })}`,
            payload: body.payload || {},
            overrides: {},
            to: approveToPrintStakeholderSubIdList,
          })
        )
      );
    }

    return Promise.all([
      this.parseEventRequest.execute(
        ParseEventRequestCommand.create({
          userId: user._id,
          environmentId: user.environmentId,
          organizationId: user.organizationId,
          identifier: template.triggers[0].identifier,
          payload: body.payload || {},
          overrides: {},
          to: toList,
        })
      ),
      ...specialTriggers,
    ]);
  }

  @ExternalApiAccessible()
  @UseGuards(JwtAuthGuard)
  @Post('/trigger/stakeholder')
  async trackStakeholderEvent(@UserSession() user: IJwtPayload, @Body() body: StakeholderEventTriggerBodyDto) {
    const stage = this.apagoService.stakeholderStages.find((val) => val.value === body.stage);

    if (!stage) throw new NotFoundException(`Stage ${body.stage} not found!`);

    // S1 - "Preflight1_ApplyFix"
    // S2 - "Preflight1_Signoff"
    // S3 - "Preflight2_Signoff"

    try {
      console.log('running POST /trigger/stakeholder for the following input:', JSON.stringify(body));
    } catch (err) {
      console.log('Error in POST /trigger/stakeholder when attempting stringify on the request body:', err);
    }

    // See if the current stage had a prior stage
    const priorStage = this.apagoService.stakeholderStages.find((val) => val.value === body.stage)?.prior;
    const priorStageObj = priorStage
      ? this.apagoService.stakeholderStages.find((val) => val.value === priorStage)
      : undefined;

    if (priorStage) {
      console.log('got the following as the prior stage for the notification:', priorStage);
      if (priorStageObj) {
        console.log(
          'got the following as the prior stage object from the stages object array:',
          JSON.stringify(priorStageObj)
        );
      } else {
        console.log(
          'WARNING: got priorStage as',
          priorStage,
          'but did not find prior stage obj in the stages object array when searched by "value" property.'
        );
      }
    }

    try {
      console.log(' debug - value of payload:', JSON.stringify(body.payload));
    } catch (err) {
      console.log('error while trying to stringify payload for debug:', err, '- continuing on');
    }

    // (We will almost always notify for completion of the prior stakeholder stage, except for a
    // particular case in which we will conditionally post or not post a completion message:
    // If the prior stage was Preflight1_ApplyFix("Resolve Preflight"), we will only post a "Resolve Preflight Complete" message if the payload has an additional flag, "notifyForRpfComplete", with a value of true.
    const notifyForPrior =
      priorStage && priorStage === 'Preflight1_ApplyFix' ? body.payload?.notifyForRpfComplete || false : true;

    console.log(
      'Got value of notifyForPrior as:',
      notifyForPrior,
      `Prior stage, ${priorStage}, will ${!notifyForPrior ? 'not ' : ''}be notified for.`
    );

    const dedupeCompletionNotifs = 'dedupeCompletionNotifs' in body ? body.dedupeCompletionNotifs : true;

    if (notifyForPrior && priorStage) {
      console.log(
        'in POST /trigger/stakeholder - received a post trigger for the stage',
        stage,
        '- subscribers to the previous stage,',
        priorStage,
        ', also need to be notified that it is now complete.'
      );
      console.log(
        'using a value of',
        String(dedupeCompletionNotifs),
        'for dedupeCompletionNotifs (default is true). If true, subscribers won\'t receive both a "prior stage complete" and "next stage needs action" notif. They will only receive one or the other.'
      );
    }

    // TODO -
    // Setting up the stage completed notifications:

    // If stage is S2 or S3, send "completed" notifications. I.e.,
    // Notification to take action for S2 => S1 completed
    // Notification to take action for S3 => S2 completed
    // Is it ALWAYS true that the S2/S3 notifications to take action occur at the SAME time that S1/S2 is completed?

    // Maybe we ensure it is by making sure the LSP API passes a flag telling us that it did just change - i.e, was just now completed. (if that's not duplicate info.)

    const subscribers = await this.stakeholderSubscribers.execute(
      StakeholderSubscribersCommand.create({
        stage: body.stage,
        jobId: body.jobId,
        part: body.part,
        organizationId: user.organizationId,
        environmentId: user.environmentId,
      })
    );

    // Subscribers that should receive the normal stakeholder notification
    const toList = subscribers.map((item) => item.subscriber.subscriberId);

    console.log('in POST /trigger/stakeholder - got the following normal stakeholders toList:', JSON.stringify(toList));

    // If there's a prior stage completed that we need to notify for, then
    // get the list of those subscribed to this particular stage
    const priorStageSubs =
      notifyForPrior && priorStage
        ? await this.stakeholderSubscribers.execute(
            StakeholderSubscribersCommand.create({
              stage: priorStage,
              jobId: body.jobId,
              part: body.part,
              organizationId: user.organizationId,
              environmentId: user.environmentId,
            })
          )
        : undefined;

    // if deduping - filter members of the toList against this.
    // (This prevents those who are subscribed to BOTH stages receiving a "complete" notification;
    // In this setup, the completion of the prior stage is implied when the user receives a notice to perform the next stage's action)
    const priorStageToList = priorStageSubs
      ?.map((item) => item.subscriber.subscriberId)
      .filter((subscriberId) => {
        if (dedupeCompletionNotifs) {
          const isAlreadyOnInitialList = toList.find((id) => id === subscriberId);
          if (isAlreadyOnInitialList) {
            console.log(
              'filtering for duplicate notifications - filtered subscriber id',
              subscriberId,
              'from the prior completion notif list. (Was already on the initial next action notif list)'
            );
            return false;
          }
          return true;
        } else {
          return subscriberId;
        }
      });

    if (priorStageToList) {
      console.log(
        `in POST /trigger/stakeholder - got the following prior stage stakeholders toList - these users will be notified that "${stage.value}" is now complete:`,
        JSON.stringify(priorStageToList)
      );
    }

    // We'll always be running the initial toList request,
    // but, if the prior stage data is defined here - we'll also be running that as part of the request.
    const priorStageCompletionP = priorStageToList
      ? this.parseEventRequest.execute(
          ParseEventRequestCommand.create({
            userId: user._id,
            environmentId: user.environmentId,
            organizationId: user.organizationId,
            // TODO - the identifiers for these two MUST be kept as "<original stakeholder event identifier>-complete"
            // TODO - fix how fragile the identifiers are here - (label?)
            identifier: `${slugify(`${priorStageObj?.label || priorStage}-complete`, {
              lower: true,
              strict: true,
            })}`,
            payload: body.payload || {},
            overrides: {},
            to: priorStageToList,
          })
        )
      : Promise.resolve();

    return Promise.all([
      this.parseEventRequest.execute(
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
      ),
      priorStageCompletionP,
    ]);
    // TODO - make sure that running this as an array of promises doesn't present issues elsewhere in the app.
  }
}
