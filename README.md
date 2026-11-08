# STATUS SEAT PLAN A320-05 · ตรวจสภาพที่นั่ง, Monitor, Galley และห้องน้ำ

หน้าเว็บให้ฝ่ายการช่าง/ฝ่ายสื่อสารบันทึกสภาพที่นั่ง, Monitor, อุปกรณ์ Galley และห้องน้ำของเครื่อง A320-05
(ที่นั่ง 76, Monitor 21 จอ, อุปกรณ์ Galley 45 รายการ, ห้องน้ำ 5 ห้อง)
ข้อมูลทุกครั้งที่กด **SAVE** จะบันทึกลง Google Sheet **Seat Plan 320(05) (For Admin)** โดยตรง
และเพิ่มบรรทัดในแท็บ **ประวัติการแก้ไข**

> วิธีออกแบบ Galley / ห้องน้ำ / ประตู และวิธีนำไปใช้กับเครื่องลำอื่น ดู [`docs/GALLEY_LAV_GUIDE.md`](docs/GALLEY_LAV_GUIDE.md)
> สิ่งที่เปลี่ยนจากรุ่นก่อน ดู [`CHANGELOG.md`](CHANGELOG.md)

| ไฟล์ | หน้าที่ |
|---|---|
| `index.html` | หน้าเว็บ: ผังที่นั่ง + Galley + ห้องน้ำ + ประตู, ปุ่ม CLEAR / PREVIEW / SAVE / EXPORT TO PDF ALL PAGES / EXPORT SUMMARY 4 PAGES / EXPORT TO EXCEL |
| `layout.js` | ผังในชีท "ผังที่นั่ง" (ตำแหน่งช่อง, ชื่อ, สูตรสรุป) ใช้ร่วมกันระหว่าง EXPORT TO EXCEL และ Apps Script |
| `export-excel.js` | สร้างไฟล์ EXPORT TO EXCEL 5 แผ่นงาน (ดูด้านล่าง) |
| `config.js` | ใส่ URL ของ Apps Script Web App |
| `apps-script/server.js` | โค้ดฝั่ง Apps Script (อ่าน/บันทึก/ประวัติ/สร้างแท็บ) |
| `apps-script/Code.gs` | ไฟล์ที่วางใน Apps Script = `server.js` + `layout.js` (สร้างด้วย `tools/build-code-gs.sh`) |
| `docs/GALLEY_LAV_GUIDE.md` | คู่มือการออกแบบสำหรับนำไปประยุกต์กับโปรเจกต์อื่น |

## ผังที่นั่ง

| โซน | ที่นั่ง | Monitor | Galley / ห้องน้ำ / ประตู |
|---|---|---|---|
| FRONT CREW ZONE | Commander Center 1A (ห้อง), 1D 1E 1F | Wall 21.5" หน้า CC 1A, หน้า 1D-1F | LAV A (ซ้าย, กว้างเท่าห้อง Commander Center), FWD GALLEY G1 (ขวา, แนว 1D-1F), DOOR 1L / 1R |
| VVIP OA | 2A 4A, 3D 3F (โต๊ะระหว่าง 2A-4A) | Wall 27" หน้า 2A, หน้า 3D-3F, หลัง 4A | FWD VIP LAV (แนว 3D-3F) |
| VIP OB | 5A 5D 5F, 6A 6D 6F (โต๊ะระหว่างแถว 5-6) | Wall 27" หน้า 5A, หน้า 5D-5F, หลัง 6A, หลัง 6D-6F | EMERGENCY EXIT (OVERWING) FWD L / R หลังแถว 6 |
| VIP OC | 7B 7C 7D 7F, 8B 8C 8D 8F | Wall 21.5" หน้า 7B-7C, หน้า 7D-7F | CENTER VIP LAV (แนว 7D-7F) + EMERGENCY EXIT (OVERWING) AFT L / R แถวเดียวกัน |
| PASSENGER OD | แถว 9–18 (ไม่มีแถว 13) A–F | Wall 21.5" หน้า 9A-9C, 9D-9F · OVHD Monitor 12" หน้าแถว 10, 12, 15, 17 (ซ้าย/ขวา) | LAV D / LAV E หลังแถว 18, DOOR 4L / 4R, AFT GALLEY G5 |

### Galley (ตามคู่มือ A320 CCOM-S 02-140)
- **FWD GALLEY = G1** (18 รายการ): Stow 1-4, Refrigerator, Steam Oven, CM 1-2, Hot Cup, Faucet (มี Sink), Work Light, Trolley Stowage 1-2, Microwave, Water Heater (ใน Stow 4), Waste, Air Chiller, 220VAC Power Outlet
- **AFT GALLEY = G5** (27 รายการ): Stow 1-10, Water Boiler, CM 1-2, Steam Oven 1-3, Microwave, Work Light, Faucet (มี Sink), 220VAC Power Outlet, Waste Compartment, Water Heater (ใน Stow 9), Full Size Trolley Stowage 1-5
- Stowage ไล่เลขจากแถวบนลงล่าง ซ้ายไปขวา · ช่องลายเส้น (Elec. Panel, Sink, ขอบลำ) = ไม่ได้ตรวจ
- สภาพอุปกรณ์และห้องน้ำ 3 ระดับ: **ใช้งานได้ / ใช้งานได้บางส่วน / ใช้งานไม่ได้**

ชนิดจอ: Wall Mounted Monitor 21.5 Inch (6 จอ), Wall Mounted Monitor 27.0 Inch (7 จอ),
Bin Mounted Retractable Monitors (OVHD Monitor) 12 Inch (8 จอ)

## ปุ่มและรายงาน
| ปุ่ม | ผลลัพธ์ |
|---|---|
| PREVIEW ALL PAGES / PREVIEW SUMMARY 4 PAGES | ดูรายงานก่อน EXPORT (บนมือถือย่อให้เห็นเต็มหน้ากระดาษ) |
| EXPORT TO PDF ALL PAGES | A4 แนวตั้ง: สรุปตามโซน, Monitor, Galley (แยก G1 / G5), ห้องน้ำ, ผังทุกโซน, รายการข้อขัดข้อง · ไม่ตัดตารางกลางกลุ่มข้ามหน้า |
| EXPORT SUMMARY 4 PAGES | A4 แนวนอน: 1 ผังที่นั่ง + ประตู, 2 ข้อขัดข้องที่นั่ง, 3 ผัง Galley และห้องน้ำ (หัวเครื่องซ้าย-ท้ายขวา), 4 ข้อขัดข้อง Galley และห้องน้ำ |
| EXPORT TO EXCEL | 5 แผ่นงาน: ผังที่นั่ง · Galley และห้องน้ำ · รวมข้อขัดข้องคงค้าง · ทุกที่นั่ง และ Monitor · ประวัติการแก้ไข |

PDF ทั้งสองแบบสร้างที่ **600 dpi** (บน iPhone/iPad/Android ลดลงอัตโนมัติตามขนาดภาพสูงสุดที่เครื่องรองรับ)
ชื่อไฟล์: `YYMMDD HHMM TH-LT A320-05_STATUS_SEAT_PLAN_ALL PAGES.pdf`, `..._SUMMARY_4PAGES.pdf`, `..._STATUS_SEAT_PLAN.xlsx`

## การติดตั้ง (ทำครั้งเดียว)

### 1. เปิดหน้าเว็บด้วย GitHub Pages
1. ใน repo นี้ ไปที่ **Settings > Pages**
2. Source เลือก **Deploy from a branch**, Branch เลือก **main** และ **/ (root)** แล้วกด Save
3. รอ 1–2 นาที หน้าเว็บจะอยู่ที่ `https://rtaf602.github.io/a320-05_seatplan/`

### 2. ติดตั้ง Apps Script ใน Google Sheet
1. เปิด Google Sheet **Seat Plan 320(05) (For Admin)** > **ส่วนขยาย (Extensions) > Apps Script**
2. ลบโค้ดเดิมทั้งหมดใน `Code.gs` แล้ววางโค้ดจาก `apps-script/Code.gs`
3. ถ้าต้องการรหัส ให้แก้บรรทัด `WRITE_PIN` / `ADMIN_PIN` (ส่วน "ตั้งค่า" ต้นไฟล์)
4. กด **บันทึก (Save)**
5. **สร้าง/จัดแท็บใหม่:** เลือกฟังก์ชัน **setupSheet** แล้วกด **Run**
   ระบบจะสร้างแท็บ **ผังที่นั่ง**, **Galley และห้องน้ำ**, **รวมข้อขัดข้องคงค้าง**, **ทุกที่นั่ง และ Monitor**, **ประวัติการแก้ไข**
   (ถ้ามีผังเดิม สภาพและหมายเหตุของที่นั่ง/จอเดิมยังอยู่ ประวัติไม่หาย)
6. **Deploy > New deployment** > Web app · Execute as: **Me** · Who has access: **Anyone** แล้วคัดลอก URL (`/exec`)
   ถ้าเคย Deploy แล้ว: **Deploy > Manage deployments >** ดินสอ > Version **New version** > Deploy (URL เดิมใช้ต่อได้)

### 3. เชื่อมหน้าเว็บกับชีท
แก้ `config.js` ใส่ URL จากข้อ 2.6 กด Commit แล้วรีเฟรชหน้าเว็บ แถบด้านบนจะขึ้น "ข้อมูลจาก Google Sheet"

## เมื่อแก้ผัง
แก้ `layout.js` (ผังในชีท) และ `index.html` (ผังบนเว็บ) ให้ตรงกัน แล้วรัน `tools/build-code-gs.sh`
เพื่อสร้าง `apps-script/Code.gs` ใหม่ วางใน Apps Script, รัน **setupSheet** และ Deploy New version

## การทำงาน
- หน้าเว็บอ่าน/บันทึกที่แท็บ "ผังที่นั่ง" และดึงข้อมูลใหม่ทุก 30 วินาที
- แต่ละรายการในชีทมี 3 ช่องเรียงลงมา: ชื่อ / สภาพ (dropdown) / NOTE · Apps Script หาตำแหน่งจากชื่อ
  (ชื่อซ้ำ เช่น `Stow 1` ของ G1 และ G5 จับคู่ตามลำดับในผัง บนลงล่าง ซ้ายไปขวา) จึงห้ามแก้ข้อความชื่อในชีท
- SAVE เขียนเฉพาะช่องที่แก้จริง ถ้าชนกับคนอื่นจะถามก่อน ไม่บันทึกทับ
- แก้ในชีทโดยตรงก็บันทึกประวัติ และหน้าเว็บเห็นค่าใหม่ในรอบดึงข้อมูลถัดไป
- ถ้ายังไม่ได้ใส่ `API_URL` หน้าเว็บยังเปิดดูและแก้ได้ แต่ SAVE ไม่ได้

## ข้อควรรู้ด้านความปลอดภัย
- Web App ตั้งเป็น "Anyone" ใครได้ URL ก็อ่าน/บันทึกได้ จึงแนะนำให้ตั้ง `WRITE_PIN`
- Repo เป็น public ห้ามใส่รหัสใน `config.js` หรือไฟล์ใดใน repo ให้ตั้งรหัสเฉพาะใน Apps Script
- ควรล็อกแท็บ "ประวัติการแก้ไข" ด้วย Protect sheet ให้เฉพาะ Admin
