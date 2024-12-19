const defaultTemplates = {
  TITLE_CREATED: {
    in_app:
      '{{titleName}} was created by {{actorUserName}}\n{{!--%%{--}}\n{{!--{{ISBN13}}--}}\n{{!--{{ISBN10}}--}}\n{{!--{{CustomerReference}}--}}\n{{!--}%%--}}\n',
    email: 'Title {{titleName}} was created by {{actorUserName}}.',
  },
  TITLE_DELETED: {
    in_app: '{{titleName}} was deleted by {{actorUserName}}',
    email: '<span>Title {{titleName}} was deleted by {{actorUserName}}.</span>',
  },
  COMPONENT_CREATED: {
    in_app: '{{titleName}} - {{componentName}} component was created by {{actorUserName}}',
    email: '{{componentName}} component was created by <span>{{actorUserName}}.</span>',
  },
  FILES_UPLOADED: {
    in_app: '{{titleName}} - file(s) uploaded to {{componentName}} component by {{actorUserName}}',
    email: 'File(s) uploaded to {{componentName}} component by {{actorUserName}}.',
  },
  COMPONENT_DELETED: {
    in_app: '{{titleName}} - {{componentName}} component was deleted by {{actorUserName}}',
    email: '{{componentName}} component was deleted by {{actorUserName}}.',
  },
  PAGES_DELETED: {
    in_app: '{{titleName}} - page(s) deleted from {{componentName}} component by {{actorUserName}}',
    email: 'Page(s) deleted from {{componentName}} component <span>by {{actorUserName}}.</span>',
  },
  TITLE_ARCHIVE_RETRIEVAL_REQUESTED: {
    in_app: 'Title archive retrieval was requested by {{actorUserName}}',
    email: 'Title archive retrieval was requested by {{actorUserName}}.',
  },
  TITLE_RETRIEVED_FROM_ARCHIVE: {
    in_app: '{{titleName}} - title successfully retrieved from archive',
    email: 'Title successfully retrieved from archive.',
  },
  TITLE_NOT_FOUND_IN_ARCHIVE: {
    in_app: '{{titleName}} - title could not found in archive',
    email: 'Title could not be found in archive.',
  },
  PREFLIGHT_WARNINGS_ERRORS: {
    in_app: '{{titleName}} - preflight warnings and/or errors have been detected in the {{pfComponentName}} component',
    email: 'Preflight warnings and/or errors have been detected.',
  },
  SPECIFICATIONS_WARNINGS_ERRORS: {
    in_app:
      '{{titleName}} - specification warnings and/or errors have been detected in the {{pfComponentName}} component',
    email: '<span>Specification warnings and/or errors have been detected.</span>',
  },
  TITLE_REVIEW_REQUESTED: {
    in_app: '{{titleName}} - title review requested by {{actorUserName}}',
    email: '<span>Title review requested by {{actorUserName}}.</span>',
  },
  PAGE_PROOFS_APPROVED: {
    in_app: '{{titleName}} - {{componentName}} component page proof(s) approved by {{actorUserName}}',
    email:
      '<span>Page proof(s) approved in {{componentName}} component by {{actorUserName}}.</span><div>Ordinal page position(s) approved: {{pageOrdinals}}</div><div>Number of pages approved: {{pageCount}}</div>',
  },
  PAGE_PROOFS_REJECTED: {
    in_app: '{{titleName}} - {{componentName}} component page proof(s) rejected by {{actorUserName}}',
    email:
      '<span>Page proof(s) rejected in {{componentName}} component by {{actorUserName}}.</span><div>Ordinal page position(s) rejected: {{pageOrdinals}}</div>',
  },
  COMPONENT_PROOF_APPROVED: {
    in_app: '{{titleName}} - {{componentName}} component was approved to print by {{actorUserName}}',
    email: '<span>{{componentName}} c</span>omponent was approved to print by {{actorUserName}}.',
  },
  TITLE_READY_FOR_DELIVERY: {
    in_app: '{{titleName}} - title is ready for delivery',
    email: 'Title is ready for delivery.',
  },
  USER_WAS_CREATED: {
    in_app: 'A user was created by {{actorUserName}} in the {{accountName}} account',
    email: '<span>A user was created by {{actorUserName}} in the {{accountName}} account.</span>',
  },
  USER_WAS_MODIFIED: {
    in_app: 'A user was modified by {{actorUserName}} in the {{accountName}} account',
    email: '<div>A user was modified by {{actorUserName}} in the {{accountName}} account.<br /></div>',
  },
  USER_WAS_DELETED: {
    in_app: 'A user was deleted by {{actorUserName}} in the {{accountName}} account',
    email: '<div>A user was deleted by {{actorUserName}} in the {{accountName}} account.<br /></div>',
  },
  RTO_PROOF_DOWNLOAD_READY: {
    in_app: '[{{accountName}}] RTO proofs are now ready for download',
    email: '[{{accountName}}] RTO proofs are now ready for download',
  },
  COMPONENT_CHECKED_IN: {
    in_app: '{{titleName}} - {{componentName}} component checked in by {{actorUserName}}',
    email: '{{componentName}} component checked in by {{actorUserName}}.',
  },
  COMPONENT_CHECKOUT_COMPLETE: {
    in_app: '{{titleName}} - {{componentName}} component checkout complete by {{actorUserName}}',
    email: '{{componentName}} component checkout complete by {{actorUserName}}',
  },
  TITLE_CHECKOUT_COMPLETE: {
    in_app: '{{titleName}} - Title checkout complete. This title was checked out by {{actorUserName}}',
    email: '<div><span>Title checkout complete. This title was checked out by {{actorUserName}}.</span></div>',
  },
  Preflight1_ApplyFix: {
    in_app:
      '{{titleName}} - {{componentName}} has Preflight issues that need to be resolved (this could include rejected pages) S1',
    email:
      '{{titleName}} - {{componentName}} component has Preflight issues that need to be resolved (this could include rejected pages).<div><span>Click the link below to go to the title, review the preflight issues, and resolve them.</span></div><div><br /></div><div>S1</div>',
  },
  Preflight1_Signoff: {
    in_app: '{{titleName}} - {{componentName}} component page proofs are ready to be reviewed S2',
    email:
      '{{titleName}} - {{componentName}} component page proofs are ready to be reviewed<div><br /></div><div>S2</div>',
  },
  Preflight2_Signoff: {
    in_app: '{{titleName}} - {{componentName}} component is ready to be approved to print. S3',
    email: '{{componentName}} component is ready to be approved to print.<div><span>S3</span></div>',
  },
  'resolve-preflight-complete': {
    in_app: '{{titleName}} - {{componentName}} - all preflight issues have been resolved by {{lastActorName}} S1a',
    email: 'All preflight issues have been resolved by {{lastActorName}}<div>S1a</div>',
  },
  'approve-content-complete': {
    in_app: '{{titleName}} - {{componentName}} page proof review has been completed by {{lastActorName}} S2a',
    email: '{{componentName}} page proof review has been completed by {{lastActorName}}<div>S2a</div>',
  },
  'approve-to-print-complete': {
    in_app: '{{titleName}} - {{componentName}} has been approved to print by {{lastActorName}} S3a',
    email: ' {{componentName}} has been approved to print by {{lastActorName}}<div>S3a</div>',
  },
};

export default defaultTemplates;
