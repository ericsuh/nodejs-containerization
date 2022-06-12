const process = require('process');
const { spawn } = require('node:child_process');

const subprocess = spawn('node', ['./child.js'], {
    detached: true,
    stdio: ['ignore', 'inherit', 'inherit'],
});
subprocess.unref();

let exit = false;
process.on('SIGINT', () => {
  console.log('!!! main.js received SIGINT');
});

process.on('SIGTERM', () => {
  console.log('!!! main.js received SIGTERM. Setting exit: true.');
  exit = true;
});

process.on('exit', (code) => {
  console.log(`!!! main.js exiting with code: ${code}`);
});

function looper() {
    if (!exit) {
        const subprocess = spawn('ps', ['aux']);
        subprocess.stdout.on('data', (data) => {
            console.log('!!! main.js\n' + String(data));
        });
        console.log('!!! main.js looping');
        setTimeout(looper, 5000);
    } else {
        console.log('!!! main.js will exit when event loop is empty');
    }
}

looper();
