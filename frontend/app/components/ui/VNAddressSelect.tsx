import React, { useState, useEffect } from "react"
import { CustomSelect } from "./CustomSelect"

interface VNUnit {
  code: number
  name: string
}

function cleanName(s: string): string {
  if (!s) return ""
  return s.toLowerCase()
    .replace(/^(thành phố|tỉnh|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, "")
    .trim()
}

export function VNAddressSelect({
  province,
  district,
  ward,
  onChange,
  lblClass,
  selClass,
  inpClass,
  disabled = false,
}: {
  province: string
  district: string
  ward: string
  onChange: (addr: { province: string; district: string; ward: string }) => void
  lblClass?: string
  selClass?: string
  inpClass?: string
  disabled?: boolean
}) {
  const [provinces, setProvinces] = useState<VNUnit[]>([])
  const [districts, setDistricts] = useState<VNUnit[]>([])
  const [wards, setWards] = useState<VNUnit[]>([])

  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)

  useEffect(() => {
    const cached = localStorage.getItem("dudi_vn_provinces")
    if (cached) {
      setProvinces(JSON.parse(cached))
      return
    }

    setLoadingProvinces(true)
    fetch("https://provinces.open-api.vn/api/?depth=1")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const list = data.map((item: any) => ({ code: item.code, name: item.name }))
          localStorage.setItem("dudi_vn_provinces", JSON.stringify(list))
          setProvinces(list)
        }
      })
      .catch(err => console.error("Lỗi lấy danh sách tỉnh thành:", err))
      .finally(() => setLoadingProvinces(false))
  }, [])

  const currentProvinceCode = provinces.find(p => cleanName(p.name) === cleanName(province))?.code

  useEffect(() => {
    if (!currentProvinceCode) {
      setDistricts([])
      setWards([])
      return
    }

    const cacheKey = `dudi_vn_districts_${currentProvinceCode}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      setDistricts(JSON.parse(cached))
      return
    }

    setLoadingDistricts(true)
    fetch(`https://provinces.open-api.vn/api/p/${currentProvinceCode}?depth=2`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.districts)) {
          const list = data.districts.map((item: any) => ({ code: item.code, name: item.name }))
          localStorage.setItem(cacheKey, JSON.stringify(list))
          setDistricts(list)
        }
      })
      .catch(err => console.error("Lỗi lấy danh sách quận huyện:", err))
      .finally(() => setLoadingDistricts(false))
  }, [currentProvinceCode])

  const currentDistrictCode = districts.find(d => cleanName(d.name) === cleanName(district))?.code

  useEffect(() => {
    if (!currentDistrictCode) {
      setWards([])
      return
    }

    const cacheKey = `dudi_vn_wards_${currentDistrictCode}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      setWards(JSON.parse(cached))
      return
    }

    setLoadingWards(true)
    fetch(`https://provinces.open-api.vn/api/d/${currentDistrictCode}?depth=2`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.wards)) {
          const list = data.wards.map((item: any) => ({ code: item.code, name: item.name }))
          localStorage.setItem(cacheKey, JSON.stringify(list))
          setWards(list)
        }
      })
      .catch(err => console.error("Lỗi lấy danh sách phường xã:", err))
      .finally(() => setLoadingWards(false))
  }, [currentDistrictCode])

  const handleProvinceSelect = (name: string) => {
    if (disabled) return
    onChange({ province: name, district: "", ward: "" })
  }

  const handleDistrictSelect = (name: string) => {
    if (disabled) return
    onChange({ province, district: name, ward: "" })
  }

  const handleWardSelect = (name: string) => {
    if (disabled) return
    onChange({ province, district, ward: name })
  }

  return (
    <>
      <div>
        <label className={lblClass}>Tỉnh / Thành phố</label>
        {provinces.length > 0 ? (
          <CustomSelect
            value={province}
            onChange={handleProvinceSelect}
            options={provinces.map(p => ({ value: p.name, label: p.name }))}
            disabled={disabled || loadingProvinces}
            className="w-full"
            heightClass="h-[42px]"
          />
        ) : (
          <input
            value={province}
            onChange={e => onChange({ province: e.target.value, district: "", ward: "" })}
            placeholder="Tỉnh / Thành phố..."
            className={inpClass}
            disabled={disabled}
          />
        )}
      </div>

      <div>
        <label className={lblClass}>Quận / Huyện</label>
        {districts.length > 0 ? (
          <CustomSelect
            value={district}
            onChange={handleDistrictSelect}
            options={districts.map(d => ({ value: d.name, label: d.name }))}
            disabled={disabled || loadingDistricts || !province}
            className="w-full"
            heightClass="h-[42px]"
          />
        ) : (
          <input
            value={district}
            onChange={e => onChange({ province, district: e.target.value, ward: "" })}
            placeholder="Quận / Huyện..."
            className={inpClass}
            disabled={disabled || !province}
          />
        )}
      </div>

      <div>
        <label className={lblClass}>Phường / Xã</label>
        {wards.length > 0 ? (
          <CustomSelect
            value={ward}
            onChange={handleWardSelect}
            options={wards.map(w => ({ value: w.name, label: w.name }))}
            disabled={disabled || loadingWards || !district}
            className="w-full"
            heightClass="h-[42px]"
          />
        ) : (
          <input
            value={ward}
            onChange={e => onChange({ province, district, ward: e.target.value })}
            placeholder="Phường / Xã..."
            className={inpClass}
            disabled={disabled || !district}
          />
        )}
      </div>
    </>
  )
}
