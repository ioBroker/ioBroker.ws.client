const { readFileSync, writeFileSync, existsSync, unlinkSync } = require('node:fs');
const pkg = require('./package.json');

const date = new Date();
const originalFile = readFileSync(`${__dirname}/index.ts`).toString('utf8');
let file = originalFile
file = file.replace(/2020-20\d\d/, `2020-${date.getFullYear()}`);
file = file.replace(/v \d.\d.\d/, `v ${pkg.version}`);
file = file.replace(
    /\(20\d\d_\d\d_\d\d\)/,
    `(${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')})`,
);

if (originalFile !== file) {
    writeFileSync(`${__dirname}/index.ts`, file);
}

if (existsSync(`${__dirname}/dist/esm/index.d.ts`)) {
    unlinkSync(`${__dirname}/dist/esm/index.d.ts`);
}
