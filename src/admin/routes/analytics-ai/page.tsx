import { defineRouteConfig } from '@medusajs/admin-sdk';
import { AiAssistent } from '@medusajs/icons';

export default function AnalyticsAIPage() {
  return (
    <>
      <h1>Analytics AI</h1>
    </>
  );
}

export const config = defineRouteConfig({
  label: 'AI dashboard',
  icon: AiAssistent,
});
