import { defineConfig, mergeConfig } from 'vitest/config';
import base from '../../vitest.config';

const mutation = process.env.A16_DEBOUNCE_MUTATION;
if (mutation !== 'omit-reset' && mutation !== 'wrong-default') throw new Error('Choose one explicit A16 debounce mutation.');

export default mergeConfig(base, defineConfig({
  plugins: [{
    name: 'audit-debounce-negative-control',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/packages/persistence/src/index.ts')) return;
      const target = mutation === 'omit-reset' ? /function schedule\(\) \{\s*clearTimeout\(timer\);/ : /config\.debounceMs \?\? 1500/;
      if (!target.test(code)) throw new Error('Mutation target changed; this negative control must be reviewed.');
      return code.replace(target, mutation === 'omit-reset' ? 'function schedule() {' : 'config.debounceMs ?? 500');
    },
  }],
  test: { include: ['tests/sync.test.ts'], testNamePattern: 'debounce boundary:' },
}));
