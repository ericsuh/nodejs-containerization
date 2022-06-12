console.log('!!! grandchild.js running');

process.on('exit', (code) => {
    console.log(`!!! grandchild.js exiting with code: ${code}`);
});

setTimeout(
    () => { console.log('!!! grandchild.js timeout triggered.') },
    2000,
);
