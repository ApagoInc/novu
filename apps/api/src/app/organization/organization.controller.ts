import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  forwardRef,
} from '@nestjs/common';
import { OrganizationEntity } from '@novu/dal';
import { IJwtPayload, ITemplateVariable, MemberRoleEnum, StepTypeEnum } from '@novu/shared';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/framework/roles.decorator';
import { UserSession } from '../shared/framework/user.decorator';
import { CreateOrganizationDto } from './dtos/create-organization.dto';
import { CreateOrganizationCommand } from './usecases/create-organization/create-organization.command';
import { CreateOrganization } from './usecases/create-organization/create-organization.usecase';
import { RemoveMember } from './usecases/membership/remove-member/remove-member.usecase';
import { RemoveMemberCommand } from './usecases/membership/remove-member/remove-member.command';
import { JwtAuthGuard } from '../auth/framework/auth.guard';
import { GetMembersCommand } from './usecases/membership/get-members/get-members.command';
import { GetMembers } from './usecases/membership/get-members/get-members.usecase';
import { ChangeMemberRoleCommand } from './usecases/membership/change-member-role/change-member-role.command';
import { ChangeMemberRole } from './usecases/membership/change-member-role/change-member-role.usecase';
import { UpdateBrandingDetailsCommand } from './usecases/update-branding-details/update-branding-details.command';
import { UpdateBrandingDetails } from './usecases/update-branding-details/update-branding-details.usecase';
import { GetOrganizationsCommand } from './usecases/get-organizations/get-organizations.command';
import { GetOrganizations } from './usecases/get-organizations/get-organizations.usecase';
import { IGetOrganizationsDto } from './dtos/get-organizations.dto';
import { GetMyOrganization } from './usecases/get-my-organization/get-my-organization.usecase';
import { GetMyOrganizationCommand } from './usecases/get-my-organization/get-my-organization.command';
import { IGetMyOrganizationDto } from './dtos/get-my-organization.dto';
import { RenameOrganizationCommand } from './usecases/rename-organization/rename-organization-command';
import { RenameOrganization } from './usecases/rename-organization/rename-organization.usecase';
import { RenameOrganizationDto } from './dtos/rename-organization.dto';
import { UpdateBrandingDetailsDto } from './dtos/update-branding-details.dto';
import { UpdateMemberRolesDto } from './dtos/update-member-roles.dto';
import {
  CreateNotificationTemplate,
  CreateNotificationTemplateCommand,
  NotificationStep,
} from '../workflows/usecases/create-notification-template';
import { GetNotificationGroups } from '../notification-groups/usecases/get-notification-groups/get-notification-groups.usecase';
import { GetNotificationGroupsCommand } from '../notification-groups/usecases/get-notification-groups/get-notification-groups.command';
import { ApagoService } from '../apago/apago.service';

@Controller('/organizations')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('Organizations')
@ApiExcludeController()
export class OrganizationController {
  constructor(
    private createOrganizationUsecase: CreateOrganization,
    private getMembers: GetMembers,
    private removeMemberUsecase: RemoveMember,
    private changeMemberRoleUsecase: ChangeMemberRole,
    private updateBrandingDetailsUsecase: UpdateBrandingDetails,
    private getOrganizationsUsecase: GetOrganizations,
    private getMyOrganizationUsecase: GetMyOrganization,
    private renameOrganizationUsecase: RenameOrganization,
    private createWorkflowUsecase: CreateNotificationTemplate,
    private getNotificationGroupsUsecase: GetNotificationGroups,
    private apagoService: ApagoService
  ) {}

  @Post('/')
  async createOrganization(
    @UserSession() user: IJwtPayload,
    @Body() body: CreateOrganizationDto
  ): Promise<OrganizationEntity> {
    const command = CreateOrganizationCommand.create({
      userId: user._id,
      logo: body.logo,
      name: body.name,
    });

    return await this.createOrganizationUsecase.execute(command);
  }

  @Post('/lakeside')
  async createOrganizationReady(
    @UserSession() user: IJwtPayload,
    @Body() body: CreateOrganizationDto
  ): Promise<OrganizationEntity> {
    const wData = [
      ...this.apagoService.informativeEvents.flatMap((arr) =>
        arr.events.map((val) => ({ name: val.label, variables: val.variables, critical: false }))
      ),
      ...this.apagoService.stakeholderStages.map((val) => ({
        name: val.label,
        variables: val.variables,
        critical: true,
      })),
    ];

    const command = CreateOrganizationCommand.create({
      userId: user._id,
      logo: body.logo,
      name: body.name,
    });

    const organization: any = await this.createOrganizationUsecase.execute(command);

    const groups = await this.getNotificationGroupsUsecase.execute(
      GetNotificationGroupsCommand.create({
        organizationId: organization._id,
        userId: user._id,
        environmentId: organization.envs[0] as string,
      })
    );

    const getContent = (name: string, variables?: ITemplateVariable[]) => {
      if (!variables) return name;
      let content = `<!-- Variable list for ${name}\n`;

      for (const variable of variables) {
        content += `{{${variable.name}}}\n`;
      }

      return content + '-->';
    };

    for (const event of wData) {
      await this.createWorkflowUsecase.execute(
        CreateNotificationTemplateCommand.create({
          organizationId: organization._id,
          userId: user._id,
          environmentId: organization.envs[0],
          name: event.name,
          tags: [],
          description: event.name,
          steps: [
            {
              name: 'In-App',
              active: true,
              template: {
                content: getContent(event.name, event.variables),
                type: StepTypeEnum.IN_APP,
                variables: event.variables,
              },
            },
            {
              name: 'Email',
              active: true,
              template: {
                senderName: 'sender',
                subject: 'subject',
                content: [],
                type: StepTypeEnum.EMAIL,
                variables: event.variables,
              },
            },
          ],
          notificationGroupId: groups[0]._id,
          active: true,
          draft: false,
          critical: event.critical,
          preferenceSettings: { email: true, in_app: true },
        })
      );
    }

    return organization;
  }

  @Get('/')
  async getOrganizations(@UserSession() user: IJwtPayload): Promise<IGetOrganizationsDto> {
    const command = GetOrganizationsCommand.create({
      userId: user._id,
    });

    return await this.getOrganizationsUsecase.execute(command);
  }

  @Get('/me')
  async getMyOrganization(@UserSession() user: IJwtPayload): Promise<IGetMyOrganizationDto> {
    const command = GetMyOrganizationCommand.create({
      userId: user._id,
      id: user.organizationId,
    });

    return await this.getMyOrganizationUsecase.execute(command);
  }

  @Delete('/members/:memberId')
  @Roles(MemberRoleEnum.ADMIN)
  async removeMember(@UserSession() user: IJwtPayload, @Param('memberId') memberId: string) {
    return await this.removeMemberUsecase.execute(
      RemoveMemberCommand.create({
        userId: user._id,
        organizationId: user.organizationId,
        memberId,
      })
    );
  }

  @Put('/members/:memberId/roles')
  @Roles(MemberRoleEnum.ADMIN)
  async updateMemberRoles(
    @UserSession() user: IJwtPayload,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberRolesDto
  ) {
    return await this.changeMemberRoleUsecase.execute(
      ChangeMemberRoleCommand.create({
        memberId,
        role: body.role,
        userId: user._id,
        organizationId: user.organizationId,
      })
    );
  }

  @Get('/members')
  async getMember(@UserSession() user: IJwtPayload) {
    return await this.getMembers.execute(
      GetMembersCommand.create({
        user,
        userId: user._id,
        organizationId: user.organizationId,
      })
    );
  }

  @Post('/members/invite')
  @Roles(MemberRoleEnum.ADMIN)
  async inviteMember(@UserSession() user: IJwtPayload) {
    return await this.getMembers.execute(
      GetMembersCommand.create({
        user,
        userId: user._id,
        organizationId: user.organizationId,
      })
    );
  }

  @Put('/branding')
  async updateBrandingDetails(@UserSession() user: IJwtPayload, @Body() body: UpdateBrandingDetailsDto) {
    return await this.updateBrandingDetailsUsecase.execute(
      UpdateBrandingDetailsCommand.create({
        logo: body.logo,
        color: body.color,
        userId: user._id,
        id: user.organizationId,
        fontColor: body.fontColor,
        fontFamily: body.fontFamily,
        contentBackground: body.contentBackground,
      })
    );
  }

  @Patch('/')
  @Roles(MemberRoleEnum.ADMIN)
  async renameOrganization(@UserSession() user: IJwtPayload, @Body() body: RenameOrganizationDto) {
    return await this.renameOrganizationUsecase.execute(
      RenameOrganizationCommand.create({
        name: body.name,
        userId: user._id,
        id: user.organizationId,
      })
    );
  }
}
