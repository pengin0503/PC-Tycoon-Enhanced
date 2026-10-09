import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

it('runs CI exactly once per PR update while still verifying main pushes (#36 billing efficiency)',()=>{
 const source=readFileSync('.github/workflows/ci.yml','utf8');
 expect(source).not.toMatch(/on:\s*\[\s*push\s*,\s*pull_request\s*\]/);
 expect(source).toMatch(/push:\s*\n\s+branches:\s*\[main\]/);
 expect(source).toMatch(/pull_request:/);
 expect(source).toMatch(/concurrency:/);
 expect(source).toMatch(/cancel-in-progress:\s*\$\{\{\s*github\.event_name\s*==\s*'pull_request'/);
 expect(source).toMatch(/run:\s*npm test/);
 expect(source).toMatch(/run:\s*npm run android:verify/);
});
