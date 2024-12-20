import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { OrganizationEntity, UserRepository } from '@novu/dal';
import * as bcrypt from 'bcrypt';
import { SignUpOriginEnum } from '@novu/shared';
import { AnalyticsService } from '@novu/application-generic';

import { AuthService } from '../../services/auth.service';
import { UserRegisterCommand } from './user-register.command';
import { normalizeEmail } from '../../../shared/helpers/email-normalization.service';
import { ApiException } from '../../../shared/exceptions/api.exception';
import { CreateOrganization } from '../../../organization/usecases/create-organization/create-organization.usecase';
import { CreateOrganizationCommand } from '../../../organization/usecases/create-organization/create-organization.command';
import { createHash } from '../../../shared/helpers/hmac.service';

@Injectable()
export class UserRegister {
  constructor(
    private authService: AuthService,
    private userRepository: UserRepository,
    private createOrganizationUsecase: CreateOrganization,
    private analyticsService: AnalyticsService
  ) {}

  async execute(command: UserRegisterCommand) {
    const email = normalizeEmail(command.email);

    // We're going to ALWAYS reject registration attempts,
    // unless the registration attempt  meets 2 criteria:
    // 1. email is on the email whitelist
    // 2. is in possession of the correct organization key

    // if (process.env.DISABLE_USER_REGISTRATION === 'true') {

    // If a master key override is passed and an environment variable is defined,
    const masterKey = command.overrideKey || undefined;

    // One more check - the user passing this key MUST be an email on the email whitelist.
    const emailWhitelist = process.env.EMAIL_WHITELIST;

    // This is expected to be a comma-separated list of emails.
    const whitelistedEmails = emailWhitelist?.split(',');

    if (whitelistedEmails) {
      console.log(
        'Got email whitelist of',
        whitelistedEmails?.length,
        'emails:',
        whitelistedEmails?.map((_email) => console.log('-', _email))
      );
    }

    const emailCanRegister = whitelistedEmails?.includes(email);

    if (emailCanRegister && masterKey && process.env.API_OVERRIDE_KEY && process.env.API_OVERRIDE_KEY === masterKey) {
      console.log(
        '[WARN] - Request contained valid override key AND email is on email whitelist. Proceeding to execute user register command.'
      );
    } else {
      if (emailCanRegister) {
        console.log('The email used is whitelisted, but the override key was missing or bad. Rejecting registration.');
      } else {
        console.log('BAD registration attempt with email:', email);
        throw new UnauthorizedException('Unauthorized');
      }
      throw new ApiException('Account creation is disabled and/or this attempt is unauthorized.');
    }
    // }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new ApiException('User already exists');

    const passwordHash = await bcrypt.hash(command.password, 10);
    const user = await this.userRepository.create({
      email,
      firstName: command.firstName.toLowerCase(),
      lastName: command.lastName?.toLowerCase(),
      password: passwordHash,
    });

    if (process.env.INTERCOM_IDENTITY_VERIFICATION_SECRET_KEY) {
      const intercomSecretKey = process.env.INTERCOM_IDENTITY_VERIFICATION_SECRET_KEY as string;
      const userHashForIntercom = createHash(intercomSecretKey, user._id);
      await this.userRepository.update(
        { _id: user._id },
        {
          $set: {
            'servicesHashes.intercom': userHashForIntercom,
          },
        }
      );
    }

    let organization: OrganizationEntity;
    if (command.organizationName) {
      organization = await this.createOrganizationUsecase.execute(
        CreateOrganizationCommand.create({
          name: command.organizationName,
          userId: user._id,
        })
      );
    }

    this.analyticsService.upsertUser(user, user._id);

    this.analyticsService.track('[Authentication] - Signup', user._id, {
      loginType: 'email',
      origin: command.origin || SignUpOriginEnum.WEB,
    });

    return {
      user: await this.userRepository.findById(user._id),
      token: await this.authService.generateUserToken(user),
    };
  }
}
