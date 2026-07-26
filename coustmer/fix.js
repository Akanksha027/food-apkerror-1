const fs = require('fs');
const path = require('path');

const componentsDir = 'c:\\Users\\Akanksha Singh\\Downloads\\Food-Delivery-App\\coustmer\\components';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(componentsDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    if (content.includes('router.back()')) {
        let newContent = content.replace(/\(\) => router\.back\(\)/g, "() => { if (router.canGoBack()) { router.back(); } else { router.replace('/'); } }");
        newContent = newContent.replace(/(?<!=> )router\.back\(\);/g, "if (router.canGoBack()) { router.back(); } else { router.replace('/'); }");
        
        if (newContent !== content) {
            fs.writeFileSync(file, newContent, 'utf-8');
            console.log('Updated ' + file);
        }
    }
});
