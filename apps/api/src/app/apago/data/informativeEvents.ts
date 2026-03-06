import { DigestUnitEnum } from '@novu/shared';
import { backoffFrequentDigest, normalDigest } from './digests';

const informativeEvents = [
  {
    title: 'Title Events',
    events: [
      {
        label: 'Title Created',
        value: 'TITLE_CREATED',
      },
      {
        label: 'Title Deleted',
        value: 'TITLE_DELETED',
      },
      {
        label: 'Component Created',
        value: 'COMPONENT_CREATED',
        has_parts: true,
        digest: backoffFrequentDigest({
          digestAmount: 10,
          digestUnit: DigestUnitEnum.SECONDS,
          backoffAmount: 5,
          backoffUnit: DigestUnitEnum.MINUTES,
        }),
      },
      {
        label: 'File(s) Uploaded',
        value: 'FILES_UPLOADED',
        has_parts: true,
        digest: normalDigest({
          digestAmount: 30,
          digestUnit: DigestUnitEnum.SECONDS,
        }),
      },
      {
        label: 'Component Deleted',
        value: 'COMPONENT_DELETED',
        has_parts: true,
      },
      {
        label: 'Page(s) Deleted',
        value: 'PAGES_DELETED',
        has_parts: true,
        digest: backoffFrequentDigest({
          digestAmount: 5,
          digestUnit: DigestUnitEnum.MINUTES,
          backoffAmount: 5,
          backoffUnit: DigestUnitEnum.MINUTES,
        }),
      },
      {
        label: 'Title Archive Retrieval Requested',
        value: 'TITLE_ARCHIVE_RETRIEVAL_REQUESTED',
      },
      {
        label: 'Title Retrieved From Archive',
        value: 'TITLE_RETRIEVED_FROM_ARCHIVE',
      },
      {
        label: 'Title Not Found In Archive',
        value: 'TITLE_NOT_FOUND_IN_ARCHIVE',
      },
    ],
  },
  {
    title: 'File Check Event',
    events: [
      {
        label: 'Preflight Warnings/Errors',
        value: 'PREFLIGHT_WARNINGS_ERRORS',
      },
      {
        label: 'Specifications Warning/Errors',
        value: 'SPECIFICATIONS_WARNINGS_ERRORS',
      },
    ],
  },
  {
    title: 'Proofing Events',
    events: [
      {
        label: 'Title Review Requested',
        value: 'TITLE_REVIEW_REQUESTED',
        // Note: this digest is to avoid a minor bug when multiple email addresses are requested
        digest: backoffFrequentDigest({
          digestAmount: 5,
          digestUnit: DigestUnitEnum.SECONDS,
          backoffAmount: 5,
          backoffUnit: DigestUnitEnum.MINUTES,
        }),
      },

      {
        label: 'Page Proof(s) Approved',
        value: 'PAGE_PROOFS_APPROVED',
        has_parts: true,
        // TODO - disable this after start-up?
        digest: backoffFrequentDigest({
          digestAmount: 5,
          digestUnit: DigestUnitEnum.MINUTES,
          backoffAmount: 1,
          backoffUnit: DigestUnitEnum.MINUTES,
        }),
      },
      {
        label: 'Page Proof(s) Rejected',
        value: 'PAGE_PROOFS_REJECTED',
        has_parts: true,
        digest: backoffFrequentDigest({
          digestAmount: 5,
          digestUnit: DigestUnitEnum.MINUTES,
          backoffAmount: 1,
          backoffUnit: DigestUnitEnum.MINUTES,
        }),
      },
      {
        label: 'Component Proof Approved',
        value: 'COMPONENT_PROOF_APPROVED',
        has_parts: true,
      },
      {
        label: 'Component Checked In',
        value: 'COMPONENT_CHECKED_IN',
        has_parts: true,
      },
      {
        label: 'Title Ready for Delivery',
        value: 'TITLE_READY_FOR_DELIVERY',
      },
      {
        label: 'Component Checkout Complete',
        value: 'COMPONENT_CHECKOUT_COMPLETE',
        has_parts: true,
      },
      {
        label: 'Title Checkout Complete',
        value: 'TITLE_CHECKOUT_COMPLETE',
      },
      {
        label: "Delivery to FTP",
        value: "DELIVERY_TO_FTP",
        // Note:  Conditionally triggers an internal-only event to notify external users about this event happening",
        // Uses same template (or similar).

      }
    ],
  },
  {
    title: 'Administrative Events',
    events: [
      {
        label: 'User Was Created',
        value: 'USER_WAS_CREATED',
        administrative: true,
      },
      {
        label: 'User Was Modified',
        value: 'USER_WAS_MODIFIED',
        administrative: true,
      },
      {
        label: 'User Was Deleted',
        value: 'USER_WAS_DELETED',
        administrative: true,
      },
    ],
  },
  // These will never be displayed as subscribable because they are 'discrete', in the sense that they will only ever inform one particular person for a given notification.
  // The only reason they are still included here is that they use the 'informative' notifications portion of the code in order to send. These are technically 'informative' notifications that are unsubscribable.
  // i.e. A user requesting an RTO proof download will receive a notification of this type. The user will be the only user informed when the download is ready.
  {
    title: 'Discrete Events',
    hidden: true,
    events: [
      {
        discrete: true,
        label: 'High-Res Download Ready',
        // 'RTO Proof Download Ready',
        value: 'RTO_PROOF_DOWNLOAD_READY',
        specialOptions: {
          in_app: {
            active: false,
          },
        },
      },
      {
        discrete: true,
        label: 'Download(s) Failed',
        value: 'DOWNLOADS_FAILED',
        specialOptions: {
          in_app: {
            active: false,
          },
        },
      },
    ],
  },
];

export default informativeEvents;
