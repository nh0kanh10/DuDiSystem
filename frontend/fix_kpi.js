const fs = require('fs');
let content = fs.readFileSync('app/components/nhan-vien/UserKpiPanel.tsx', 'utf8');

content = content.replace(/className=\"bg-white rounded-3xl shadow-xl w-full max-w-4xl/g, 'className=\"bg-white dark:bg-[#1D1D23] rounded-3xl shadow-xl w-full max-w-4xl');
content = content.replace(/className=\"bg-white rounded-2xl shadow-xl w-full max-w-md/g, 'className=\"bg-white dark:bg-[#1D1D23] rounded-2xl shadow-xl w-full max-w-md');
content = content.replace(/text-gray-800\">Nhập số liệu/g, 'text-gray-800 dark:text-[#FFE8EC]\">Nhập số liệu');
content = content.replace(/text-gray-800\">Chi tiết KPI/g, 'text-gray-800 dark:text-[#FFE8EC]\">Chi tiết KPI');
content = content.replace(/bg-gray-50 p-4 rounded-2xl border border-gray-100/g, 'bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10');
content = content.replace(/bg-white p-4 sm:p-5 border border-gray-150 rounded-2xl/g, 'bg-white dark:bg-white/[0.03] p-4 sm:p-5 border border-gray-150 dark:border-white/10 rounded-2xl');
content = content.replace(/bg-white p-5 border border-gray-150 rounded-2xl/g, 'bg-white dark:bg-white/[0.03] p-5 border border-gray-150 dark:border-white/10 rounded-2xl');
content = content.replace(/text-gray-700 font-bold mb-1.5/g, 'text-gray-700 dark:text-gray-300 font-bold mb-1.5');
content = content.replace(/text-gray-700 mb-1\">/g, 'text-gray-700 dark:text-gray-300 mb-1\">');
content = content.replace(/text-gray-800 text-sm border-b border-gray-100/g, 'text-gray-800 dark:text-[#FFE8EC] text-sm border-b border-gray-100 dark:border-white/10');
content = content.replace(/rounded-xl focus:outline-none text-xs font-semibold transition-all/g, 'rounded-xl focus:outline-none text-xs font-semibold transition-all dark:bg-white/5 dark:text-[#FFE8EC]');
content = content.replace(/bg-white\"\\n                  required/g, 'bg-white dark:bg-white/5 dark:text-[#FFE8EC]\"\\n                  required');
content = content.replace(/bg-white\"\\n                                  placeholder/g, 'bg-white dark:bg-white/5 dark:text-[#FFE8EC]\"\\n                                  placeholder');
content = content.replace(/text-gray-400 font-bold mb-1/g, 'text-gray-400 dark:text-gray-300 font-bold mb-1');
content = content.replace(/bg-gray-50 rounded-xl border border-gray-100/g, 'bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10');
content = content.replace(/border-t border-gray-100/g, 'border-t border-gray-100 dark:border-white/10');
content = content.replace(/p-6 border-b border-gray-100/g, 'p-6 border-b border-gray-100 dark:border-white/10');
content = content.replace(/divide-y divide-gray-100/g, 'divide-y divide-gray-100 dark:divide-white/10');
content = content.replace(/text-gray-500 font-medium/g, 'text-gray-500 dark:text-gray-400 font-medium');
content = content.replace(/text-gray-950/g, 'text-gray-950 dark:text-[#FFE8EC]');
// Add dark mode support to the general input forms
content = content.replace(/font-bold text-gray-700 bg-white/g, 'font-bold text-gray-700 dark:text-[#FFE8EC] bg-white dark:bg-white/5');

fs.writeFileSync('app/components/nhan-vien/UserKpiPanel.tsx', content);
