import { spawnSync } from 'node:child_process';
const tasks =
  process.argv[2] === 'backend'
    ? [
        ['run', 'lint:backend'],
        ['run', 'test', '-w', 'backend'],
        ['run', 'build', '-w', 'backend'],
      ]
    : [['run', 'lint'], ['test'], ['run', 'build']];
for (const args of tasks) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
