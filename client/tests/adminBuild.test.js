// codeguard:components:start
// codeguard:defines: test cases or fixtures below
import { test as testRef } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync as execFileSyncRef } from 'node:child_process';
import { mkdirSync as mkdirSyncRef, readdirSync as readdirSyncRef, readFileSync as readFileSyncRef, writeFileSync as writeFileSyncRef } from 'node:fs';
import { join as joinRef } from 'node:path';
import { fileURLToPath as fileURLToPathRef } from 'node:url';
const filesUnderRef = filesUnder;


function filesUnder(directory) {
  return readdirSyncRef(directory, { withFileTypes: true }).flatMap(entry => {
    const path = joinRef(directory, entry.name);
    return entry.isDirectory() ? filesUnderRef(path) : [path];
  });
}
// codeguard:components:end

testRef('public build excludes dashboard code while admin build includes it', () => {
  const root = fileURLToPathRef(new URL('..', import.meta.url));
  const vite = joinRef(root, 'node_modules/vite/bin/vite.js');
  execFileSyncRef(process.execPath, [vite, 'build'], { cwd: root, stdio: 'pipe' });
  const publicFiles = filesUnderRef(joinRef(root, 'dist'));
  assert.equal(publicFiles.some(path => path.endsWith('.map')), false);
  const publicScripts = publicFiles.filter(path => path.endsWith('.js')).map(path => readFileSyncRef(path, 'utf8')).join('\n');
  assert.equal(publicScripts.includes('مكتبة الوسائط'), false);
  assert.equal(publicScripts.includes('AdminAntiforgery'), false);

  const stale = joinRef(root, 'dist-admin/assets/stale-admin-chunk.js');
  mkdirSyncRef(joinRef(root, 'dist-admin/assets'), { recursive: true });
  writeFileSyncRef(stale, 'old dashboard code');
  execFileSyncRef(process.execPath, [vite, 'build', '--config', 'vite.admin.config.js'], { cwd: root, stdio: 'pipe' });
  const adminFiles = filesUnderRef(joinRef(root, 'dist-admin'));
  assert.equal(adminFiles.includes(stale), false);
  assert.ok(adminFiles.some(path => path.endsWith('index.html')));
  assert.equal(adminFiles.some(path => path.endsWith('.map')), false);
  const adminScripts = adminFiles.filter(path => path.endsWith('.js')).map(path => readFileSyncRef(path, 'utf8')).join('\n');
  for (const tab of ['الطلبات', 'الأسعار والعروض', 'المحتوى والصور', 'الصفحات', 'مكتبة الوسائط', 'النسخ الاحتياطي'])
    assert.ok(adminScripts.includes(tab), `Missing admin tab: ${tab}`);
});
