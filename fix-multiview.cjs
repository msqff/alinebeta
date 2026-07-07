const fs = require('fs');

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

content = content.replace(/const promises = viewsToGenerate\.map\(\(view: string\) => generateView\(view\)\);\s*return Promise\.all\(promises\);/g, `const results: { view: string, image: ImageSource }[] = [];
    for (const view of viewsToGenerate) {
        results.push(await generateView(view));
    }
    return results;`);

fs.writeFileSync('services/geminiService.ts', content);
