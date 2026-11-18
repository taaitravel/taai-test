import { writeFileSync } from 'node:fs';
import { renderDemoSeedSql } from '../src/lib/dashboard/demo-seed-sql';

const target = new URL('../supabase/migrations/20261118120000_demo_account_itineraries.sql', import.meta.url);
writeFileSync(target, renderDemoSeedSql());
console.log(`wrote ${target.pathname}`);
