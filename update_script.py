import sys
content = open('frontend/app/components/giao-dien/SystemConfigPage.tsx', 'r', encoding='utf-8').read()

# 1. State changes
state_target = """  const [activeDrawer, setActiveDrawer] = useState<"admin" | null>(null)
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null)
  const [editLoginId, setEditLoginId] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingAdmin, setIsSavingAdmin] = useState(false)
  const { showToast } = useToast()"""

state_replace = """  const [activeDrawer, setActiveDrawer] = useState<"admin" | "bxh" | null>(null)
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null)
  const [editLoginId, setEditLoginId] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingAdmin, setIsSavingAdmin] = useState(false)
  const [employeesBxh, setEmployeesBxh] = useState<any[]>([])
  const [isLoadingBxh, setIsLoadingBxh] = useState(false)
  const [bxhBranchFilter, setBxhBranchFilter] = useState("all")
  const [bxhDeptFilter, setBxhDeptFilter] = useState("all")
  const { showToast } = useToast()"""

content = content.replace(state_target, state_replace)

# 2. handleOpenLoyaltyBoard
func_target = """    } finally {
      setIsSavingAdmin(false)
    }
  }"""

func_replace = """    } finally {
      setIsSavingAdmin(false)
    }
  }

  const handleOpenLoyaltyBoard = async () => {
    setActiveDrawer("bxh")
    setIsLoadingBxh(true)
    try {
      const emps = await api.employees.list({ status: "active" })
      setEmployeesBxh(emps || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingBxh(false)
    }
  }"""

content = content.replace(func_target, func_replace)

# 3. Menu items
menu_target = """              {[
                { label: "Quản lý admin", action: () => handleOpenAdminManagement() },
                { label: "Điều chỉnh chấm công", action: () => {} },
                { label: "BXH gắn bó", action: () => {} },
                { label: "Sinh mã nhân viên", action: () => {} },
              ].map(item => ("""

menu_replace = """              {[
                { label: "Quản lý admin", action: () => handleOpenAdminManagement() },
                { label: "Điều chỉnh chấm công", action: () => {} },
                { label: "BXH gắn bó", action: () => handleOpenLoyaltyBoard() },
              ].map(item => ("""

content = content.replace(menu_target, menu_replace)

# 4. Icon Header Drawer
drawer_header_target = """              <div className="flex items-center gap-2.5">
                {activeDrawer === "admin" && <><Lock size={17} /><h3 className="font-bold text-sm">Quản lý tài khoản Quản trị</h3></>}
              </div>"""

drawer_header_replace = """              <div className="flex items-center gap-2.5">
                {activeDrawer === "admin" && <><Lock size={17} /><h3 className="font-bold text-sm">Quản lý tài khoản Quản trị</h3></>}
                {activeDrawer === "bxh" && <><Users size={17} /><h3 className="font-bold text-sm">Bảng xếp hạng gắn bó</h3></>}
              </div>"""

content = content.replace(drawer_header_target, drawer_header_replace)

# 5. Add Panel
panel_target = """                    </div>
                  )}
                </div>
              )}
            </div>"""
            
panel_replace = """                    </div>
                  )}
                </div>
              )}

              {/* ── Panel: BXH Gắn bó ── */}
              {activeDrawer === "bxh" && (
                <div className="p-6 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed bg-amber-50 border border-amber-100 rounded-xl p-3">
                    Xếp hạng độ gắn bó của nhân sự từ lâu nhất đến thấp nhất. Lọc danh sách làm việc ở theo nhánh và phòng ban.
                  </p>
                  
                  {isLoadingBxh ? (
                    <div className="py-14 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                       <RefreshCw size={22} className="animate-spin text-gray-300" />
                       Đang tải dữ liệu...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={bxhBranchFilter}
                          onChange={e => {
                            setBxhBranchFilter(e.target.value);
                            setBxhDeptFilter("all");
                          }}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#C62828]"
                        >
                          <option value="all">Tất cả chi nhánh</option>
                          {Array.from(new Set(employeesBxh.map(e => e.branchId).filter(Boolean))).map(branch => (
                            <option key={branch as string} value={branch as string}>{branch as string}</option>
                          ))}
                        </select>

                        <select
                          value={bxhDeptFilter}
                          onChange={e => setBxhDeptFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#C62828]"
                        >
                          <option value="all">Tất cả phòng ban</option>
                          {Array.from(new Set(
                            employeesBxh
                              .filter(e => bxhBranchFilter === "all" || e.branchId === bxhBranchFilter)
                              .map(e => e.department)
                              .filter(Boolean)
                          )).map(dept => (
                            <option key={dept as string} value={dept as string}>{dept as string}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-3">
                        {(() => {
                           let filtered = bxhBranchFilter === "all" ? employeesBxh : employeesBxh.filter(e => e.branchId === bxhBranchFilter);
                           if (bxhDeptFilter !== "all") {
                             filtered = filtered.filter(e => e.department === bxhDeptFilter);
                           }
                           
                           const now = new Date();
                           const withDuration = filtered.map(emp => {
                             const jd = new Date(emp.joinDate || now);
                             const diffTime = Math.abs(now.getTime() - jd.getTime());
                             const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                             return { ...emp, days };
                           }).sort((a, b) => b.days - a.days);

                           if (withDuration.length === 0) {
                             return <div className="text-center text-xs text-gray-400 py-4">Không có nhân sự nào</div>;
                           }

                           return withDuration.map((emp, idx) => (
                             <div key={emp.id} className="border border-gray-150 rounded-2xl p-3 flex items-center justify-between bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
                               {idx < 3 && (
                                 <div className={`absolute top-0 right-0 w-8 h-8 rounded-bl-2xl flex items-center justify-center text-white font-black text-xs ${idx === 0 ? "bg-amber-400" : idx === 1 ? "bg-slate-300" : "bg-orange-300"}`}>
                                   #{idx + 1}
                                 </div>
                               )}
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center text-[#C62828] font-black text-sm">
                                   {(emp.name || "?").charAt(0)}
                                 </div>
                                 <div className="pr-6">
                                   <h4 className="text-sm font-bold text-gray-800">{emp.name}</h4>
                                   <p className="text-[10px] text-gray-500 font-medium my-0.5">
                                     {emp.branchId ? <span className="text-[#C62828]">{emp.branchId}</span> : "CHƯA RÕ"} • {emp.department || "Chưa phân phòng ban"}
                                   </p>
                                   <p className="text-[11px] text-gray-400 font-mono mt-1">Ngày gia nhập: {emp.joinDate || "---"}</p>
                                 </div>
                               </div>
                               <div className="text-right flex flex-col items-end pr-2">
                                 <span className="text-lg font-black text-[#C62828] leading-none">{emp.days}</span>
                                 <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1">Ngày</span>
                               </div>
                             </div>
                           ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>"""

content = content.replace(panel_target, panel_replace, 1)

open('frontend/app/components/giao-dien/SystemConfigPage.tsx', 'w', encoding='utf-8').write(content)
