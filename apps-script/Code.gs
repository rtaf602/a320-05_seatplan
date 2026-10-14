/**
 * Seat Plan 320(05) (For Admin) — Apps Script
 *
 * 1) สร้างแท็บในชีท: เลือกฟังก์ชัน setupSheet แล้วกด Run (ครั้งแรกครั้งเดียว)
 * 2) เป็น API ให้หน้าเว็บ (GitHub Pages) อ่าน/บันทึกสภาพที่นั่งและ Monitor ลงแท็บ "ผังที่นั่ง"
 *    และบันทึกประวัติลงแท็บ "ประวัติการแก้ไข" ทุกครั้งที่กด SAVE บนเว็บ
 * 3) บันทึกประวัติอัตโนมัติเมื่อมีคนแก้ไขช่องในชีทโดยตรง (onEdit)
 *
 * ไฟล์นี้สร้างจาก layout.js + apps-script/server.js ด้วย tools/build-code-gs.sh วิธีติดตั้งดู README.md
 */

/* STATUS SEAT PLAN A320(05) — ผังที่นั่งในชีท "ผังที่นั่ง"
 * ใช้ร่วมกัน 2 ที่: หน้าเว็บ (export-excel.js) และ apps-script/Code.gs (คัดลอกส่วนนี้ไปไว้บนสุดของ Code.gs)
 * ถ้าแก้ไฟล์นี้ ต้องแก้ส่วนเดียวกันใน Code.gs ให้ตรงกันด้วย
 *
 * seatPlanLayout() คืน { order:[id...], items:{id:{id,kind,zone,type,label,name}}, blocks:[...] }
 *   label = ข้อความในช่องหัวของที่นั่ง/จอในชีท (ห้ามซ้ำกัน ใช้หาตำแหน่งช่อง)
 *   name  = ชื่อที่ใช้ในแท็บ "ทุกที่นั่ง และ Monitor" และ "ประวัติการแก้ไข"
 * planSheet(L) คืนรายการช่องที่ต้องเขียน/จัดรูปแบบ และตำแหน่งของแต่ละที่นั่ง/จอ
 */
var SEAT_S = ['ปกติ', 'ขัดข้อง-ใช้ได้', 'ใช้ไม่ได้'];
var SEAT_M = ['จอปกติ', 'จอเสื่อม', 'จอเสีย'];
var SEAT_MT = {
  w21: { name: 'Wall Mounted Monitor 21.5 Inch', short: 'Monitor 21.5"' },
  w27: { name: 'Wall Mounted Monitor 27.0 Inch', short: 'Monitor 27"' },
  b12: { name: 'Bin Mounted Retractable Monitors (OVHD Monitor) 12 Inch', short: 'OVHD Monitor 12"' }
};
var SEAT_MT_ORDER = ['w21', 'w27', 'b12'];
var SEAT_ZONES = [
  { key: 'F', name: 'FRONT CREW ZONE' }, { key: 'A', name: 'VVIP OA' }, { key: 'B', name: 'VIP OB' },
  { key: 'C', name: 'VIP OC' }, { key: 'D', name: 'PASSENGER OD' }
];
var SEAT_COLOR = {
  GREEN: '#00FF00', MGREEN: '#8ED873', YEL: '#FFFF00', RED: '#FF0000', CABIN: '#CAEDFB', ROWNO: '#6D9EEB',
  ZONEH: '#C1E4F5', TAG: '#45B0E1', WHITE: '#FFFFFF', BLUE: '#00B0F0', GREY: '#F2F2F2', MUTED: '#566575', TABLE: '#E7E6E6'
};

function seatPlanLayout() {
  var items = {}, order = [], blocks = [];
  function seat(id, zone, label, name) { items[id] = { id: id, kind: 'seat', zone: zone, label: label || id, name: name || id }; order.push(id); }
  function mon(id, zone, type, posLong, posShort) {
    items[id] = { id: id, kind: 'mon', zone: zone, type: type, label: SEAT_MT[type].short + ' · ' + posShort, name: SEAT_MT[type].name + ' · ' + posLong };
    order.push(id);
  }
  function zone(k, title, tag) { blocks.push({ t: 'zone', zone: k, title: title, tag: tag }); }
  /* one block = 3 sheet rows (label / status / note). cells: {id,c,span} or {text,c,span} */
  function blk(k, b, cells, room) { blocks.push({ t: 'blk', zone: k, b: b, cells: cells, room: !!room }); }
  var C1 = 3, C2 = 5, C3 = 7, R1 = 10, R2 = 12, R3 = 14;  // C E G | J L N

  zone('F', 'Front Crew Zone (4 Seats)', 'CREW');
  mon('MON-F1', 'F', 'w21', 'หน้าที่นั่ง CC 1A', 'หน้า CC 1A');
  mon('MON-F2', 'F', 'w21', 'หน้าที่นั่ง 1D, 1E, 1F', 'หน้า 1D-1F');
  blk('F', 'Monitor', [{ id: 'MON-F1', c: C1, span: 4 }, { id: 'MON-F2', c: R1, span: 6 }], true);
  seat('CC1A', 'F', 'CC 1A', 'Commander Center 1A'); seat('1D', 'F'); seat('1E', 'F'); seat('1F', 'F');
  blk('F', '1', [{ id: 'CC1A', c: C1, span: 4 }, { id: '1D', c: R1 }, { id: '1E', c: R2 }, { id: '1F', c: R3 }], true);

  zone('A', 'VVIP OA (4 Seats)', 'VVIP OA');
  mon('MON-A1', 'A', 'w27', 'หน้าที่นั่ง 2A', 'หน้า 2A');
  mon('MON-A2', 'A', 'w27', 'หน้าที่นั่ง 3D, 3F', 'หน้า 3D-3F');
  mon('MON-A3', 'A', 'w27', 'หลังที่นั่ง 4A', 'หลัง 4A');
  blk('A', 'Monitor', [{ id: 'MON-A1', c: C1 }, { id: 'MON-A2', c: R1, span: 4 }]);
  seat('2A', 'A'); blk('A', '2', [{ id: '2A', c: C1 }]);
  seat('3D', 'A'); seat('3F', 'A'); blk('A', '3', [{ text: 'TABLE', c: C1 }, { id: '3D', c: R1 }, { id: '3F', c: R2 }]);
  seat('4A', 'A'); blk('A', '4', [{ id: '4A', c: C1 }]);
  blk('A', 'Monitor', [{ id: 'MON-A3', c: C1 }]);

  zone('B', 'VIP OB (6 Seats)', 'VIP OB');
  mon('MON-B1', 'B', 'w27', 'หน้าที่นั่ง 5A', 'หน้า 5A');
  mon('MON-B2', 'B', 'w27', 'หน้าที่นั่ง 5D, 5F', 'หน้า 5D-5F');
  mon('MON-B3', 'B', 'w27', 'หลังที่นั่ง 6A', 'หลัง 6A');
  mon('MON-B4', 'B', 'w27', 'หลังที่นั่ง 6D, 6F', 'หลัง 6D-6F');
  blk('B', 'Monitor', [{ id: 'MON-B1', c: C1 }, { id: 'MON-B2', c: R1, span: 4 }]);
  seat('5A', 'B'); seat('5D', 'B'); seat('5F', 'B'); blk('B', '5', [{ id: '5A', c: C1 }, { id: '5D', c: R1 }, { id: '5F', c: R2 }]);
  blk('B', '', [{ text: 'TABLE', c: C1 }, { text: 'TABLE', c: R1, span: 4 }]);
  seat('6A', 'B'); seat('6D', 'B'); seat('6F', 'B'); blk('B', '6', [{ id: '6A', c: C1 }, { id: '6D', c: R1 }, { id: '6F', c: R2 }]);
  blk('B', 'Monitor', [{ id: 'MON-B3', c: C1 }, { id: 'MON-B4', c: R1, span: 4 }]);

  zone('C', 'VIP OC · Business Class (8 Seats)', 'VIP OC');
  mon('MON-C1', 'C', 'w21', 'หน้าที่นั่ง 7B, 7C', 'หน้า 7B-7C');
  mon('MON-C2', 'C', 'w21', 'หน้าที่นั่ง 7D, 7F', 'หน้า 7D-7F');
  blk('C', 'Monitor', [{ id: 'MON-C1', c: C1, span: 4 }, { id: 'MON-C2', c: R1, span: 4 }]);
  [7, 8].forEach(function (n) {
    ['B', 'C', 'D', 'F'].forEach(function (x) { seat(n + x, 'C'); });
    blk('C', String(n), [{ id: n + 'B', c: C1 }, { id: n + 'C', c: C2 }, { id: n + 'D', c: R1 }, { id: n + 'F', c: R2 }]);
  });

  zone('D', 'Passenger OD · Economy Class (54 Seats)', 'ECONOMY');
  mon('MON-D1', 'D', 'w21', 'หน้าที่นั่ง 9A, 9B, 9C', 'หน้า 9A-9C');
  mon('MON-D2', 'D', 'w21', 'หน้าที่นั่ง 9D, 9E, 9F', 'หน้า 9D-9F');
  blk('D', 'Monitor', [{ id: 'MON-D1', c: C1, span: 6 }, { id: 'MON-D2', c: R1, span: 6 }]);
  [9, 10, 11, 12, 14, 15, 16, 17, 18].forEach(function (n) {
    if ([10, 12, 15, 17].indexOf(n) >= 0) {
      mon('MON-D' + n + 'L', 'D', 'b12', 'หน้าที่นั่ง ' + n + 'A, ' + n + 'B, ' + n + 'C', 'หน้า ' + n + 'A-' + n + 'C');
      mon('MON-D' + n + 'R', 'D', 'b12', 'หน้าที่นั่ง ' + n + 'D, ' + n + 'E, ' + n + 'F', 'หน้า ' + n + 'D-' + n + 'F');
      blk('D', 'OVHD', [{ id: 'MON-D' + n + 'L', c: C1, span: 6 }, { id: 'MON-D' + n + 'R', c: R1, span: 6 }]);
    }
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(function (x) { seat(n + x, 'D'); });
    blk('D', String(n), [{ id: n + 'A', c: C1 }, { id: n + 'B', c: C2 }, { id: n + 'C', c: C3 }, { id: n + 'D', c: R1 }, { id: n + 'E', c: R2 }, { id: n + 'F', c: R3 }]);
  });
  return { order: order, items: items, blocks: blocks };
}

function seatColName(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }

/* planSheet: the "ผังที่นั่ง" tab as a list of cell operations.
 * op = {r,c,rs,cs, v (text, or formula starting with '='), q (how to compute the formula's value), fill, font:{b,i,sz,color}, align:{h,v,wrap}, border, dv:'S'|'M', fmt}
 * widths/heights are in pixels. */
function planSheet(L) {
  var C = SEAT_COLOR, ops = [], heights = {}, cf = [], boxes = [], pos = {}, zoneRows = {}, typeCells = {};
  var LASTC = 15, A = seatColName;
  function op(o) { o.rs = o.rs || 1; o.cs = o.cs || 1; ops.push(o); return o; }
  var hdr = { b: true, sz: 8 }, mid = { h: 'center', v: 'middle', wrap: true };
  var widths = { 1: 12, 2: 60 };
  for (var c = 3; c <= 8; c++) widths[c] = 52;
  widths[9] = 22;
  for (c = 10; c <= 15; c++) widths[c] = 52;

  op({ r: 1, c: 2, cs: 14, v: 'STATUS SEAT PLAN A320(05)', fill: C.TAG, font: { b: true, sz: 18 }, align: mid, border: false });
  heights[1] = 44;
  op({ r: 2, c: 2, cs: 2, v: 'SAVE ล่าสุด', fill: C.ZONEH, font: { b: true, sz: 9 }, align: mid, border: true });
  op({ r: 2, c: 4, cs: 6, v: '-', fill: C.GREY, font: { sz: 9 }, align: mid, border: true });
  op({ r: 2, c: 10, cs: 3, v: 'วัน/เวลาที่ SAVE (TH-LT)', fill: C.ZONEH, font: hdr, align: mid, border: true });
  op({ r: 2, c: 13, cs: 3, v: '-', fill: C.GREY, font: { sz: 9 }, align: mid, border: true });
  op({ r: 3, c: 2, cs: 2, v: 'ผู้ตรวจ', fill: C.ZONEH, font: { b: true, sz: 9 }, align: mid, border: true });
  op({ r: 3, c: 4, cs: 6, fill: C.YEL, font: { sz: 9 }, align: mid, border: true });
  op({ r: 3, c: 10, cs: 3, v: 'วัน/เวลาที่ตรวจ', fill: C.ZONEH, font: hdr, align: mid, border: true });
  op({ r: 3, c: 13, cs: 3, fill: C.YEL, font: { sz: 9 }, align: mid, border: true, fmt: 'dd/mm/yyyy hh:mm' });
  heights[2] = 30; heights[3] = 30;
  op({ r: 4, c: 2, cs: 14, v: 'บันทึกสภาพที่นั่งและ Monitor · สำหรับ Admin ฝ่ายการช่าง และฝ่ายสื่อสาร · เวลาทั้งหมดเป็นเวลาประเทศไทย (TH-LT)', font: { i: true, sz: 8 }, align: mid, border: false });

  /* summary by zone: rows 6..12, by monitor type: rows 14..18 */
  var SZ = 6, ST = 14;
  [['ZONE', 2, 3, null], ['ที่นั่งรวม', 5, 1, null], ['ใช้งานได้ปกติ', 6, 1, C.GREEN], ['มีข้อขัดข้องแต่ใช้งานได้', 7, 1, C.YEL], ['ใช้งานไม่ได้', 8, 1, C.RED],
   ['Monitor รวม', 10, 1, C.BLUE], ['Monitor ใช้งานได้', 11, 1, C.MGREEN], ['Monitor เสื่อมสภาพ', 12, 1, C.YEL], ['Monitor เสีย', 13, 1, C.RED]].forEach(function (h) {
    op({ r: SZ, c: h[1], cs: h[2], v: h[0], fill: h[3], font: hdr, align: mid, border: true });
  });
  heights[SZ] = 44;
  [['ชนิด Monitor', 2, 7, null], ['จำนวน', 10, 1, C.BLUE], ['Monitor ใช้งานได้', 11, 1, C.MGREEN], ['Monitor เสื่อมสภาพ', 12, 1, C.YEL], ['Monitor เสีย', 13, 1, C.RED]].forEach(function (h) {
    op({ r: ST, c: h[1], cs: h[2], v: h[0], fill: h[3], font: hdr, align: mid, border: true });
  });
  heights[ST] = 44;
  op({ r: 20, c: 2, v: 'วิธีใช้', font: { b: true, sz: 8 }, align: { v: 'middle' }, border: false });
  op({ r: 20, c: 3, cs: 13, v: 'เลือกสภาพจาก dropdown ในช่องใต้ชื่อที่นั่ง / Monitor · พิมพ์รายละเอียดในช่องใต้สุด (NOTE) · สีและตารางสรุปเปลี่ยนเอง · ทุกการแก้ไขบันทึกในแท็บ ประวัติการแก้ไข', font: { sz: 8 }, align: { v: 'middle', wrap: true }, border: false });
  heights[20] = 30;

  var FIRST = 22, r = FIRST, roomTop = null, roomBot = null;
  var curZone = null, zoneStart = 0;
  function closeZone() {
    if (!curZone) return;
    zoneRows[curZone] = [zoneStart, r - 1];
    ops.unshift({ r: zoneStart, c: 2, rs: r - zoneStart, cs: 14, fill: C.CABIN, cabin: true });
  }
  L.blocks.forEach(function (b) {
    if (b.t === 'zone') {
      closeZone(); if (curZone) { heights[r] = 14; r++; }
      op({ r: r, c: 2, cs: 10, v: b.title, fill: C.ZONEH, font: { b: true, sz: 11 }, align: { v: 'middle' }, border: false });
      op({ r: r, c: 12, cs: 4, v: b.tag, fill: C.TAG, font: { b: true, sz: 10 }, align: mid, border: false });
      heights[r] = 28; r++; heights[r] = 8;
      curZone = b.zone; zoneStart = r; r++;
      return;
    }
    var isMonRow = b.b === 'Monitor' || b.b === 'OVHD', isNum = /^\d+$/.test(b.b);
    if (b.b) op(isNum ? { r: r, c: 2, v: b.b, fill: C.ROWNO, font: { b: true, sz: 10, color: '#FFFFFF' }, align: mid, border: true }
                      : { r: r, c: 2, v: b.b, font: { b: true, sz: 7, color: C.MUTED }, align: { h: 'right', v: 'middle' }, border: false });
    if (b.cells.some(function (x) { return x.id; })) op({ r: r + 2, c: 2, v: 'NOTE', font: { sz: 7, color: C.MUTED }, align: { h: 'right', v: 'top' }, border: false });
    b.cells.forEach(function (x) {
      var span = x.span || 2;
      if (x.text) { op({ r: r, c: x.c, rs: 3, cs: span, v: x.text, fill: C.TABLE, font: { i: true, sz: 8, color: C.MUTED }, align: mid, border: true }); return; }
      var it = L.items[x.id], isMon = it.kind === 'mon';
      op({ r: r, c: x.c, cs: span, v: it.label, fill: isMon ? C.MGREEN : C.GREEN, font: { b: true, sz: isMon ? 8 : 11 }, align: mid, border: true });
      op({ r: r + 1, c: x.c, cs: span, v: isMon ? SEAT_M[0] : SEAT_S[0], fill: C.WHITE, font: { sz: 8 }, align: mid, border: true, dv: isMon ? 'M' : 'S' });
      op({ r: r + 2, c: x.c, cs: span, fill: C.WHITE, font: { sz: 8 }, align: { h: 'left', v: 'top', wrap: true }, border: true });
      pos[x.id] = { label: [r, x.c], status: [r + 1, x.c], note: [r + 2, x.c] };
      if (isMon) (typeCells[it.type] = typeCells[it.type] || []).push(A(x.c) + (r + 1));
    });
    if (b.room) { if (roomTop === null) roomTop = r; roomBot = r + 2; }
    heights[r] = isMonRow ? 34 : 26; heights[r + 1] = 18; heights[r + 2] = 34; heights[r + 3] = 6;
    r += 4;
  });
  closeZone();
  var LAST = r - 1;
  if (roomTop !== null) {
    op({ r: roomTop, c: 7, rs: roomBot - roomTop + 1, cs: 2, v: 'ห้อง Commander Center', font: { b: true, sz: 8, color: C.MUTED }, align: mid, border: false });
    boxes.push({ r1: roomTop - 1, c1: 3, r2: roomBot + 1, c2: 8 });
  }

  /* summary formulas; q tells the Excel export how to fill in the cached result */
  var all = L.order, seatsOf = function (z) { return all.filter(function (id) { return L.items[id].kind === 'seat' && (!z || L.items[id].zone === z); }); };
  var monsOf = function (z, t) { return all.filter(function (id) { var it = L.items[id]; return it.kind === 'mon' && (!z || it.zone === z) && (!t || it.type === t); }); };
  SEAT_ZONES.forEach(function (z, i) {
    var row = SZ + 1 + i, zr = zoneRows[z.key], rg = '$C$' + zr[0] + ':$O$' + zr[1];
    op({ r: row, c: 2, cs: 3, v: z.name, font: { b: true, sz: 8 }, align: { v: 'middle' }, border: true });
    op({ r: row, c: 5, v: '=F' + row + '+G' + row + '+H' + row, q: { ids: seatsOf(z.key), f: 's', vals: [0, 1, 2] }, font: { sz: 9 }, align: mid, border: true });
    SEAT_S.forEach(function (t, j) { op({ r: row, c: 6 + j, v: '=COUNTIF(' + rg + ',"' + t + '")', q: { ids: seatsOf(z.key), f: 's', vals: [j] }, fill: [C.GREEN, C.YEL, C.RED][j], font: { sz: 9 }, align: mid, border: true }); });
    op({ r: row, c: 10, v: '=K' + row + '+L' + row + '+M' + row, q: { ids: monsOf(z.key), f: 'm', vals: [0, 1, 2] }, fill: C.BLUE, font: { sz: 9 }, align: mid, border: true });
    SEAT_M.forEach(function (t, j) { op({ r: row, c: 11 + j, v: '=COUNTIF(' + rg + ',"' + t + '")', q: { ids: monsOf(z.key), f: 'm', vals: [j] }, fill: [C.MGREEN, C.YEL, C.RED][j], font: { sz: 9 }, align: mid, border: true }); });
    heights[row] = 22;
  });
  var tr = SZ + 1 + SEAT_ZONES.length;
  op({ r: tr, c: 2, cs: 3, v: 'รวม', font: { b: true, sz: 8 }, align: { v: 'middle' }, border: true });
  [[5, null, seatsOf(), 's', [0, 1, 2]], [6, C.GREEN, seatsOf(), 's', [0]], [7, C.YEL, seatsOf(), 's', [1]], [8, C.RED, seatsOf(), 's', [2]],
   [10, C.BLUE, monsOf(), 'm', [0, 1, 2]], [11, C.MGREEN, monsOf(), 'm', [0]], [12, C.YEL, monsOf(), 'm', [1]], [13, C.RED, monsOf(), 'm', [2]]].forEach(function (x) {
    op({ r: tr, c: x[0], v: '=SUM(' + A(x[0]) + (SZ + 1) + ':' + A(x[0]) + (tr - 1) + ')', q: { ids: x[2], f: x[3], vals: x[4] }, fill: x[1], font: { b: true, sz: 9 }, align: mid, border: true });
  });
  heights[tr] = 22;
  SEAT_MT_ORDER.forEach(function (t, i) {
    var row = ST + 1 + i, cells = typeCells[t] || [];
    op({ r: row, c: 2, cs: 7, v: SEAT_MT[t].name, font: { b: true, sz: 8 }, align: { v: 'middle' }, border: true });
    op({ r: row, c: 10, v: '=K' + row + '+L' + row + '+M' + row, q: { ids: monsOf(null, t), f: 'm', vals: [0, 1, 2] }, fill: C.BLUE, font: { sz: 9 }, align: mid, border: true });
    SEAT_M.forEach(function (s, j) {
      op({ r: row, c: 11 + j, v: '=' + cells.map(function (a) { return 'N(' + a + '="' + s + '")'; }).join('+'), q: { ids: monsOf(null, t), f: 'm', vals: [j] }, fill: [C.MGREEN, C.YEL, C.RED][j], font: { sz: 9 }, align: mid, border: true });
    });
    heights[row] = 22;
  });
  var tt = ST + 1 + SEAT_MT_ORDER.length;
  op({ r: tt, c: 2, cs: 7, v: 'รวม', font: { b: true, sz: 8 }, align: { v: 'middle' }, border: true });
  [[10, C.BLUE, [0, 1, 2]], [11, C.MGREEN, [0]], [12, C.YEL, [1]], [13, C.RED, [2]]].forEach(function (x) {
    op({ r: tt, c: x[0], v: '=SUM(' + A(x[0]) + (ST + 1) + ':' + A(x[0]) + (tt - 1) + ')', q: { ids: monsOf(), f: 'm', vals: x[2] }, fill: x[1], font: { b: true, sz: 9 }, align: mid, border: true });
  });
  heights[tt] = 22;

  /* colours: a status cell by its own value, a name cell by the status just below it */
  var area = 'C' + FIRST + ':O' + LAST, nx = 'C' + (FIRST + 1);
  cf.push({ range: area, text: SEAT_S[2], fill: C.RED, font: '#FFFFFF' });
  cf.push({ range: area, text: SEAT_M[2], fill: C.RED, font: '#FFFFFF' });
  cf.push({ range: area, text: SEAT_S[1], fill: C.YEL });
  cf.push({ range: area, text: SEAT_M[1], fill: C.YEL });
  cf.push({ range: area, f: '=OR(' + nx + '="' + SEAT_S[2] + '",' + nx + '="' + SEAT_M[2] + '")', fill: C.RED, font: '#FFFFFF' });
  cf.push({ range: area, f: '=OR(' + nx + '="' + SEAT_S[1] + '",' + nx + '="' + SEAT_M[1] + '")', fill: C.YEL });

  return { ops: ops, widths: widths, heights: heights, cf: cf, boxes: boxes, pos: pos, zoneRows: zoneRows, firstMapRow: FIRST, lastRow: LAST, lastCol: LASTC };
}

if (typeof window !== 'undefined') { window.seatPlanLayout = seatPlanLayout; window.planSheet = planSheet; }

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

/**
 * SAVE จากหน้าเว็บ
 * แต่ละรายการ: { id, s, m, note, fields: ['s','m','note'] ที่แก้จริง, base: {s, m, note} ค่าตอนเริ่มแก้ }
 * - เขียนเฉพาะช่องใน fields ช่องที่ไม่ได้แก้จะไม่ถูกแตะ (กันทับค่าที่คนอื่นเพิ่งบันทึก)
 * - ถ้าค่าในชีทตอนนี้ไม่ตรงกับ base และไม่ตรงกับค่าใหม่ = มีคนแก้ช่องเดียวกันไปก่อน
 *   จะไม่บันทึกช่องนั้น แต่ส่งกลับใน conflicts ให้หน้าเว็บถามผู้ใช้
 * - รายการที่ไม่มี fields (หน้าเว็บรุ่นเก่า) จะเขียนทุกช่องแบบเดิม
 */
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
    const conflicts = [];
    const current = {};
    let saved = 0;
    let logCache = null;

    // ผู้แก้ล่าสุดของช่องนี้ จากแท็บประวัติ (อ่านเฉพาะเมื่อมีการชน)
    const lastEdit = function (label, fieldTh) {
      if (!logCache) {
        const log = ss.getSheetByName(LOG_SHEET);
        const n = log.getLastRow();
        logCache = n > 1 ? log.getRange(2, 1, n - 1, 5).getValues() : [];
      }
      for (let i = logCache.length - 1; i >= 0; i--) {
        const r = logCache[i];
        if (String(r[3]) === label && String(r[4]) === fieldTh) {
          return { by: (r[2] && r[2] !== '-') ? String(r[2]) : String(r[1] || ''), at: r[0] instanceof Date ? r[0].toISOString() : '' };
        }
      }
      return { by: '', at: '' };
    };

    changes.forEach(function (ch) {
      const it = m.items[String(ch.id)];
      if (!it) return;
      const isSeat = it.kind === 'seat';
      const fields = Array.isArray(ch.fields) ? ch.fields : ['s', 'm', 'note'];
      const base = ch.base && typeof ch.base === 'object' ? ch.base : null;
      const st = m.cell(it.status[0], it.status[1]);
      const cur = {
        s: isSeat ? Math.max(0, SEAT_S.indexOf(st)) : 0,
        m: isSeat ? 0 : Math.max(0, SEAT_M.indexOf(st)),
        note: m.cell(it.note[0], it.note[1])
      };
      const spec = {
        s: isSeat ? { pos: it.status, th: 'สภาพที่นั่ง', val: clamp_(ch.s), txt: function (x) { return SEAT_S[x]; } } : null,
        m: isSeat ? null : { pos: it.status, th: 'สภาพ Monitor', val: clamp_(ch.m), txt: function (x) { return SEAT_M[x]; } },
        note: { pos: it.note, th: 'หมายเหตุ', val: String(ch.note || '').trim().slice(0, 500), txt: function (x) { return x; } }
      };
      let touched = false;
      ['s', 'm', 'note'].forEach(function (f) {
        const sp = spec[f];
        if (!sp || fields.indexOf(f) < 0) return;
        if (cur[f] === sp.val) return;
        if (base && f in base) {
          const b = f === 'note' ? String(base[f] || '').trim() : clamp_(base[f]);
          if (cur[f] !== b) {
            const le = lastEdit(it.label, sp.th);
            conflicts.push({ id: it.id, label: it.label, field: f, cur: cur[f], mine: sp.val, by: le.by, at: le.at });
            return;
          }
        }
        const oldV = m.cell(sp.pos[0], sp.pos[1]);
        const newV = sp.txt(sp.val);
        sh.getRange(sp.pos[0], sp.pos[1]).setValue(newV);
        logRows.push([now, 'หน้าเว็บ', by, it.label, sp.th, oldV, newV]);
        cur[f] = sp.val;
        touched = true;
      });
      current[it.id] = cur;
      if (touched) saved++;
    });
    appendLog_(ss, logRows);
    const props = PropertiesService.getScriptProperties();
    let lastSave;
    if (saved) {
      markSave_(sh, by, now);
      lastSave = { by: by, at: now.toISOString(), n: saved };
      props.setProperty('lastSave', JSON.stringify(lastSave));
    } else {
      const ls = props.getProperty('lastSave');
      lastSave = ls ? JSON.parse(ls) : null;
    }
    return { ok: true, saved: saved, at: now.toISOString(), lastSave: lastSave, conflicts: conflicts, current: current };
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
