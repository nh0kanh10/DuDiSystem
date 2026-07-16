const fs = require('fs');
let content = fs.readFileSync('app/components/ui/Modal.tsx', 'utf8');

content = content.replace(/className=\"relative bg-white rounded-3xl/g, 'className=\"relative bg-white dark:bg-[#1D1D23] rounded-3xl');
content = content.replace(/border-t border-gray-100/g, 'border-t border-gray-100 dark:border-white/10');
content = content.replace(/text-gray-500 hover:bg-gray-100/g, 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10');

fs.writeFileSync('app/components/ui/Modal.tsx', content);
