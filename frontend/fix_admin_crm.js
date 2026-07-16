const fs = require('fs');
let content = fs.readFileSync('app/components/crm/CrmAdminPage.tsx', 'utf8');

// Modals fixes
content = content.replace(/className=\"p-6 space-y-4\"/g, 'className=\"p-6 space-y-4 dark:text-white\"');
content = content.replace(/className=\"p-4 space-y-4\"/g, 'className=\"p-4 space-y-4 dark:text-white\"');
content = content.replace(/text-xs text-gray-500/g, 'text-xs text-gray-500 dark:text-gray-400');
content = content.replace(/bg-gray-50 border px-3 py-2 text-sm font-semibold text-gray-700/g, 'bg-gray-50 dark:bg-white/5 border dark:border-white/10 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-white');
content = content.replace(/text-xs font-bold text-gray-600 mb-1.5/g, 'text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5');
content = content.replace(/border border-gray-200 bg-gray-50 text-sm focus:outline-none/g, 'border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm dark:text-[#FFE8EC] focus:outline-none');
content = content.replace(/bg-white border text-gray-700 text-sm rounded-lg focus:ring-\[#E8231A\] focus:border-\[#E8231A\] block w-full p-2.5/g, 'bg-white dark:bg-white/5 border dark:border-white/10 text-gray-700 dark:text-white text-sm rounded-lg focus:ring-[#E8231A] focus:border-[#E8231A] block w-full p-2.5');

// inputs in form / modal
content = content.replace(/w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm/g, 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm dark:text-[#FFE8EC]');

fs.writeFileSync('app/components/crm/CrmAdminPage.tsx', content);
