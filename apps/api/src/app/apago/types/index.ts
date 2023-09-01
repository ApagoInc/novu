import { ITemplateVariable } from '../../layouts/types';

export type StakeholderStage = 'Preflight1_ApplyFix' | 'Preflight1_Signoff' | 'Preflight2_Signoff';

export type InformativeEvent =
  | 'TITLE_CREATED'
  | 'FILES_UPLOADED'
  | 'TITLE_APPROVED_TO_PRINT'
  | 'TITLE_RETRIEVED_FROM_ARCHIVE'
  | 'PREFLIGHT_WARNING_ERRORS'
  | 'SPECIFICATIONS_WARNING_ERRORS'
  | 'CONTENT_APPROVAL_REQUESTED'
  | 'CONTENT_APPROVAL_APPROVED'
  | 'APPROVE_TO_PRINT_REQUESTED'
  | 'USER_WAS_CREATED'
  | 'USER_WAS_MODIFIED'
  | 'USER_WAS_DELETED';

export type AdministrativeEvent = 'USER_WAS_CREATED' | 'USER_WAS_MODIFIED' | 'USER_WAS_DELETED';

export type ApiClientData =
  | { type: 'check_permission'; userId: string; accountId: string; permissions: Array<string> }
  | {
      type: 'edit_stakeholder';
      jobId: string;
      userId: string;
      stakeholderId: string;
      accountId: string;
      permissions: Array<string>;
      stage: StakeholderStage;
    };

export type User = { Email: string; UserID: string; FirstName: string; LastName: string };

export type Stage = { stage: string; parts: Array<string> };

export type InformativeEvents = Array<{
  title: string;
  events: Array<{ label: string; value: string; no_parts?: boolean; variables?: ITemplateVariable[], content?: string }>;
}>;

export type StakeholderStages = Array<{ label: string; value: string; variables?: ITemplateVariable[] }>;
