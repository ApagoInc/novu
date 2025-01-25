const defaultTemplates = {
  TITLE_CREATED: {
    in_app:
      '{{titleName}} was created by {{actorUserName}}\n{{!--%%{--}}\n{{!--{{ISBN13}}--}}\n{{!--{{ISBN10}}--}}\n{{!--{{CustomerReference}}--}}\n{{!--}%%--}}\n',
    email: {
      content: 'Title {{titleName}} was created by {{actorUserName}}.',
      subject: 'Title Created - {{ISBN13}} {{CustomerReference}}, {{titleName}}',
    },
  },
  TITLE_DELETED: {
    in_app: '{{titleName}} was deleted by {{actorUserName}}',
    email: {
      content: '<span>Title {{titleName}} was deleted by {{actorUserName}}.</span>',
      subject: 'Title Deleted - {{ISBN13}} {{CustomerReference}}, {{titleName}}',
    },
  },
  COMPONENT_CREATED: {
    in_app: '{{titleName}} - {{componentName}} component was created by {{actorUserName}}',
    email: {
      content: '{{componentName}} component was created by <span>{{actorUserName}}.</span>',
      subject: 'Component Created {{componentName}} - {{ISBN13}} {{CustomerReference}}, {{titleName}}',
    },
  },
  FILES_UPLOADED: {
    in_app: '{{titleName}} - file(s) uploaded to {{componentName}} component by {{actorUserName}}',
    email: {
      content: 'File(s) uploaded to {{componentName}} component by {{actorUserName}}.',
      subject: 'File(s) Uploaded - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  COMPONENT_DELETED: {
    in_app: '{{titleName}} - {{componentName}} component was deleted by {{actorUserName}}',
    email: {
      content: '{{componentName}} component was deleted by {{actorUserName}}.',
      subject: 'Component Deleted {{componentName}} - {{ISBN13}} {{CustomerReference}}, {{titleName}}',
    },
  },
  PAGES_DELETED: {
    in_app: '{{titleName}} - page(s) deleted from {{componentName}} component by {{actorUserName}}',
    email: {
      content: 'Page(s) deleted from {{componentName}} component <span>by {{actorUserName}}.</span>',
      subject: 'Page(s) Deleted - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  TITLE_ARCHIVE_RETRIEVAL_REQUESTED: {
    in_app: 'Title archive retrieval was requested by {{actorUserName}}',
    email: {
      content: 'Title archive retrieval was requested by {{actorUserName}}.',
      subject: 'Title Archive Retrieval Requested - {{ISBN13}} {{CustomerReference}}',
    },
  },
  TITLE_RETRIEVED_FROM_ARCHIVE: {
    in_app: '{{titleName}} - title successfully retrieved from archive',
    email: {
      content: 'Title successfully retrieved from archive.',
      subject: 'Title Retrieved From Archive - {{ISBN13}} {{CustomerReference}}',
    },
  },
  TITLE_NOT_FOUND_IN_ARCHIVE: {
    in_app: '{{titleName}} - title could not found in archive',
    email: {
      content: 'Title could not be found in archive.',
      subject: 'Title Not Found In Archive - {{ISBN13}} {{CustomerReference}}',
    },
  },
  PREFLIGHT_WARNINGS_ERRORS: {
    in_app: '{{titleName}} - preflight warnings and/or errors have been detected in the {{pfComponentName}} component',
    email: {
      content: 'Preflight warnings and/or errors have been detected.',
      subject: 'Preflight Warnings/Errors - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{pfComponentName}}',
    },
  },
  SPECIFICATIONS_WARNINGS_ERRORS: {
    in_app:
      '{{titleName}} - specification warnings and/or errors have been detected in the {{pfComponentName}} component',
    email: {
      content: '<span>Specification warnings and/or errors have been detected.</span>',
      subject: 'Specification Warnings/Errors - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{pfComponentName}}',
    },
  },
  TITLE_REVIEW_REQUESTED: {
    in_app: '{{titleName}} - title review requested by {{actorUserName}}',
    email: {
      content: '<span>Title review requested by {{actorUserName}}.</span>',
      subject: 'Title Review Requested - {{ISBN13}} {{CustomerReference}}, {{titleName}}',
    },
  },
  PAGE_PROOFS_APPROVED: {
    in_app: '{{titleName}} - {{componentName}} component page proof(s) approved by {{actorUserName}}',
    email: {
      content:
        '<span>Page proof(s) approved in {{componentName}} component by {{actorUserName}}.</span><div>Ordinal page position(s) approved: {{pageOrdinals}}</div><div>Number of pages approved: {{pageCount}}</div>',
      subject: 'Page Proof(s) Approved - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  PAGE_PROOFS_REJECTED: {
    in_app: '{{titleName}} - {{componentName}} component page proof(s) rejected by {{actorUserName}}',
    email: {
      content:
        '<span>Page proof(s) rejected in {{componentName}} component by {{actorUserName}}.</span><div>Ordinal page position(s) rejected: {{pageOrdinals}}</div>',
      subject: 'Page Proof(s) Rejected - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  COMPONENT_PROOF_APPROVED: {
    in_app: '{{titleName}} - {{componentName}} component was approved to print by {{actorUserName}}',
    email: {
      content: '<span>{{componentName}} c</span>omponent was approved to print by {{actorUserName}}.',
      subject: 'Approved to Print - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  TITLE_READY_FOR_DELIVERY: {
    in_app: '{{titleName}} - title is ready for delivery',
    email: {
      content: 'Title is ready for delivery.',
      subject: 'Title Ready for Delivery - {{ISBN13}} {{CustomerReference}}, {{titleName}}',
    },
  },
  USER_WAS_CREATED: {
    in_app: 'A user was created by {{actorUserName}} in the {{accountName}} account',
    email: {
      content: '<span>A user was created by {{actorUserName}} in the {{accountName}} account.</span>',
      subject: 'User Was Created - {{accountName}}',
    },
  },
  USER_WAS_MODIFIED: {
    in_app: 'A user was modified by {{actorUserName}} in the {{accountName}} account',
    email: {
      content: '<div>A user was modified by {{actorUserName}} in the {{accountName}} account.<br /></div>',
      subject: 'User Was Modified - {{accountName}}',
    },
  },
  USER_WAS_DELETED: {
    in_app: 'A user was deleted by {{actorUserName}} in the {{accountName}} account',
    email: {
      content: '<div>A user was deleted by {{actorUserName}} in the {{accountName}} account.<br /></div>',
      subject: 'User Was Deleted - {{accountName}}',
    },
  },
  RTO_PROOF_DOWNLOAD_READY: {
    in_app: '[{{accountName}}] {{ISBN13}} {{CustomerReference}}, {{titleName}} - RTO proofs are now ready for download',
    email: {
      content:
        '[{{accountName}}] {{ISBN13}} {{CustomerReference}}, {{titleName}} - RTO proofs are now ready for download',
      subject:
        '[{{accountName}}] {{ISBN13}} {{CustomerReference}}, {{titleName}} - RTO proofs are now ready for download',
    },
  },
  COMPONENT_CHECKED_IN: {
    in_app: '{{titleName}} - {{componentName}} component checked in by {{actorUserName}}',
    email: {
      content: '{{componentName}} component checked in by {{actorUserName}}.',
      subject: 'Component Checked In - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  COMPONENT_CHECKOUT_COMPLETE: {
    in_app: '{{titleName}} - {{componentName}} component checkout complete by {{actorUserName}}',
    email: {
      content: '{{componentName}} component checkout complete by {{actorUserName}}',
      subject: 'Component Checkout Complete - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  TITLE_CHECKOUT_COMPLETE: {
    in_app: '{{titleName}} - Title checkout complete. This title was checked out by {{actorUserName}}',
    email: {
      content: '<div><span>Title checkout complete. This title was checked out by {{actorUserName}}.</span></div>',
      subject: 'Title Checkout Complete - {{ISBN13}} {{CustomerReference}}, {{titleName}}',
    },
  },
  Preflight1_ApplyFix: {
    in_app:
      '{{titleName}} - {{componentName}} has Preflight issues that need to be resolved (this could include rejected pages) S1',
    email: {
      content:
        '{{titleName}} - {{componentName}} component has Preflight issues that need to be resolved (this could include rejected pages).<div><span>Click the link below to go to the title, review the preflight issues, and resolve them.</span></div><div><br /></div><div>S1</div>',
      subject: 'Preflight Issues Found - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  Preflight1_Signoff: {
    in_app: '{{titleName}} - {{componentName}} component page proofs are ready to be reviewed S2',
    email: {
      content:
        '{{titleName}} - {{componentName}} component page proofs are ready to be reviewed<div><br /></div><div>S2</div>',
      subject: 'Proofs Ready For Review - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  Preflight2_Signoff: {
    in_app: '{{titleName}} - {{componentName}} component is ready to be approved to print. S3',
    email: {
      content: '{{componentName}} component is ready to be approved to print.<div><span>S3</span></div>',
      subject: 'Approve to Print - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  'resolve-preflight-complete': {
    in_app: '{{titleName}} - {{componentName}} - all preflight issues have been resolved by {{lastActorName}} S1a',
    email: {
      content: 'All preflight issues have been resolved by {{lastActorName}}<div>S1a</div>',
      subject:
        'Preflight Issues Have Been Resolved - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  'approve-content-complete': {
    in_app: '{{titleName}} - {{componentName}} page proof review has been completed by {{lastActorName}} S2a',
    email: {
      content: '{{componentName}} page proof review has been completed by {{lastActorName}}<div>S2a</div>',
      subject: 'Proof Review Completed - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
  'approve-to-print-complete': {
    in_app: '{{titleName}} - {{componentName}} has been approved to print by {{actorUserName}} S3a',
    email: {
      content: '{{componentName}} has been approved to print by {{actorUserName}}<div>S3a</div>',
      subject: 'Approve To Print Complete - {{ISBN13}} {{CustomerReference}}, {{titleName}}, {{componentName}}',
    },
  },
};

export default defaultTemplates;
