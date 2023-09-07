export type ApiClientData =
  | { type: 'check_permission'; userId: string; accountId: string; permissions: Array<string> }
  | {
      type: 'edit_stakeholder';
      jobId: string;
      userId: string;
      stakeholderId: string;
      accountId: string;
      permissions: Array<string>;
      stage: string;
    };

export type User = { Email: string; UserID: string; FirstName: string; LastName: string };
