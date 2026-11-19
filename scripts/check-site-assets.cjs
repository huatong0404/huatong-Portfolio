// Validate the files that will actually ship, not just files present locally.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const tracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean));
const errors = [];
let references = 0;
for (const file of tracked) {
    if (!/\.(html|css)$/.test(file)) continue;
    if (!fs.existsSync(path.join(root, file))) continue;
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    const patterns = file.endsWith('.html')
        ? [/(?:\b(?:src|href|poster)|\bdata-(?:zoom-src|card-image|card-back))\s*=\s*["']([^"']+)["']/g, /url\(\s*["']?([^"')]+)["']?\s*\)/g]
        : [/url\(\s*["']?([^"')]+)["']?\s*\)/g];
    for (const pattern of patterns) {
        for (const match of content.matchAll(pattern)) {
            let ref = match[1].trim();
            if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(ref)) continue;
            ref = ref.split(/[?#]/)[0];
            if (!ref) continue;
            const decoded = decodeURIComponent(ref);
            const target = path.posix.normalize(decoded.startsWith('/') ? decoded.slice(1) : path.posix.join(path.posix.dirname(file), decoded));
            references++;
            if (!fs.existsSync(path.join(root, target))) errors.push(`${file}: missing ${target}`);
            else if (!tracked.has(target)) errors.push(`${file}: not included in Git: ${target}`);
        }
    }
}
if (errors.length) {
    console.error([...new Set(errors)].join('\n'));
    process.exitCode = 1;
} else {
    console.log(`Passed: ${references} local HTML/CSS references exist and are included in Git.`);
}
