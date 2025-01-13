const defaultTemplates = {
  TITLE_CREATED: {
    in_app:
      '{{titleName}} was created by {{actorUserName}}\n{{!--%%{--}}\n{{!--{{ISBN13}}--}}\n{{!--{{ISBN10}}--}}\n{{!--{{CustomerReference}}--}}\n{{!--}%%--}}\n',
    email: {
      content: 'Title {{titleName}} was created by {{actorUserName}}.',
      subject: '',
    },
  },
  TITLE_DELETED: {
    in_app: '{{titleName}} was deleted by {{actorUserName}}',
    email: {
      content: '<span>Title {{titleName}} was deleted by {{actorUserName}}.</span>',
      subject: '',
    },
  },
  COMPONENT_CREATED: {
    in_app: '{{titleName}} - {{componentName}} component was created by {{actorUserName}}',
    email: {
      content: '{{componentName}} component was created by <span>{{actorUserName}}.</span>',
      subject: '',
    },
  },
  FILES_UPLOADED: {
    in_app: '{{titleName}} - file(s) uploaded to {{componentName}} component by {{actorUserName}}',
    email: {
      content: 'File(s) uploaded to {{componentName}} component by {{actorUserName}}.',
      subject: '',
    },
  },
  COMPONENT_DELETED: {
    in_app: '{{titleName}} - {{componentName}} component was deleted by {{actorUserName}}',
    email: {
      content: '{{componentName}} component was deleted by {{actorUserName}}.',
      subject: '',
    },
  },
  PAGES_DELETED: {
    in_app: '{{titleName}} - page(s) deleted from {{componentName}} component by {{actorUserName}}',
    email: {
      content: 'Page(s) deleted from {{componentName}} component <span>by {{actorUserName}}.</span>',
      subject: '',
    },
  },
  TITLE_ARCHIVE_RETRIEVAL_REQUESTED: {
    in_app: 'Title archive retrieval was requested by {{actorUserName}}',
    email: {
      content: 'Title archive retrieval was requested by {{actorUserName}}.',
      subject: '',
    },
  },
  TITLE_RETRIEVED_FROM_ARCHIVE: {
    in_app: '{{titleName}} - title successfully retrieved from archive',
    email: {
      content: 'Title successfully retrieved from archive.',
      subject: '',
    },
  },
  TITLE_NOT_FOUND_IN_ARCHIVE: {
    in_app: '{{titleName}} - title could not found in archive',
    email: {
      content: 'Title could not be found in archive.',
      subject: '',
    },
  },
  PREFLIGHT_WARNINGS_ERRORS: {
    in_app: '{{titleName}} - preflight warnings and/or errors have been detected in the {{pfComponentName}} component',
    email: {
      content: 'Preflight warnings and/or errors have been detected.',
      subject: '',
    },
  },
  SPECIFICATIONS_WARNINGS_ERRORS: {
    in_app:
      '{{titleName}} - specification warnings and/or errors have been detected in the {{pfComponentName}} component',
    email: {
      content: '<span>Specification warnings and/or errors have been detected.</span>',
      subject: '',
    },
  },
  TITLE_REVIEW_REQUESTED: {
    in_app: '{{titleName}} - title review requested by {{actorUserName}}',
    email: {
      content: '<span>Title review requested by {{actorUserName}}.</span>',
      subject: '',
    },
  },
  PAGE_PROOFS_APPROVED: {
    in_app: '{{titleName}} - {{componentName}} component page proof(s) approved by {{actorUserName}}',
    email: {
      content:
        '<span>Page proof(s) approved in {{componentName}} component by {{actorUserName}}.</span><div>Ordinal page position(s) approved: {{pageOrdinals}}</div><div>Number of pages approved: {{pageCount}}</div>',
      subject: '',
    },
  },
  PAGE_PROOFS_REJECTED: {
    in_app: '{{titleName}} - {{componentName}} component page proof(s) rejected by {{actorUserName}}',
    email: {
      content:
        '<span>Page proof(s) rejected in {{componentName}} component by {{actorUserName}}.</span><div>Ordinal page position(s) rejected: {{pageOrdinals}}</div>',
      subject: '',
    },
  },
  COMPONENT_PROOF_APPROVED: {
    in_app: '{{titleName}} - {{componentName}} component was approved to print by {{actorUserName}}',
    email: {
      content: '<span>{{componentName}} c</span>omponent was approved to print by {{actorUserName}}.',
      subject: '',
    },
  },
  TITLE_READY_FOR_DELIVERY: {
    in_app: '{{titleName}} - title is ready for delivery',
    email: {
      content: 'Title is ready for delivery.',
      subject: '',
    },
  },
  USER_WAS_CREATED: {
    in_app: 'A user was created by {{actorUserName}} in the {{accountName}} account',
    email: {
      content: '<span>A user was created by {{actorUserName}} in the {{accountName}} account.</span>',
      subject: '',
    },
  },
  USER_WAS_MODIFIED: {
    in_app: 'A user was modified by {{actorUserName}} in the {{accountName}} account',
    email: {
      content: '<div>A user was modified by {{actorUserName}} in the {{accountName}} account.<br /></div>',
      subject: '',
    },
  },
  USER_WAS_DELETED: {
    in_app: 'A user was deleted by {{actorUserName}} in the {{accountName}} account',
    email: {
      content: '<div>A user was deleted by {{actorUserName}} in the {{accountName}} account.<br /></div>',
      subject: '',
    },
  },
  RTO_PROOF_DOWNLOAD_READY: {
    in_app: '[{{accountName}}] RTO proofs are now ready for download',
    email: {
      content: '[{{accountName}}] RTO proofs are now ready for download',
      subject: '',
    },
  },
  COMPONENT_CHECKED_IN: {
    in_app: '{{titleName}} - {{componentName}} component checked in by {{actorUserName}}',
    email: {
      content: '{{componentName}} component checked in by {{actorUserName}}.',
      subject: '',
    },
  },
  COMPONENT_CHECKOUT_COMPLETE: {
    in_app: '{{titleName}} - {{componentName}} component checkout complete by {{actorUserName}}',
    email: {
      content: '{{componentName}} component checkout complete by {{actorUserName}}',
      subject: '',
    },
  },
  TITLE_CHECKOUT_COMPLETE: {
    in_app: '{{titleName}} - Title checkout complete. This title was checked out by {{actorUserName}}',
    email: {
      content: '<div><span>Title checkout complete. This title was checked out by {{actorUserName}}.</span></div>',
      subject: '',
    },
  },
  Preflight1_ApplyFix: {
    in_app:
      '{{titleName}} - {{componentName}} has Preflight issues that need to be resolved (this could include rejected pages) S1',
    email: {
      content:
        '{{titleName}} - {{componentName}} component has Preflight issues that need to be resolved (this could include rejected pages).<div><span>Click the link below to go to the title, review the preflight issues, and resolve them.</span></div><div><br /></div><div>S1</div>',
      subject: '',
    },
  },
  Preflight1_Signoff: {
    in_app: '{{titleName}} - {{componentName}} component page proofs are ready to be reviewed S2',
    email: {
      content:
        '{{titleName}} - {{componentName}} component page proofs are ready to be reviewed<div><br /></div><div>S2</div>',
      subject: '',
    },
  },
  Preflight2_Signoff: {
    in_app: '{{titleName}} - {{componentName}} component is ready to be approved to print. S3',
    email: {
      content: '{{componentName}} component is ready to be approved to print.<div><span>S3</span></div>',
      subject: '',
    },
  },
  'resolve-preflight-complete': {
    in_app: '{{titleName}} - {{componentName}} - all preflight issues have been resolved by {{lastActorName}} S1a',
    email: {
      content: 'All preflight issues have been resolved by {{lastActorName}}<div>S1a</div>',
      subject: '',
    },
  },
  'approve-content-complete': {
    in_app: '{{titleName}} - {{componentName}} page proof review has been completed by {{lastActorName}} S2a',
    email: {
      content: '{{componentName}} page proof review has been completed by {{lastActorName}}<div>S2a</div>',
      subject: '',
    },
  },
  'approve-to-print-complete': {
    // Note: these use 'actorUserName' since they piggy-back off of the Component Proof Approved event
    in_app: '{{titleName}} - {{componentName}} has been approved to print by {{actorUserName}} S3a',
    email: {
      content: ' {{componentName}} has been approved to print by {{actorUserName}}<div>S3a</div>',
      subject: '',
    },
  },
};

export default defaultTemplates;
