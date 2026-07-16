const { execSync } = require('child_process');
const fs = require('fs');
try {
    const c1 = execSync('git checkout -b feature/fix-layout-dashboard');
    const c2 = execSync('git add .');
    const c3 = execSync('git commit -m "Fix UI layout and badge word breaks"');
    const c4 = execSync('git push -u origin feature/fix-layout-dashboard');
    fs.writeFileSync('git_result.txt', c1.toString() + c2.toString() + c3.toString() + c4.toString());
} catch (err) {
    fs.writeFileSync('git_result.txt', err.toString() + (err.stdout ? err.stdout.toString() : '') + (err.stderr ? err.stderr.toString() : ''));
}
