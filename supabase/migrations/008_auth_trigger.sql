-- ============================================================
-- 008_auth_trigger.sql
-- Vibe Code Market — Auto-Create Profile on Sign Up
-- ============================================================
-- When a new row is inserted into auth.users (any sign-up method:
-- email/password, Google OAuth, etc.), this trigger automatically
-- creates the corresponding public.profiles row.
--
-- Username generation strategy:
--   1. Use the email local-part before '@'
--   2. Lowercase and strip non-alphanumeric characters
--   3. Append 4 chars of the user UUID to avoid collisions
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username   TEXT;
  final_username  TEXT;
  user_name       TEXT;
  counter         INT := 0;
BEGIN
  -- Extract display name: prefer full_name from OAuth metadata, fall back to email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Build base username: lowercase, keep only a-z 0-9 _ -
  base_username := LOWER(
    REGEXP_REPLACE(
      SPLIT_PART(COALESCE(NEW.email, 'user'), '@', 1),
      '[^a-z0-9_-]', '', 'g'
    )
  );

  -- Ensure minimum length
  IF char_length(base_username) < 3 THEN
    base_username := 'user';
  END IF;

  -- Truncate to leave room for suffix
  base_username := LEFT(base_username, 20);

  -- Append short UUID suffix to guarantee uniqueness
  final_username := base_username || '_' || LOWER(LEFT(REPLACE(NEW.id::TEXT, '-', ''), 6));

  -- Collision guard: increment suffix if still taken (should be rare)
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter;
  END LOOP;

  -- Insert the profile
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    final_username,
    NULLIF(TRIM(user_name), ''),
    NEW.raw_user_meta_data->>'avatar_url',  -- Populated by Google OAuth
    'buyer',                                -- Default role; upgraded to creator in settings
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user IS
  'Automatically creates a profiles row for every new auth.users entry.';

-- Attach to Supabase auth schema
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
