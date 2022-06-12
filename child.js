const process = require('process');
const { spawn } = require('node:child_process');

process.on('exit', (code) => {
    console.log(`!!! child.js exiting with code: ${code}`);
});

console.log('!!! child.js running');
const subprocess = spawn('node', ['./grandchild.js'], {
    detached: true,
    stdio: ['ignore', 'inherit', 'inherit'],
});
subprocess.unref();
