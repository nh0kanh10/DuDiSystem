const fs = require('fs');
let content = fs.readFileSync('app/components/crm/CrmStaffPage.tsx', 'utf8');
content = content.replace(/text-xs text-gray-500/g, 'text-xs text-gray-500 dark:text-gray-400');
content = content.replace(/bg-gray-50 border px-3 py-2 text-sm font-semibold text-gray-700/g, 'bg-gray-50 dark:bg-white/5 border dark:border-white/10 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-white');
content = content.replace(/text-xs font-bold text-gray-600 mb-1.5/g, 'text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5');
content = content.replace(/border border-gray-200 bg-gray-50 text-sm focus:outline-none/g, 'border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm dark:text-[#FFE8EC] focus:outline-none');
fs.writeFileSync('app/components/crm/CrmStaffPage.tsx', content);
