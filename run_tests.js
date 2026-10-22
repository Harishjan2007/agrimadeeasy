import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log('Running python ml/export_trees_to_json.py...');
  const pyExportOut = execSync('python ml/export_trees_to_json.py', { encoding: 'utf-8' });
  fs.writeFileSync('export_trees_output.txt', pyExportOut, 'utf-8');

  console.log('Running node tests/run-all.mjs...');
  const out = execSync('node tests/run-all.mjs', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  fs.writeFileSync('all_tests_output.txt', out, 'utf-8');
  console.log('ALL_TESTS_AND_EXPORT_PASSED');
} catch (e) {
  fs.writeFileSync('all_tests_output.txt', (e.stdout || '') + '\n' + (e.stderr || '') + '\n' + e.message, 'utf-8');
  console.log('ALL_TESTS_OR_EXPORT_FAILED');
}
