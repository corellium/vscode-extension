import * as assert from 'assert';
import { suite, test } from 'mocha';
import { window } from 'vscode';

suite('Extension Test Suite', async () => {
  await window.showInformationMessage('Start all tests.');

  test('sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });
});
