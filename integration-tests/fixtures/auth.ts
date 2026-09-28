import { generateJwtToken } from '@medusajs/framework/utils';
import { MedusaContainer } from '@medusajs/types';

export async function createAdminActor({
  container,
  emailPrefix = 'test-admin',
}: {
  container: MedusaContainer;
  emailPrefix?: string;
}): Promise<{ headers: Record<string, string>; userId: string }> {
  const authModuleService = container.resolve('auth');
  const userModuleService = container.resolve('user');

  const user = await userModuleService.createUsers({
    email: `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
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

  return { headers: { Authorization: `Bearer ${token}` }, userId: user.id };
}

export async function createAdminHeaders(args: {
  container: MedusaContainer;
  emailPrefix?: string;
}): Promise<Record<string, string>> {
  const { headers } = await createAdminActor(args);
  return headers;
}
