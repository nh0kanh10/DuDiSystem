const fs = require('fs');

try {
    console.log('Deleting src...');
    fs.rmSync('src', { recursive: true, force: true });
    console.log('Replacing src...');
    fs.renameSync('temp_repo/src', 'src');
    console.log('Cleaning up...');
    fs.rmSync('temp_repo', { recursive: true, force: true });
    console.log('Success!');
} catch (e) {
    console.error(e);
}
