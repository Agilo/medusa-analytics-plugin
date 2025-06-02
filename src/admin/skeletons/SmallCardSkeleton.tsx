import { Container, Text } from '@medusajs/ui';
import { Skeleton } from '../components/Skeleton';

export const SmallCardSkeleton = () => {
  <Container>
    <Text size="small">Total Orders</Text>
    <Skeleton className="w-20 h-[1.4375rem] my-1" />
    <Skeleton className="w-40 h-3.5" />
  </Container>;
};
