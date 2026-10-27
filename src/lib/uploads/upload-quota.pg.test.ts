import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const BIN_DIRS = [
  '/usr/lib/postgresql/17/bin',
  '/usr/lib/postgresql/16/bin',
  '/usr/lib/postgresql/15/bin',
  '/usr/lib/postgresql/14/bin',
  '/opt/homebrew/opt/postgresql@17/bin',
  '/opt/homebrew/opt/postgresql@16/bin',
  '/usr/local/opt/postgresql@16/bin',
];

const findBin = (name: string) => {
  for (const dir of BIN_DIRS) {
    const full = join(dir, name);
    if (existsSync(full)) return full;
  }
  const probe = spawnSync(name, ['--version'], { encoding: 'utf8' });
  return probe.status === 0 ? name : null;
};

const initdb = findBin('initdb');
const pgCtl = findBin('pg_ctl');
const postgres = findBin('postgres');
const psqlBin = findBin('psql');
const hasPostgres = Boolean(initdb && pgCtl && postgres && psqlBin);

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not reserve a port for Postgres'));
        return;
      }
      server.close(() => resolve(address.port));
    });
  });

const run = (command: string, args: string[]) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error([result.stdout, result.stderr, result.error?.message].filter(Boolean).join('\n'));
  }
  return result;
};

describe.skipIf(!hasPostgres)('upload quota against local Postgres', () => {
  let dir = '';
  let dataDir = '';
  let port = 0;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), 'upload-quota-'));
    dataDir = join(dir, 'data');
    port = await freePort();
    run(initdb!, [
      '-D',
      dataDir,
      '--username=postgres',
      '--auth=trust',
      '--no-sync',
      '--locale=C',
      '--encoding=UTF8',
    ]);
    const started = spawnSync(
      pgCtl!,
      [
        '-D',
        dataDir,
        '-l',
        join(dir, 'server.log'),
        '-w',
        'start',
        '-o',
        `-p ${port} -k ${dir} -c listen_addresses= -c fsync=off -c synchronous_commit=off`,
      ],
      { encoding: 'utf8' },
    );
    if (started.status !== 0) {
      const log = existsSync(join(dir, 'server.log')) ? readFileSync(join(dir, 'server.log'), 'utf8') : '';
      throw new Error(`${started.stderr}\n${log}`);
    }
    run(findBin('createdb') ?? 'createdb', ['-h', dir, '-p', String(port), '-U', 'postgres', 'upload_quota']);
    const sql = (file: string) =>
      run(psqlBin!, ['-h', dir, '-p', String(port), '-U', 'postgres', '-d', 'upload_quota', '-v', 'ON_ERROR_STOP=1', '-X', '-q', '-f', file]);
    sql('supabase/tests/upload_quota_stubs.sql');
    sql('supabase/migrations/20261026235158_upload_quotas_and_storage_access.sql');
    sql('supabase/migrations/20261026235158_upload_quotas_and_storage_access.sql');
  }, 60_000);

  afterAll(() => {
    if (dataDir) {
      spawnSync(pgCtl!, ['-D', dataDir, '-w', '-m', 'immediate', 'stop'], { encoding: 'utf8' });
    }
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('caps each folder, keeps a same-name replacement, and releases only the owner slot', () => {
    const result = spawnSync(
      psqlBin!,
      [
        '-h',
        dir,
        '-p',
        String(port),
        '-U',
        'postgres',
        '-d',
        'upload_quota',
        '-v',
        'ON_ERROR_STOP=1',
        '-X',
        '-q',
        '-f',
        'supabase/tests/upload_quota_cases.sql',
      ],
      { encoding: 'utf8' },
    );
    expect(result.stderr ?? '').not.toMatch(/column reference "folder" is ambiguous/);
    if (result.status !== 0) {
      throw new Error([result.stdout, result.stderr].filter(Boolean).join('\n'));
    }
  }, 60_000);
});
