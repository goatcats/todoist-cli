const fs = require("fs");

const path = process.argv[1].replace("build.js", "");
const content = `#!/bin/sh\nnode ${path}main.mjs $@`;
const dest = "/usr/bin/todo";

console.log("> building...");
fs.writeFileSync(dest, content, { flag: "w" });
fs.chmodSync(dest, "755");

console.log("> build successful!");
