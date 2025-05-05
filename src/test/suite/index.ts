import * as path from 'path';
import * as Mocha from 'mocha';
import { glob } from 'glob';

export const run = async (): Promise<void> => {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise<void>(async (resolve, reject) => {
    try {
      // Use promise-based API for glob v11
      const files = await glob('**/**.test.js', { cwd: testsRoot });

      // Add files to the test suite
      files.forEach((file: string) => mocha.addFile(path.resolve(testsRoot, file)));

      try {
        // Run the mocha test
        mocha.run((failures) => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (mochaError) {
        console.error(mochaError);
        reject(mochaError);
      }
    } catch (err) {
      reject(err);
    }
  });
};
