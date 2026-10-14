/* STATUS SEAT PLAN A320(05) — ผังที่นั่งในชีท "ผังที่นั่ง"
 * ใช้ร่วมกัน 2 ที่: หน้าเว็บ (export-excel.js) และ apps-script/Code.gs (tools/build-code-gs.sh คัดลอกส่วนนี้ไปไว้ท้าย Code.gs)
 * ถ้าแก้ไฟล์นี้ ต้องแก้ส่วนเดียวกันใน Code.gs ให้ตรงกันด้วย
 *
 * seatPlanLayout() คืน { order:[id...], items:{id:{id,kind,zone,type,label,name}}, blocks:[...] }
 *   label = ข้อความในช่องหัวของที่นั่ง/จอในชีท ใช้หาตำแหน่งช่อง (จอชนิดเดียวกันใช้ชื่อซ้ำกันได้ จับคู่ตามลำดับซ้ายไปขวา บนลงล่าง)
 *   alias = ชื่อจอแบบเดิม (มีตำแหน่งต่อท้าย) ใช้อ่านชีทที่สร้างด้วยรุ่นก่อน
 *   name  = ชื่อที่ใช้ในแท็บ "ทุกที่นั่ง และ Monitor" และ "ประวัติการแก้ไข"
 * planSheet(L) คืนรายการช่องที่ต้องเขียน/จัดรูปแบบ และตำแหน่งของแต่ละที่นั่ง/จอ
 */
var SEAT_S = ['ปกติ', 'ขัดข้อง-ใช้ได้', 'ใช้ไม่ได้'];
var SEAT_M = ['จอปกติ', 'จอเสื่อม', 'จอเสีย'];
var SEAT_MT = {
  w21: { name: 'Wall Mounted Monitor 21.5 Inch', short: 'Monitor 21.5"', color: '#8ED873' },   // เขียว
  w27: { name: 'Wall Mounted Monitor 27.0 Inch', short: 'Monitor 27"', color: '#9FC5E8' },     // ฟ้า
  b12: { name: 'Bin Mounted Retractable Monitors (OVHD Monitor) 12 Inch', short: 'OVHD Monitor 12"', color: '#B4A7D6' }  // ม่วง
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
    items[id] = { id: id, kind: 'mon', zone: zone, type: type, label: SEAT_MT[type].short, alias: SEAT_MT[type].short + ' · ' + posShort, name: SEAT_MT[type].name + ' · ' + posLong };
    order.push(id);
  }
  function zone(k, title, tag) { blocks.push({ t: 'zone', zone: k, title: title, tag: tag }); }
  /* one block = 3 sheet rows (label / status / note). cells: {id,c,span} or {text,c,span} */
  function blk(k, b, cells, room) { blocks.push({ t: 'blk', zone: k, b: b, cells: cells, room: !!room }); }
  function title(k, text, c, span) { blocks.push({ t: 'title', zone: k, text: text, c: c, span: span, room: true }); }
  var C1 = 3, C2 = 5, C3 = 7, R1 = 10, R2 = 12, R3 = 14;  // C E G | J L N  (left side C..H, right side J..O)
  var L1 = 5, L2 = 4, R2S = 11;                             // centred: 1 seat at E, 2 seats at D-G, 2 seats right at K-N

  zone('F', 'Front Crew Zone (4 Seats)', 'CREW');
  mon('MON-F1', 'F', 'w21', 'หน้าที่นั่ง CC 1A', 'หน้า CC 1A');
  mon('MON-F2', 'F', 'w21', 'หน้าที่นั่ง 1D, 1E, 1F', 'หน้า 1D-1F');
  title('F', 'ห้อง Commander Center', C1, 6);
  blk('F', 'Monitor', [{ id: 'MON-F1', c: L2, span: 4 }, { id: 'MON-F2', c: R1, span: 6 }], true);
  seat('CC1A', 'F', 'CC 1A', 'Commander Center 1A'); seat('1D', 'F'); seat('1E', 'F'); seat('1F', 'F');
  blk('F', '1', [{ id: 'CC1A', c: L2, span: 4 }, { id: '1D', c: R1 }, { id: '1E', c: R2 }, { id: '1F', c: R3 }], true);

  zone('A', 'VVIP OA (4 Seats)', 'VVIP OA');
  mon('MON-A1', 'A', 'w27', 'หน้าที่นั่ง 2A', 'หน้า 2A');
  mon('MON-A2', 'A', 'w27', 'หน้าที่นั่ง 3D, 3F', 'หน้า 3D-3F');
  mon('MON-A3', 'A', 'w27', 'หลังที่นั่ง 4A', 'หลัง 4A');
  blk('A', 'Monitor', [{ id: 'MON-A1', c: L1 }, { id: 'MON-A2', c: R2S, span: 4 }]);
  seat('2A', 'A'); blk('A', '2', [{ id: '2A', c: L1 }]);
  seat('3D', 'A'); seat('3F', 'A'); blk('A', '3', [{ text: 'TABLE', c: L1 }, { id: '3D', c: R2S }, { id: '3F', c: R2S + 2 }]);
  seat('4A', 'A'); blk('A', '4', [{ id: '4A', c: L1 }]);
  blk('A', 'Monitor', [{ id: 'MON-A3', c: L1 }]);

  zone('B', 'VIP OB (6 Seats)', 'VIP OB');
  mon('MON-B1', 'B', 'w27', 'หน้าที่นั่ง 5A', 'หน้า 5A');
  mon('MON-B2', 'B', 'w27', 'หน้าที่นั่ง 5D, 5F', 'หน้า 5D-5F');
  mon('MON-B3', 'B', 'w27', 'หลังที่นั่ง 6A', 'หลัง 6A');
  mon('MON-B4', 'B', 'w27', 'หลังที่นั่ง 6D, 6F', 'หลัง 6D-6F');
  blk('B', 'Monitor', [{ id: 'MON-B1', c: L1 }, { id: 'MON-B2', c: R2S, span: 4 }]);
  seat('5A', 'B'); seat('5D', 'B'); seat('5F', 'B'); blk('B', '5', [{ id: '5A', c: L1 }, { id: '5D', c: R2S }, { id: '5F', c: R2S + 2 }]);
  blk('B', '', [{ text: 'TABLE', c: L1 }, { text: 'TABLE', c: R2S, span: 4 }]);
  seat('6A', 'B'); seat('6D', 'B'); seat('6F', 'B'); blk('B', '6', [{ id: '6A', c: L1 }, { id: '6D', c: R2S }, { id: '6F', c: R2S + 2 }]);
  blk('B', 'Monitor', [{ id: 'MON-B3', c: L1 }, { id: 'MON-B4', c: R2S, span: 4 }]);

  zone('C', 'VIP OC (8 Seats)', 'VIP OC');
  mon('MON-C1', 'C', 'w21', 'หน้าที่นั่ง 7B, 7C', 'หน้า 7B-7C');
  mon('MON-C2', 'C', 'w21', 'หน้าที่นั่ง 7D, 7F', 'หน้า 7D-7F');
  blk('C', 'Monitor', [{ id: 'MON-C1', c: L2, span: 4 }, { id: 'MON-C2', c: R2S, span: 4 }]);
  [7, 8].forEach(function (n) {
    ['B', 'C', 'D', 'F'].forEach(function (x) { seat(n + x, 'C'); });
    blk('C', String(n), [{ id: n + 'B', c: L2 }, { id: n + 'C', c: L2 + 2 }, { id: n + 'D', c: R2S }, { id: n + 'F', c: R2S + 2 }]);
  });

  zone('D', 'Passenger OD (54 Seats)', 'ECONOMY');
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
    if (b.t === 'title') {
      op({ r: r, c: b.c, cs: b.span, v: b.text, font: { b: true, sz: 9, color: C.MUTED }, align: mid, border: false });
      if (roomTop === null) roomTop = r;
      heights[r] = 22; r++;
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
      op({ r: r, c: x.c, cs: span, v: it.label, fill: isMon ? SEAT_MT[it.type].color : C.GREEN, font: { b: true, sz: isMon ? 8 : 11 }, align: mid, border: true });
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
    boxes.push({ r1: roomTop, c1: 3, r2: roomBot, c2: 8 });
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
    op({ r: row, c: 2, cs: 7, v: SEAT_MT[t].name, fill: SEAT_MT[t].color, font: { b: true, sz: 8 }, align: { v: 'middle' }, border: true });
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
