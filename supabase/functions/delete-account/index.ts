import { createClient } from 'npm:@supabase/supabase-js@2';

import { readAppleConfig, revokeAppleToken } from './apple_revoke.ts';
import { handleDeleteAccount } from './handler.ts';

Deno.serve((req) => {
  const appleConfig = readAppleConfig();
  return handleDeleteAccount(
    req,
    createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!),
    appleConfig ? (code) => revokeAppleToken(appleConfig, code) : null,
  );
});
