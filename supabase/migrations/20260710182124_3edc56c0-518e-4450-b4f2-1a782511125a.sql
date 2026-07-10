CREATE OR REPLACE FUNCTION public.enforce_chat_edit_window()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  content_changed boolean;
  is_soft_delete  boolean;
BEGIN
  content_changed :=
       NEW.content         IS DISTINCT FROM OLD.content
    OR NEW.attachment_type IS DISTINCT FROM OLD.attachment_type
    OR NEW.attachment_data IS DISTINCT FROM OLD.attachment_data;

  is_soft_delete := (COALESCE(OLD.deleted, false) = false AND NEW.deleted = true);

  IF content_changed AND NOT is_soft_delete THEN
    IF (now() - OLD.created_at) > interval '10 minutes' THEN
      RAISE EXCEPTION
        'Chat messages can only be edited within 10 minutes of posting'
        USING ERRCODE = 'check_violation';
    END IF;

    NEW.edited_at := now();
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_enforce_chat_edit_window
  ON public.itinerary_chat_messages;

CREATE TRIGGER trg_enforce_chat_edit_window
  BEFORE UPDATE ON public.itinerary_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_chat_edit_window();