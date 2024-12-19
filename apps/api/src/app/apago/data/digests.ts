import { DigestUnitEnum } from '@novu/shared';

export const normalDigest = ({ digestAmount, digestUnit }: { digestAmount: number; digestUnit: DigestUnitEnum }) => ({
  amount: digestAmount,
  unit: digestUnit,
});

export const backoffFrequentDigest = ({
  digestAmount,
  digestUnit,
  backoffAmount,
  backoffUnit,
}: {
  digestAmount: number;
  digestUnit: DigestUnitEnum;
  backoffAmount: number;
  backoffUnit: DigestUnitEnum;
}) => ({
  amount: digestAmount,
  unit: digestUnit,
  backoff: true,
  backoffAmount: backoffAmount,
  backoffUnit: backoffUnit,
});
