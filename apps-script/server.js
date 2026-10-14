/* ======================================================================
 * ส่วนทำงานของ Apps Script (ต่อจากผังที่นั่งด้านบน)
 * ====================================================================== */

// ---------- ตั้งค่า ----------
const MAP_SHEET = 'ผังที่นั่ง';
const LOG_SHEET = 'ประวัติการแก้ไข';
const ALL_SHEET = 'ทุกที่นั่ง และ Monitor';
const BAD_SHEET = 'รวมข้อขัดข้องคงค้าง';
const INSPECTOR_CELL = 'D3';   // ช่องชื่อผู้ตรวจในชีท
const LASTSAVE_BY = 'D2', LASTSAVE_AT = 'M2';
const WRITE_PIN = '';          // รหัสเข้าหน้าเว็บและ SAVE เช่น '6020' (เว้นว่าง = ไม่ต้องใช้รหัส)
const ADMIN_PIN = '';          // รหัสสำหรับปุ่ม "ล้างข้อมูลทั้งหมด" บนเว็บ (เว้นว่าง = ปิดปุ่มนี้)
const TZ = 'Asia/Bangkok';
const LAYOUT = seatPlanLayout();
const FIRST_MAP_ROW = planSheet(LAYOUT).firstMapRow;

// ---------- Web API ----------
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'load';
  try {
    ensureSetup_();
    if (action === 'load') {
      if (WRITE_PIN) return json_({ ok: false, error: 'pin' });  // มีรหัส: ต้องโหลดผ่าน POST พร้อมรหัส
      return json_(loadData_());
    }
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json_({ ok: false, error: 'server', message: String(err) });
  }
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }
  try {
    ensureSetup_();
    if (body.action === 'load') {
      if (WRITE_PIN && String(body.pin || '') !== WRITE_PIN) return json_({ ok: false, error: 'pin' });
      return json_(loadData_());
    }
    if (body.action === 'history') {
      if (WRITE_PIN && String(body.pin || '') !== WRITE_PIN) return json_({ ok: false, error: 'pin' });
      return json_(historyData_());
    }
    if (body.action === 'save') return json_(saveData_(body));
    if (body.action === 'reset') return json_(resetData_(body));
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return json_({ ok: false, error: 'server', message: String(err) });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** หาตำแหน่งช่องของทุกที่นั่ง/จอ จากชื่อในช่องหัว (ช่องสถานะอยู่ใต้ชื่อ 1 แถว, NOTE อยู่ใต้ 2 แถว)
 *  เพิ่ม/ลบแถวในชีทได้ ตราบใดที่ยังเรียง ชื่อ / สถานะ / NOTE ไว้เหมือนเดิม */
function buildMap_(sh) {
  const last = Math.max(sh.getLastRow(), 1);
  const width = Math.max(sh.getLastColumn(), 15);
  const v = sh.getRange(1, 1, last + 2, width).getDisplayValues();
  const cell = function (r, c) { return (r >= 1 && r <= v.length && c >= 1 && c <= width) ? String(v[r - 1][c - 1]).trim() : ''; };
  const byLabel = {};
  LAYOUT.order.forEach(function (id) { byLabel[LAYOUT.items[id].label] = id; });
  const items = {};
  for (let r = FIRST_MAP_ROW; r <= last; r++) {
    if (cell(r, 2) === 'NOTE') continue;
    for (let c = 3; c <= width; c++) {
      const id = byLabel[cell(r, c)];
      if (!id || items[id]) continue;
      const it = LAYOUT.items[id];
      const st = cell(r + 1, c), list = it.kind === 'mon' ? SEAT_M : SEAT_S;
      if (st !== '' && list.indexOf(st) < 0) continue;
      items[id] = { id: id, kind: it.kind, label: it.name, status: [r + 1, c], note: [r + 2, c] };
    }
  }
  return { items: items, cell: cell };
}

function loadData_() {
  const ss = SpreadsheetApp.getActive();
  const m = buildMap_(ss.getSheetByName(MAP_SHEET));
  const byName = {};
  Object.keys(m.items).forEach(function (id) { byName[m.items[id].label] = id; });

  // ผู้แก้ไข/เวลาล่าสุดของแต่ละที่นั่ง จากแท็บประวัติ
  const lastBy = {};
  const log = ss.getSheetByName(LOG_SHEET);
  const n = log.getLastRow();
  if (n > 1) {
    log.getRange(2, 1, n - 1, 4).getValues().forEach(function (row) {
      const id = byName[String(row[3])];
      if (!id) return;
      const at = row[0] instanceof Date ? row[0].toISOString() : '';
      const who = (row[2] && row[2] !== '-') ? String(row[2]) : String(row[1] || '');
      lastBy[id] = { by: who, at: at };
    });
  }

  const seats = {};
  Object.keys(m.items).forEach(function (id) {
    const it = m.items[id];
    const st = m.cell(it.status[0], it.status[1]);
    const s = it.kind === 'seat' ? Math.max(0, SEAT_S.indexOf(st)) : 0;
    const mo = it.kind === 'mon' ? Math.max(0, SEAT_M.indexOf(st)) : 0;
    const lb = lastBy[id] || {};
    seats[id] = { s: s, m: mo, note: m.cell(it.note[0], it.note[1]), by: lb.by || '', at: lb.at || '' };
  });
  const ls = PropertiesService.getScriptProperties().getProperty('lastSave');
  return { ok: true, seats: seats, lastSave: ls ? JSON.parse(ls) : null, pinRequired: !!WRITE_PIN, resetEnabled: !!ADMIN_PIN };
}

/** ทุกบรรทัดในแท็บประวัติ (สำหรับ EXPORT TO EXCEL) วันเวลาส่งเป็น ISO */
function historyData_() {
  const log = SpreadsheetApp.getActive().getSheetByName(LOG_SHEET);
  const n = log.getLastRow();
  if (n < 2) return { ok: true, rows: [] };
  const rows = log.getRange(2, 1, n - 1, 7).getValues().map(function (r) {
    return r.map(function (v, j) { return (j === 0 && v instanceof Date) ? v.toISOString() : (v === null ? '' : String(v)); });
  });
  return { ok: true, rows: rows };
}

function saveData_(body) {
  if (WRITE_PIN && String(body.pin || '') !== WRITE_PIN) return { ok: false, error: 'pin' };
  const by = String(body.by || '').trim().slice(0, 60);
  if (!by) return { ok: false, error: 'no_name' };
  const changes = Array.isArray(body.changes) ? body.changes.slice(0, 500) : [];

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(MAP_SHEET);
    const m = buildMap_(sh);
    const now = new Date();
    const logRows = [];
    let saved = 0;
    changes.forEach(function (ch) {
      const it = m.items[String(ch.id)];
      if (!it) return;
      let touched = false;
      const set = function (pos, field, newV) {
        const oldV = m.cell(pos[0], pos[1]);
        if (oldV === newV) return;
        sh.getRange(pos[0], pos[1]).setValue(newV);
        logRows.push([now, 'หน้าเว็บ', by, it.label, field, oldV, newV]);
        touched = true;
      };
      if (it.kind === 'seat') set(it.status, 'สภาพที่นั่ง', SEAT_S[clamp_(ch.s)]);
      else set(it.status, 'สภาพ Monitor', SEAT_M[clamp_(ch.m)]);
      set(it.note, 'หมายเหตุ', String(ch.note || '').trim().slice(0, 500));
      if (touched) saved++;
    });
    appendLog_(ss, logRows);
    markSave_(sh, by, now);
    const lastSave = { by: by, at: now.toISOString(), n: saved };
    PropertiesService.getScriptProperties().setProperty('lastSave', JSON.stringify(lastSave));
    return { ok: true, saved: saved, at: now.toISOString(), lastSave: lastSave };
  } finally {
    lock.releaseLock();
  }
}

function resetData_(body) {
  if (!ADMIN_PIN) return { ok: false, error: 'reset_disabled' };
  if (String(body.adminPin || '') !== ADMIN_PIN) return { ok: false, error: 'admin_pin' };
  const by = String(body.by || '').trim().slice(0, 60) || '-';
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName(MAP_SHEET);
    const m = buildMap_(sh);
    Object.keys(m.items).forEach(function (id) {
      const it = m.items[id];
      sh.getRange(it.status[0], it.status[1]).setValue(it.kind === 'mon' ? SEAT_M[0] : SEAT_S[0]);
      sh.getRange(it.note[0], it.note[1]).setValue('');
    });
    const now = new Date();
    appendLog_(ss, [[now, 'หน้าเว็บ', by, 'ทั้งลำ', 'ล้างข้อมูลเริ่มรอบตรวจใหม่', '', 'ปกติทั้งหมด']]);
    markSave_(sh, by, now);
    const lastSave = { by: by, at: now.toISOString(), n: 0 };
    PropertiesService.getScriptProperties().setProperty('lastSave', JSON.stringify(lastSave));
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/** แสดงผู้ SAVE ล่าสุดในหัวชีท เช่น 14 OCT26 (10:52 TH-LT) */
function markSave_(sh, by, now) {
  sh.getRange(LASTSAVE_BY).setValue(by);
  sh.getRange(LASTSAVE_AT).setValue(Utilities.formatDate(now, TZ, "dd MMMyy '('HH:mm 'TH-LT)'").toUpperCase());
}

function clamp_(x) { x = Number(x) | 0; return x < 0 ? 0 : (x > 2 ? 2 : x); }

function appendLog_(ss, rows) {
  if (!rows.length) return;
  const log = ss.getSheetByName(LOG_SHEET);
  const start = log.getLastRow() + 1;
  log.getRange(start, 1, rows.length, 7).setValues(rows);
  log.getRange(start, 1, rows.length, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
}

// ---------- ประวัติเมื่อแก้ไขในชีทโดยตรง ----------
function onEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== MAP_SHEET) return;

  const r0 = e.range.getRow(), c0 = e.range.getColumn();
  const nr = e.range.getNumRows(), nc = e.range.getNumColumns();
  if (r0 + nr - 1 < FIRST_MAP_ROW && !(r0 <= 3 && r0 + nr - 1 >= 3)) return;

  const m = buildMap_(sh);
  const at = {};
  Object.keys(m.items).forEach(function (id) {
    const it = m.items[id];
    at[it.status.join(',')] = { id: it.label, field: it.kind === 'mon' ? 'สภาพ Monitor' : 'สภาพที่นั่ง' };
    at[it.note.join(',')] = { id: it.label, field: 'หมายเหตุ' };
  });
  const values = e.range.getDisplayValues();
  const single = nr === 1 && nc === 1;
  const inspector = sh.getRange(INSPECTOR_CELL).getDisplayValue();
  let email = '';
  try { email = (e.user && e.user.getEmail()) || Session.getActiveUser().getEmail(); } catch (err) {}
  const now = new Date();

  const rows = [];
  for (let i = 0; i < nr; i++) {
    for (let j = 0; j < nc; j++) {
      const r = r0 + i, c = c0 + j;
      let info;
      if (r === 3) info = { id: 'ส่วนหัว', field: c <= 9 ? 'ผู้ตรวจ' : 'วันที่ตรวจ' };
      else if (r < FIRST_MAP_ROW) continue;
      else info = at[r + ',' + c] || { id: sh.getRange(r, c).getA1Notation(), field: 'อื่น ๆ' };
      const oldV = single ? (e.oldValue === undefined ? '' : e.oldValue) : '(แก้หลายช่องพร้อมกัน)';
      const newV = single ? (e.value === undefined ? values[0][0] : e.value) : values[i][j];
      rows.push([now, email || '-', inspector || '-', info.id, info.field, oldV, newV]);
    }
  }
  appendLog_(e.source, rows);
}

// ---------- สร้างชีท (รันครั้งแรกครั้งเดียว หรือรันซ้ำเพื่อจัดผังใหม่ ข้อมูลเดิมยังอยู่) ----------
function ensureSetup_() {
  if (!SpreadsheetApp.getActive().getSheetByName(MAP_SHEET)) setupSheet();
}

function setupSheet() {
  const ss = SpreadsheetApp.getActive();
  const P = planSheet(LAYOUT);

  // เก็บค่าปัจจุบันไว้ก่อน ถ้ามีผังเดิมอยู่แล้ว
  const old = ss.getSheetByName(MAP_SHEET);
  let keep = null;
  if (old) {
    const m = buildMap_(old);
    keep = { items: {}, head: ['D2', 'M2', 'D3', 'M3'].map(function (a) { return [a, old.getRange(a).getValue()]; }) };
    Object.keys(m.items).forEach(function (id) {
      const it = m.items[id];
      keep.items[id] = { st: m.cell(it.status[0], it.status[1]), note: m.cell(it.note[0], it.note[1]) };
    });
  }

  const sh = ss.insertSheet(MAP_SHEET + ' (ใหม่)', 0);
  applyPlan_(sh, P);
  if (keep) {
    keep.head.forEach(function (h) { if (h[1] !== '') sh.getRange(h[0]).setValue(h[1]); });
    Object.keys(keep.items).forEach(function (id) {
      const p = P.pos[id], k = keep.items[id];
      if (!p) return;
      if (k.st) sh.getRange(p.status[0], p.status[1]).setValue(k.st);
      if (k.note) sh.getRange(p.note[0], p.note[1]).setValue(k.note);
    });
  }

  // แท็บประวัติ: ใช้ของเดิมถ้ามี
  let log = ss.getSheetByName(LOG_SHEET);
  if (!log) {
    log = ss.insertSheet(LOG_SHEET);
    listHeader_(log, ['วัน/เวลา (TH-LT)', 'อีเมลผู้แก้ไข', 'ผู้ตรวจ (ช่อง D3)', 'ที่นั่ง / จุด', 'รายการ', 'ค่าเดิม', 'ค่าใหม่'], [150, 220, 180, 300, 110, 240, 240]);
    log.getRange('A2:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
  }

  [ALL_SHEET, BAD_SHEET].forEach(function (n) { const s = ss.getSheetByName(n); if (s) ss.deleteSheet(s); });
  if (old) ss.deleteSheet(old);
  sh.setName(MAP_SHEET);
  buildListSheets_(ss, P);

  // ลบแท็บว่าง Sheet1 / แผ่นงาน1 ที่มากับไฟล์ใหม่
  ss.getSheets().forEach(function (s) {
    const n = s.getName();
    if ([MAP_SHEET, LOG_SHEET, ALL_SHEET, BAD_SHEET].indexOf(n) < 0 && s.getLastRow() === 0 && /^(Sheet|แผ่นงาน|ชีต)\s*\d+$/.test(n)) ss.deleteSheet(s);
  });
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1);
}

function hexOk_(x) { return x || null; }

function applyPlan_(sh, P) {
  if (sh.getMaxRows() < P.lastRow + 5) sh.insertRowsAfter(sh.getMaxRows(), P.lastRow + 5 - sh.getMaxRows());
  if (sh.getMaxColumns() > P.lastCol + 1) sh.deleteColumns(P.lastCol + 2, sh.getMaxColumns() - P.lastCol - 1);
  sh.setHiddenGridlines(true);
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).setFontFamily('Tahoma').setFontSize(9).setVerticalAlignment('middle');
  Object.keys(P.widths).forEach(function (c) { sh.setColumnWidth(Number(c), P.widths[c]); });
  Object.keys(P.heights).forEach(function (r) { sh.setRowHeight(Number(r), P.heights[r]); });

  const dvS = SpreadsheetApp.newDataValidation().requireValueInList(SEAT_S, true).setAllowInvalid(false).build();
  const dvM = SpreadsheetApp.newDataValidation().requireValueInList(SEAT_M, true).setAllowInvalid(false).build();
  const SOLID = SpreadsheetApp.BorderStyle.SOLID;
  P.ops.forEach(function (o) {
    const rg = sh.getRange(o.r, o.c, o.rs, o.cs);
    if (o.cabin) { rg.setBackground(o.fill); return; }
    if (o.rs > 1 || o.cs > 1) rg.merge();
    if (o.v !== undefined && o.v !== null) {
      const top = sh.getRange(o.r, o.c);
      if (String(o.v).charAt(0) === '=') top.setFormula(o.v); else top.setValue(o.v);
    }
    if (o.fill) rg.setBackground(o.fill);
    const f = o.font || {};
    if (f.b) rg.setFontWeight('bold');
    if (f.i) rg.setFontStyle('italic');
    if (f.sz) rg.setFontSize(f.sz);
    if (f.color) rg.setFontColor(f.color);
    const a = o.align || {};
    if (a.h) rg.setHorizontalAlignment(a.h);
    if (a.v) rg.setVerticalAlignment(a.v);
    if (a.wrap) rg.setWrap(true);
    if (o.border) rg.setBorder(true, true, true, true, null, null, '#000000', SOLID);
    if (o.dv) rg.setDataValidation(o.dv === 'M' ? dvM : dvS);
    if (o.fmt) rg.setNumberFormat(o.fmt);
  });
  P.boxes.forEach(function (b) {
    sh.getRange(b.r1, b.c1, b.r2 - b.r1 + 1, b.c2 - b.c1 + 1).setBorder(true, true, true, true, null, null, SEAT_COLOR.MUTED, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  });
  const rules = P.cf.map(function (c) {
    let b = SpreadsheetApp.newConditionalFormatRule().setRanges([sh.getRange(c.range)]).setBackground(c.fill);
    if (c.font) b = b.setFontColor(c.font);
    b = c.text !== undefined ? b.whenTextEqualTo(c.text) : b.whenFormulaSatisfied(c.f);
    return b.build();
  });
  sh.setConditionalFormatRules(rules);
  sh.setFrozenRows(0);
}

function listHeader_(s, titles, widths) {
  s.getRange(1, 1, 1, titles.length).setValues([titles]).setFontWeight('bold').setBackground(SEAT_COLOR.ZONEH)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  s.getRange(1, 1, s.getMaxRows(), titles.length).setFontFamily('Tahoma').setFontSize(9);
  widths.forEach(function (w, i) { s.setColumnWidth(i + 1, w); });
  s.setRowHeight(1, 30);
  s.setFrozenRows(1);
}

function buildListSheets_(ss, P) {
  const q = "'" + MAP_SHEET + "'!";
  const zn = {}; SEAT_ZONES.forEach(function (z) { zn[z.key] = z.name; });
  const A1 = function (p) { return seatColName(p[1]) + p[0]; };
  const hdr = ['ที่นั่ง / จุด', 'ประเภท', 'โซน', 'สภาพที่นั่ง', 'สภาพ Monitor', 'หมายเหตุ', 'ผู้บันทึกล่าสุด', 'วัน/เวลาล่าสุด (TH-LT)'];
  const wid = [330, 80, 140, 110, 100, 300, 180, 140];

  const all = ss.insertSheet(ALL_SHEET, 1);
  listHeader_(all, hdr, wid);
  const rows = LAYOUT.order.map(function (id, i) {
    const it = LAYOUT.items[id], p = P.pos[id], row = i + 2;
    const hist = function (col) {
      return "=IFERROR(INDEX(FILTER('" + LOG_SHEET + "'!$" + col + "$2:$" + col + ",'" + LOG_SHEET + "'!$D$2:$D=$A" + row + "),COUNTIF('" + LOG_SHEET + "'!$D$2:$D,$A" + row + ")),\"\")";
    };
    return [it.name, it.kind === 'mon' ? 'Monitor' : 'ที่นั่ง', zn[it.zone],
      it.kind === 'seat' ? '=' + q + A1(p.status) : '-',
      it.kind === 'mon' ? '=' + q + A1(p.status) : '-',
      '=' + q + A1(p.note) + '&""', hist('C'), hist('A')];
  });
  all.getRange(2, 1, rows.length, 8).setValues(rows)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID).setVerticalAlignment('top');
  all.getRange(2, 2, rows.length, 4).setHorizontalAlignment('center');
  all.getRange(2, 6, rows.length, 1).setWrap(true);
  all.getRange(2, 8, rows.length, 1).setNumberFormat('dd/MM/yyyy HH:mm').setHorizontalAlignment('center');
  statusColors_(all, rows.length + 1);

  const bad = ss.insertSheet(BAD_SHEET, 1);
  listHeader_(bad, hdr, wid);
  const s = "'" + ALL_SHEET + "'!";
  bad.getRange('A2').setFormula('=IFERROR(FILTER(' + s + 'A2:H,(' + s + 'D2:D="' + SEAT_S[1] + '")+(' + s + 'D2:D="' + SEAT_S[2] + '")+(' +
    s + 'E2:E="' + SEAT_M[1] + '")+(' + s + 'E2:E="' + SEAT_M[2] + '")+(' + s + 'F2:F<>"")),"ไม่มีข้อขัดข้องคงค้าง")');
  bad.getRange('H2:H').setNumberFormat('dd/MM/yyyy HH:mm');
  bad.getRange('F2:F').setWrap(true);
  statusColors_(bad, 200);
}

function statusColors_(s, end) {
  const rg = [s.getRange('D2:E' + end)];
  const C = SEAT_COLOR;
  s.setConditionalFormatRules([
    [SEAT_S[2], C.RED, '#FFFFFF'], [SEAT_M[2], C.RED, '#FFFFFF'], [SEAT_S[1], C.YEL, null], [SEAT_M[1], C.YEL, null]
  ].map(function (x) {
    let b = SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(x[0]).setBackground(x[1]).setRanges(rg);
    if (x[2]) b = b.setFontColor(x[2]);
    return b.build();
  }));
}
