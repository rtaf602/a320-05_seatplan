#!/bin/sh
# สร้าง apps-script/Code.gs = layout.js + apps-script/server.js (ไฟล์เดียวสำหรับวางใน Apps Script)
cd "$(dirname "$0")/.." || exit 1
{
  printf '%s\n' '/**' \
    ' * Seat Plan 320(05) (For Admin) — Apps Script' \
    ' *' \
    ' * 1) สร้างแท็บในชีท: เลือกฟังก์ชัน setupSheet แล้วกด Run (ครั้งแรกครั้งเดียว)' \
    ' * 2) เป็น API ให้หน้าเว็บ (GitHub Pages) อ่าน/บันทึกสภาพที่นั่งและ Monitor ลงแท็บ "ผังที่นั่ง"' \
    ' *    และบันทึกประวัติลงแท็บ "ประวัติการแก้ไข" ทุกครั้งที่กด SAVE บนเว็บ' \
    ' * 3) บันทึกประวัติอัตโนมัติเมื่อมีคนแก้ไขช่องในชีทโดยตรง (onEdit)' \
    ' *' \
    ' * ไฟล์นี้สร้างจาก layout.js + apps-script/server.js ด้วย tools/build-code-gs.sh วิธีติดตั้งดู README.md' \
    ' */' ''
  cat layout.js
  printf '\n'
  cat apps-script/server.js
} > apps-script/Code.gs
