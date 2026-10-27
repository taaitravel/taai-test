import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import {
  LIFECYCLE_TEMPLATE_FILES,
  renderLifecycleEmail,
  type LifecycleKind,
} from './account-policy.ts';

type AdminClient = {
  from: (table: string) => any;
};

const templateDir = join(dirname(fileURLToPath(import.meta.url)), 'emails');

const smtpPassword = () => Deno.env.get('SMTP_PASSWORD') ?? Deno.env.get('SMTP_PASS') ?? '';

/**
 * Sends one branded lifecycle message through the Gmail SMTP mailbox
 * info@taai.travel. Supabase Auth already uses that mailbox. Edge functions
 * read the same host from SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD.
 */
export const sendLifecycleEmail = async (
  admin: AdminClient,
  input: {
    kind: LifecycleKind;
    to: string;
    dedupeKey: string;
    vars?: Record<string, string | null | undefined>;
  },
): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> => {
  const to = input.to.trim();
  if (!to) return { ok: false, error: 'missing_recipient' };

  const { data: existing } = await admin
    .from('lifecycle_email_log')
    .select('id')
    .eq('dedupe_key', input.dedupeKey)
    .maybeSingle();
  if (existing) return { ok: true, duplicate: true };

  const password = smtpPassword();
  if (!password) return { ok: false, error: 'smtp_not_configured' };

  const file = LIFECYCLE_TEMPLATE_FILES[input.kind];
  const html = readFileSync(join(templateDir, `${file}.html`), 'utf8');
  const text = readFileSync(join(templateDir, `${file}.txt`), 'utf8');
  const rendered = renderLifecycleEmail(html, text, input.vars ?? {});

  const client = new SMTPClient({
    connection: {
      hostname: Deno.env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port: Number(Deno.env.get('SMTP_PORT') ?? '465'),
      tls: true,
      auth: {
        username: Deno.env.get('SMTP_USER') ?? 'info@taai.travel',
        password,
      },
    },
  });

  try {
    await client.send({
      from: 'taai <info@taai.travel>',
      to,
      subject: rendered.subject,
      content: rendered.text,
      html: rendered.html,
    });
  } catch (error) {
    console.error('Lifecycle email failed', input.kind, error instanceof Error ? error.message : 'error');
    return { ok: false, error: 'smtp_failed' };
  } finally {
    try {
      await client.close();
    } catch {
      // The message was already handed to SMTP.
    }
  }

  const { error: logError } = await admin.from('lifecycle_email_log').insert({
    dedupe_key: input.dedupeKey,
    template_id: file,
    to_email: to,
  });
  if (logError && logError.code !== '23505') {
    console.error('Lifecycle email log failed', logError.message);
  }
  return { ok: true };
};
