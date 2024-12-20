import { DigestUnitEnum } from '@novu/shared';
import { normalDigest } from './digests';

const stakeholderStages = [
  {
    label: 'Resolve Preflight',
    // label: 'Resolve Preflight',
    // customLabel: "(Stakeholder1) - Resolve Preflight Issues",
    value: 'Preflight1_ApplyFix',
    digest: normalDigest({
      digestAmount: 5,
      digestUnit: DigestUnitEnum.SECONDS,
    }),
  },
  {
    label: 'Approve Content',
    // label: 'Approve Content',
    // customLabel: "(Stakeholder2) - Approve Content",
    value: 'Preflight1_Signoff',
    prior: 'Preflight1_ApplyFix',
    digest: normalDigest({
      digestAmount: 5,
      digestUnit: DigestUnitEnum.SECONDS,
    }),
  },
  {
    label: 'Approve to Print',
    // label: 'Approve to Print',
    // customLabel: "(Stakeholder3) - Approve to Print",
    value: 'Preflight2_Signoff',
    prior: 'Preflight1_Signoff',
    digest: normalDigest({
      digestAmount: 5,
      digestUnit: DigestUnitEnum.SECONDS,
    }),
  },
  {
    label: 'Resolve Preflight Complete',
    // label: 'Resolve Preflight Complete',
    // customLabel: "(Stakeholder1a) Resolve Preflight Complete",
    value: 'resolve-preflight-complete',
    digest: normalDigest({
      digestAmount: 5,
      digestUnit: DigestUnitEnum.SECONDS,
    }),
  },
  {
    label: 'Approve Content Complete',
    // label: 'Approve Content Complete',
    // customLabel: "(Stakeholder2a) Approve Content Complete",
    value: 'approve-content-complete',
    digest: normalDigest({
      digestAmount: 5,
      digestUnit: DigestUnitEnum.SECONDS,
    }),
  },
  {
    label: 'Approve to Print Complete',
    // label: 'Approve to Print Complete',
    // customLabel: "(Stakeholder3a) Approve to Print Complete",
    value: 'approve-to-print-complete',
    digest: normalDigest({
      digestAmount: 5,
      digestUnit: DigestUnitEnum.SECONDS,
    }),
  },
];

export default stakeholderStages;
