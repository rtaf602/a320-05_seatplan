# CHANGELOG

## 2026-11-12 · ใช้ระบบ Login กลาง ฝูง.602
- เอารหัส WRITE_PIN / ADMIN_PIN และช่องพิมพ์ชื่อผู้ตรวจออก เข้าใช้งานผ่านหน้าเข้าสู่ระบบกลาง (รหัสเว็บ WEB3)
- Admin / Editor แก้ไขและ SAVE ได้ · Viewer ดูอย่างเดียว · ล้างข้อมูลทั้งหมดเฉพาะ Admin ของเว็บนี้
- ชื่อผู้ตรวจ = ชื่อ-สกุลของบัญชีที่ Login · การส่งออก PDF / Excel บันทึกในแท็บ "ประวัติการส่งออก"

## 2026-11-09 · ทางออกฉุกเฉินเหลือคู่เดียว
- เหลือเฉพาะทางออกที่ VIP OB ชื่อ **EMER EXIT L / EMER EXIT R** (เอา EMER EXIT AFT ออก) ทั้งหน้าเว็บ, PDF ทุกแบบ, Excel และ Google Sheet
- ในชีท/Excel: EMER EXIT อยู่คอลัมน์ A และ P นอกขอบสีฟ้า, DOOR 1L/1R และ 4L/4R ลากถึงขอบ (A-H, J-P)
- ต้องวาง `Code.gs` ใหม่ รัน `setupSheet` และ Deploy New version

## 2026-11-09 · เพิ่ม Galley, ห้องน้ำ และประตู (ต่อยอดแบบ A340)

### หน้าเว็บ
- ชื่อระบบ **STATUS SEAT PLAN A320-05** (ชื่อไฟล์ EXPORT แบบเดียวกับ A340: `YYMMDD HHMM TH-LT A320-05_STATUS_SEAT_PLAN_...`)
- เพิ่ม **FWD GALLEY (G1)** 18 รายการ และ **AFT GALLEY (G5)** 27 รายการ จัดตามคู่มือ A320 CCOM-S 02-140
- เพิ่มห้องน้ำ 5 ห้อง: LAV A, FWD VIP LAV, CENTER VIP LAV, LAV D, LAV E (กว้างเท่าที่นั่งฝั่งนั้นในโซน)
- เพิ่ม DOOR 1L/1R, EMERGENCY EXIT (OVERWING) FWD/AFT L/R (แสดงเฉพาะขอบ), DOOR 4L/4R
- ตารางสรุป Galley และสรุปห้องน้ำ; บนมือถือแยกสรุปโซนเป็นตาราง ที่นั่ง / Monitor
- ปุ่มเปลี่ยนชื่อ: EXPORT TO PDF ALL PAGES, EXPORT SUMMARY 4 PAGES, PREVIEW ALL PAGES, PREVIEW SUMMARY 4 PAGES
- PREVIEW ALL PAGES บนมือถือย่อให้เห็นเต็มหน้ากระดาษ

### PDF
- ความคมชัด 600 dpi (มือถือลดอัตโนมัติ)
- SUMMARY 4 PAGES: หน้า 3 ผัง Galley/ห้องน้ำ/ประตู + สรุป, หน้า 4 ข้อขัดข้อง Galley/ห้องน้ำ
- ALL PAGES: ไม่ตัดตารางกลุ่มเดียวกันข้ามหน้า, แก้ตัวหนังสือแนวตั้งกลับด้าน, ไอคอนห้องน้ำ, ลายเส้น Elec. Panel

### Excel
- แผ่นงานใหม่ "Galley และห้องน้ำ" (ลำดับแผ่นงานแบบ A340)
- ผังมี Galley / ห้องน้ำ / ประตู, ชื่ออุปกรณ์พื้นเขียวแบบ A340, ตัวหนังสือไม่ล้นช่อง, หัวตารางไม่ตัดกลางคำ

### Apps Script
- รองรับรายการชนิด `eq` / `lav` (สภาพ 3 ระดับ) ในการอ่าน, SAVE, ล้างข้อมูล, ประวัติ และ dropdown
- แท็บใหม่ "Galley และห้องน้ำ"; "รวมข้อขัดข้องคงค้าง" รวมข้อขัดข้อง Galley/ห้องน้ำด้วย
- **ต้องวาง `Code.gs` ใหม่ รัน `setupSheet` และ Deploy New version** (ค่าที่นั่ง/จอเดิมและประวัติยังอยู่)
