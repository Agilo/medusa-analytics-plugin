import { generateJwtToken } from '@medusajs/framework/utils';
import { MedusaContainer } from '@medusajs/types';

export async function createAdminHeaders({
  container,
  emailPrefix = 'test-admin',
}: {
  container: MedusaContainer;
  emailPrefix?: string;
}): Promise<Record<string, string>> {
  const authModuleService = container.resolve('auth');
  const userModuleService = container.resolve('user');

  const user = await userModuleService.createUsers({
    email: `${emailPrefix}-${Date.now()}@test.com`,
  });

  const authIdentity = await authModuleService.createAuthIdentities({
    provider_identities: [
      {
        provider: 'emailpass',
        entity_id: user.email,
        provider_metadata: {
          password: process.env.JWT_SECRET || 'test',
        },
      },
    ],
    app_metadata: {
      user_id: user.id,
    },
  });

  const token = generateJwtToken(
    {
      actor_id: user.id,
      actor_type: 'user',
      auth_identity_id: authIdentity.id,
    },
    {
      secret: process.env.JWT_SECRET || 'test',
      expiresIn: '1d',
    },
  );

  return { Authorization: `Bearer ${token}` };
}
