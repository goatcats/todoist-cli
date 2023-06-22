const { homedir } = require('os');
const fs = require('fs');

const path = process.argv[1].replace("build.js","");
const content = `#!/bin/sh\nnode ${path}main.mjs $@`;
const dest = homedir() + "/.local/bin/todo";

fs.writeFileSync(dest, content, {flag:'w'});
console.log("> build successful!");