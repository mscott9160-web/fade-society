-- pgcrypto installs digest in the extensions schema. Include it in the
-- security-definer RPC search path so idempotency hashing can execute.
alter function public.create_booking(uuid, uuid, timestamptz, text)
  set search_path = public, extensions, pg_temp;
