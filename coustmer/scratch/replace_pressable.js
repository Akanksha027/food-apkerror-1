const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('scratch') && !file.includes('assets')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const dirsToWalk = ['app', 'components', 'lib'];
let files = [];
dirsToWalk.forEach(d => {
  files = files.concat(walk(path.join(__dirname, '..', d)));
});

let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import { Pressable } from \'@/components/common/Pressable\';')) return;
  if (!content.includes('Pressable')) return;

  // Replace `import { ..., Pressable, ... } from 'react-native'`
  let newContent = content.replace(/import\s+{([^}]*?)}\s+from\s+['"]react-native['"];?/g, (match, p1) => {
    if (!p1.includes('Pressable')) return match;
    
    // Remove Pressable from the list
    let replacedP1 = p1.replace(/\bPressable\b\s*,?/g, '').trim();
    // Clean up trailing commas
    replacedP1 = replacedP1.replace(/,\s*$/, '');
    
    if (replacedP1.length === 0) {
      return ''; // No other imports from react-native
    }
    return `import { ${replacedP1} } from 'react-native';`;
  });

  if (newContent !== content) {
    const importToAdd = "import { Pressable } from '@/components/common/Pressable';\n";
    
    const firstImportIndex = newContent.indexOf('import ');
    if (firstImportIndex !== -1) {
      newContent = newContent.slice(0, firstImportIndex) + importToAdd + newContent.slice(firstImportIndex);
    } else {
      newContent = importToAdd + newContent;
    }

    fs.writeFileSync(file, newContent, 'utf8');
    replacedCount++;
  }
});
console.log('Replaced in ' + replacedCount + ' files');
