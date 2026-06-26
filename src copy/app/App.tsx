import {
  Phone,
  Mail,
  Calendar,
  MapPin,
  Building2,
  User,
  CreditCard,
  GraduationCap,
  FileText,
  Clock,
  Printer,
  Pencil,
} from "lucide-react";

const employee = {
  id: "001",
  name: "Trần Thị Bích Liên",
  department: "Frontend",
  position: "Senior Developer",
  phone: "0901 234 567",
  email: "lien.tran@dudi.vn",
  gender: "Nam",
  startDate: "28/05/2026",
  contractType: "Chính thức",
  status: "Đang làm",
  cccd: "---",
  cccdDate: "---",
  cccdPlace: "---",
  bankAccount: "---",
  bank: "---",
  birthday: "---",
  university: "---",
  notes: "---",
  endDate: "---",
  resignDate: "---",
  address: "---",
  hometown: "---",
};

function InfoField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0 group">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-400 mb-0.5">
        {Icon && <Icon size={10} strokeWidth={2.5} />}
        {label}
      </span>
      <span
        className="text-sm font-medium text-gray-800"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function App() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 sm:p-10"
      style={{
        background:
          "radial-gradient(ellipse at 20% 50%, #7f1d1d 0%, #1a0505 60%, #0a0a0a 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="w-full max-w-5xl relative">
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,38,38,0.2)" }}
        >
          <div
            className="h-1"
            style={{
              background: "linear-gradient(90deg, #dc2626 0%, #f87171 50%, #dc2626 100%)",
            }}
          />

          <div className="flex flex-col sm:flex-row">
            {/* LEFT PANEL */}
            <div
              className="sm:w-72 flex-shrink-0 flex flex-col items-center p-8 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(160deg, #dc2626 0%, #991b1b 40%, #7f1d1d 100%)",
              }}
            >
              <div
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
              <div
                className="absolute top-32 -left-10 w-32 h-32 rounded-full"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
              <div
                className="absolute -bottom-20 -right-8 w-56 h-56 rounded-full"
                style={{ background: "rgba(0,0,0,0.15)" }}
              />
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)",
                }}
              />

              <div className="self-start relative z-10 mb-6">
                <span
                  className="text-[10px] font-bold tracking-[0.3em] uppercase text-red-200 opacity-80"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  DUDI Corp
                </span>
              </div>

              <div className="relative z-10 mb-5">
                <div
                  className="w-28 h-28 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "2px solid rgba(255,255,255,0.25)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <User size={52} strokeWidth={1.5} className="text-white opacity-80" />
                </div>
                <div
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: "#22c55e",
                    border: "2.5px solid #991b1b",
                    boxShadow: "0 0 10px rgba(34,197,94,0.5)",
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              </div>

              <h1
                className="text-white text-xl font-bold text-center leading-snug relative z-10"
                style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.02em" }}
              >
                {employee.name}
              </h1>
              <p className="text-red-200 text-sm mt-1 font-medium relative z-10">
                {employee.position}
              </p>

              <div className="w-full h-px my-6 relative z-10" style={{ background: "rgba(255,255,255,0.2)" }} />

              <div
                className="w-full relative z-10 rounded-xl p-5"
                style={{
                  background: "rgba(0,0,0,0.25)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div className="text-center mb-4">
                  <span className="text-[10px] text-red-300 font-semibold tracking-[0.2em] uppercase">
                    Mã Nhân Viên
                  </span>
                  <p
                    className="text-white text-3xl font-bold tracking-widest mt-1"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {employee.id}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { label: "Phòng ban", value: employee.department },
                    { label: "Hợp đồng", value: employee.contractType },
                    { label: "Ngày bắt đầu", value: employee.startDate },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[11px] text-red-300 font-medium">{label}</span>
                      <span className="text-[11px] text-white font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 relative z-10">
                <span
                  className="inline-flex items-center gap-2 text-xs font-bold px-4 py-1.5 rounded-full"
                  style={{
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#86efac",
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  {employee.status}
                </span>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="px-8 py-6 flex items-center justify-between border-b border-gray-100">
                <div>
                  <h2
                    className="text-2xl font-bold text-gray-900"
                    style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }}
                  >
                    Thông tin nhân sự
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium tracking-wide">
                    Hồ sơ nhân viên chi tiết · {employee.id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
                    <Printer size={13} />
                    In hồ sơ
                  </button>
                  <button
                    className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}
                  >
                    <Pencil size={13} />
                    Chỉnh sửa
                  </button>
                </div>
              </div>

              <div className="px-8 py-5 flex-1 overflow-y-auto">
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#dc2626" }}>
                      Thông tin cá nhân
                    </span>
                    <div className="flex-1 h-px bg-red-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                    <InfoField label="Ngày sinh" value={employee.birthday} icon={Calendar} />
                    <InfoField label="Số điện thoại" value={employee.phone} icon={Phone} />
                    <InfoField label="Giới tính" value={employee.gender} icon={User} />
                    <InfoField label="Email" value={employee.email} icon={Mail} />
                    <InfoField label="Số CCCD" value={employee.cccd} icon={CreditCard} />
                    <InfoField label="Trường ĐH" value={employee.university} icon={GraduationCap} />
                    <InfoField label="Ngày cấp CCCD" value={employee.cccdDate} icon={Calendar} />
                    <InfoField label="Ghi chú" value={employee.notes} icon={FileText} />
                    <InfoField label="Nơi cấp CCCD" value={employee.cccdPlace} icon={MapPin} />
                    <InfoField label="Số tài khoản" value={employee.bankAccount} icon={CreditCard} />
                    <InfoField label="Ngân hàng" value={employee.bank} icon={Building2} />
                  </div>
                </div>

                <div className="mt-4 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#dc2626" }}>
                      Thông tin công việc
                    </span>
                    <div className="flex-1 h-px bg-red-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                    <InfoField label="Ngày kết thúc TT" value={employee.endDate} icon={Calendar} />
                    <InfoField label="Loại hợp đồng" value={employee.contractType} icon={FileText} />
                    <InfoField label="Ngày nghỉ việc" value={employee.resignDate} icon={Clock} />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "#dc2626" }}>
                      Địa chỉ
                    </span>
                    <div className="flex-1 h-px bg-red-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
                    <InfoField label="Địa chỉ hiện tại" value={employee.address} icon={MapPin} />
                    <InfoField label="Quê quán" value={employee.hometown} icon={MapPin} />
                  </div>
                </div>
              </div>

              <div className="px-8 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#dc2626" }} />
                  <span className="text-[11px] text-gray-400 font-medium">
                    Cập nhật lần cuối: 28/05/2026
                  </span>
                </div>
                <span className="text-[11px] text-gray-300 font-medium">
                  DUDI HR System · v2.4
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full"
          style={{
            background: "rgba(220,38,38,0.3)",
            filter: "blur(20px)",
          }}
        />
      </div>
    </div>
  );
}
