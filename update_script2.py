import sys
content = open('frontend/app/components/giao-dien/SystemConfigPage.tsx', 'r', encoding='utf-8').read()

import_target = """import { useToast } from "@/app/hooks/useToast\""""
import_replace = """import { useToast } from "@/app/hooks/useToast"
import { AdminUtilitiesOverlay } from "./AdminUtilitiesOverlay\""""
content = content.replace(import_target, import_replace)

state_target = """  const [activeDrawer, setActiveDrawer] = useState<"admin" | "bxh" | null>(null)"""
state_replace = """  const [activeDrawer, setActiveDrawer] = useState<"admin" | "bxh" | null>(null)
  const [activeOverlayTab, setActiveOverlayTab] = useState<string | null>(null)"""
content = content.replace(state_target, state_replace)

menu_target = """              {[
                { label: "Quản lý admin", action: () => handleOpenAdminManagement() },
                { label: "Điều chỉnh chấm công", action: () => {} },
                { label: "BXH gắn bó", action: () => handleOpenLoyaltyBoard() },
              ].map(item => ("""
menu_replace = """              {[
                { label: "Quản lý admin", action: () => setActiveOverlayTab("admin") },
                { label: "Điều chỉnh chấm công", action: () => setActiveOverlayTab("attendance") },
                { label: "BXH gắn bó", action: () => setActiveOverlayTab("bxh") },
              ].map(item => ("""
content = content.replace(menu_target, menu_replace)

overlay_target = """      {/* Right Drawer Overlay */}"""
overlay_replace = """      {activeOverlayTab && (
        <AdminUtilitiesOverlay 
          initialTab={activeOverlayTab} 
          onClose={() => setActiveOverlayTab(null)} 
        />
      )}

      {/* Right Drawer Overlay */}"""
content = content.replace(overlay_target, overlay_replace)

open('frontend/app/components/giao-dien/SystemConfigPage.tsx', 'w', encoding='utf-8').write(content)
