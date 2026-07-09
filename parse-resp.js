const fs = require('fs');
const resp = JSON.parse(fs.readFileSync('response.json', 'utf8'));
console.log(JSON.stringify(resp.candidates[0].content.parts.map(p => Object.keys(p)), null, 2));
