/**
 * Checks a schedule input file and turns it into one SQL script.
 *
 *   npm run schedule:sql -- schedule.json [out.sql]
 *
 * Prints the findings, exits 1 on errors (no SQL is written then). Needs no
 * database credentials and never connects to anything. See
 * docs/schedule-load.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import {
  checkSchedule,
  hasErrors,
  type ScheduleInput,
} from '@/lib/scheduleCheck';
import { scheduleToSql } from '@/lib/scheduleSql';

const [inPath, outArg] = process.argv.slice(2);
if (!inPath) {
  console.error('Usage: npm run schedule:sql -- <schedule.json> [out.sql]');
  process.exit(2);
}

let input: unknown;
try {
  input = JSON.parse(readFileSync(inPath, 'utf8'));
} catch (e) {
  console.error(`Cannot read ${inPath}: ${e instanceof Error ? e.message : e}`);
  process.exit(2);
}

const findings = checkSchedule(input);
for (const f of findings)
  console.log(`${f.severity === 'error' ? 'ERROR  ' : 'WARNING'} ${f.message}`);
const errors = findings.filter((f) => f.severity === 'error').length;
const warnings = findings.length - errors;
console.log(`${errors} error(s), ${warnings} warning(s).`);

if (hasErrors(findings)) {
  console.log('No SQL written.');
  process.exit(1);
}

const outPath = outArg ?? inPath.replace(/\.json$/i, '') + '.sql';
writeFileSync(outPath, scheduleToSql(input as ScheduleInput));
console.log(`Wrote ${outPath}`);
