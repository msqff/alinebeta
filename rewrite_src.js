const fs = require('fs');
const path = require('path');

function replaceSrc(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceSrc(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // This regex will replace common patterns where getDisplaySrc or an empty string might be assigned to src
            // actually we can just find any <img ... src={variable} ...> and replace it with <img ... src={variable || undefined} ...> if it's evaluated
            // but rewriting AST is better. Let's just manually fix the few errors.
            // Let's do it a simpler way: just change getDisplaySrc to return undefined and see what breaks
        }
    }
}
