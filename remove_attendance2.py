import sys
import re

content = open('frontend/app/components/giao-dien/SystemConfigPage.tsx', 'r', encoding='utf-8').read()

# Remove the button for attendance
button_pattern = r'<button[^>]*onClick=\{\(\) => setActiveTab\("attendance"\)\}[^>]*>[\s\S]*?<\/button>'
content = re.sub(button_pattern, '', content)

# Remove the render logic for attendance
render_pattern = r'\{activeTab === "attendance" && <AttendanceAdjustmentTab \/>\}'
content = re.sub(render_pattern, '', content)

# Remove the AttendanceAdjustmentTab component completely
func_pattern = r'function AttendanceAdjustmentTab\(\) \{[\s\S]*?\}\n'
content = re.sub(func_pattern, '', content)

open('frontend/app/components/giao-dien/SystemConfigPage.tsx', 'w', encoding='utf-8').write(content)
