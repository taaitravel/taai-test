
-- Shared updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 1. notification_preferences
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY,
  chat_messages boolean NOT NULL DEFAULT true,
  chat_mentions boolean NOT NULL DEFAULT true,
  trip_reminders boolean NOT NULL DEFAULT true,
  trip_reminder_lead_hours integer NOT NULL DEFAULT 4 CHECK (trip_reminder_lead_hours IN (2, 4, 12, 24)),
  trip_updates boolean NOT NULL DEFAULT true,
  traveller_requests boolean NOT NULL DEFAULT true,
  traveller_accepts boolean NOT NULL DEFAULT true,
  newsletter boolean NOT NULL DEFAULT true,
  deals boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own prefs" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own prefs" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own prefs" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service manages prefs" ON public.notification_preferences FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE TRIGGER trg_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. chat_mutes
CREATE TABLE public.chat_mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  itinerary_id bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, itinerary_id)
);
ALTER TABLE public.chat_mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mutes" ON public.chat_mutes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. user_follows
CREATE TABLE public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own follows" ON public.user_follows FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE POLICY "Create follow" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Recipient updates status" ON public.user_follows FOR UPDATE USING (auth.uid() = following_id);
CREATE POLICY "Either party deletes" ON public.user_follows FOR DELETE USING (auth.uid() = follower_id OR auth.uid() = following_id);
CREATE TRIGGER trg_user_follows_updated_at BEFORE UPDATE ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. notify_user helper
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id uuid, _pref_key text, _type text, _title text, _message text,
  _reference_type text DEFAULT NULL, _reference_id text DEFAULT NULL, _itinerary_id bigint DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_allowed boolean := true; v_id uuid;
BEGIN
  INSERT INTO public.notification_preferences (user_id) VALUES (_user_id) ON CONFLICT (user_id) DO NOTHING;
  EXECUTE format('SELECT %I FROM public.notification_preferences WHERE user_id = $1', _pref_key) INTO v_allowed USING _user_id;
  IF NOT COALESCE(v_allowed, true) THEN RETURN NULL; END IF;
  IF _pref_key IN ('chat_messages','chat_mentions') AND _itinerary_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.chat_mutes WHERE user_id = _user_id AND itinerary_id = _itinerary_id) THEN RETURN NULL; END IF;
  END IF;
  INSERT INTO public.notifications (user_id, type, title, message, reference_type, reference_id)
  VALUES (_user_id, _type, _title, _message, _reference_type, _reference_id) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

-- 5. Auto prefs on signup + backfill
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_create_notification_preferences ON auth.users;
CREATE TRIGGER trg_create_notification_preferences AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_notification_preferences();
INSERT INTO public.notification_preferences (user_id) SELECT id FROM auth.users ON CONFLICT (user_id) DO NOTHING;

-- 6. Chat message notification trigger
CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; v_sender_name text; v_trip_name text; v_preview text;
BEGIN
  SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')),''), username, 'Someone')
    INTO v_sender_name FROM public.users WHERE userid = NEW.sender_id;
  SELECT itin_name INTO v_trip_name FROM public.itinerary WHERE id = NEW.itinerary_id;
  v_preview := COALESCE(NULLIF(LEFT(NEW.content, 80),''), '📎 attachment');
  FOR r IN SELECT user_id FROM public.itinerary_chat_participants WHERE itinerary_id = NEW.itinerary_id AND user_id <> NEW.sender_id LOOP
    PERFORM public.notify_user(r.user_id, 'chat_messages', 'chat',
      '💬 ' || v_sender_name || ' in ' || COALESCE(v_trip_name,'your trip'),
      v_preview, 'itinerary', NEW.itinerary_id::text, NEW.itinerary_id);
  END LOOP;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_chat_message ON public.itinerary_chat_messages;
CREATE TRIGGER trg_notify_chat_message AFTER INSERT ON public.itinerary_chat_messages FOR EACH ROW EXECUTE FUNCTION public.notify_chat_message();

-- 7. Follow notification trigger
CREATE OR REPLACE FUNCTION public.notify_follow_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_follower_name text; v_following_name text;
BEGIN
  SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')),''), username, 'Someone')
    INTO v_follower_name FROM public.users WHERE userid = NEW.follower_id;
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    PERFORM public.notify_user(NEW.following_id, 'traveller_requests', 'follow_request',
      '👋 ' || v_follower_name || ' wants to follow you', 'Tap to review the request.', 'follow', NEW.id::text, NULL);
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    SELECT COALESCE(NULLIF(TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,'')),''), username, 'Someone')
      INTO v_following_name FROM public.users WHERE userid = NEW.following_id;
    PERFORM public.notify_user(NEW.follower_id, 'traveller_accepts', 'follow_accepted',
      '🤝 ' || v_following_name || ' accepted your follow', 'You''re now connected.', 'follow', NEW.id::text, NULL);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_follow_insert ON public.user_follows;
CREATE TRIGGER trg_notify_follow_insert AFTER INSERT ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.notify_follow_change();
DROP TRIGGER IF EXISTS trg_notify_follow_update ON public.user_follows;
CREATE TRIGGER trg_notify_follow_update AFTER UPDATE ON public.user_follows FOR EACH ROW EXECUTE FUNCTION public.notify_follow_change();
