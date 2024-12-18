import {
  DigestUnitEnum,
  DigestTypeEnum,
} from '@novu/shared';

const normalDigest = (digestTime: number, units: DigestUnitEnum) => (
  {
    value: digestTime,
    valueUnit: units,
  }
)

const stakeholderStages = [
  {
    label: "Resolve Preflight",
    value: "Preflight1_ApplyFix",
    digest: normalDigest(5, DigestUnitEnum.SECONDS)
  },
  {
    label: "Approve Content",
    value: "Preflight1_Signoff",
    digest: normalDigest(5, DigestUnitEnum.SECONDS)

  },
  {
    label: "Approve to Print",
    value: "Preflight2_Signoff",
    digest: normalDigest(5, DigestUnitEnum.SECONDS)
  }
]

export default stakeholderStages;
