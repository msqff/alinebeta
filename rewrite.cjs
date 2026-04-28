const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = content.replace(/src=\{([a-zA-Z0-9_.\(\)\[\]]+)\}/g, (match, p1) => {
                if (p1.includes('||')) return match; // already handled
                return `src={${p1} || undefined}`;
            });
            if (content !== modified) {
                fs.writeFileSync(fullPath, modified);
                console.log('Modified', fullPath);
            }
        }
    }
}

replaceInDir(path.join(__dirname, 'components'));
replaceInDir(__dirname); // for App.tsx
