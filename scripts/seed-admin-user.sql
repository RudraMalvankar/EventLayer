-- ONE-TIME: Run in Supabase Dashboard → SQL Editor (or: npm run db:admin)
-- Admin: rudracmalvankar@gmail.com / Admin@123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure profile columns exist (older DBs may only have id + name)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;

DO $$
DECLARE
  admin_email text := 'rudracmalvankar@gmail.com';
  admin_password text := 'Admin@123';
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE lower(email) = lower(admin_email);

  IF user_id IS NULL THEN
    user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Platform Admin","role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      user_id,
      user_id::text,
      jsonb_build_object('sub', user_id::text, 'email', admin_email, 'email_verified', true),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt(admin_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
    WHERE id = user_id;
  END IF;

  INSERT INTO public.profiles (id, name)
  VALUES (user_id, 'Platform Admin')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
END $$;
