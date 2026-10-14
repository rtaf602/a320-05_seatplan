/* STATUS SEAT PLAN A320(05) — EXPORT TO EXCEL
 * buildSeatWorkbook(ExcelJS, data) returns an ExcelJS workbook with 4 sheets:
 *   ผังที่นั่ง | รวมข้อขัดข้องคงค้าง | ทุกที่นั่ง และ Monitor | ประวัติการแก้ไข
 * data = {
 *   state:    { id: {s:0|1|2, m:0|1|2, note:'', by:'', at:ISO} }   id = 'CC1A', '12E', 'MON-D12R' ...
 *   lastSave: { by, at:ISO } | null,
 *   inspector: '',
 *   history:  [[atISO|text, email, inspector, label, field, oldValue, newValue], ...] | null
 * }
 * The "ผังที่นั่ง" sheet is drawn from planSheet() in layout.js, the same plan the Apps Script uses
 * to build the Google Sheet, so both look the same.
 */
(function (root) {
  var FONT = 'Tahoma';
  var thin = { style: 'thin', color: { argb: 'FF000000' } };
  var BOX = { top: thin, left: thin, bottom: thin, right: thin };

  function argb(hex) { return 'FF' + String(hex || '#FFFFFF').replace('#', '').toUpperCase(); }
  function fill(hex) { return { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } }; }
  function font(o) {
    o = o || {};
    var f = { name: FONT, size: o.sz || 9, color: { argb: argb(o.color || '#000000') } };
    if (o.b) f.bold = true; if (o.i) f.italic = true; return f;
  }
  /* Excel stores dates without a time zone: shift so the cell shows Thailand time (UTC+7) */
  function th(d) { if (!(d instanceof Date)) d = new Date(d); if (isNaN(d)) return null; return new Date(d.getTime() + 7 * 3600e3); }
  function thText(d) { /* 14 OCT26 (10:52 TH-LT) */
    var t = th(d); if (!t) return '-';
    var mon = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][t.getUTCMonth()];
    var p = function (n) { return String(n).padStart(2, '0'); };
    return p(t.getUTCDate()) + ' ' + mon + p(t.getUTCFullYear() % 100) + ' (' + p(t.getUTCHours()) + ':' + p(t.getUTCMinutes()) + ' TH-LT)';
  }

  function buildSeatWorkbook(ExcelJS, data) {
    data = data || {};
    var state = data.state || {};
    var L = root.seatPlanLayout(), P = root.planSheet(L), S = root.SEAT_S, M = root.SEAT_M, C = root.SEAT_COLOR;
    var wb = new ExcelJS.Workbook();
    wb.creator = 'STATUS SEAT PLAN A320(05)';
    wb.calcProperties = { fullCalcOnLoad: true };
    var ws = wb.addWorksheet('ผังที่นั่ง', {
      views: [{ showGridLines: false }],
      pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });
    Object.keys(P.widths).forEach(function (c) { ws.getColumn(Number(c)).width = P.widths[c] / 7; });
    Object.keys(P.heights).forEach(function (r) { ws.getRow(Number(r)).height = P.heights[r] * 0.75; });

    function count(q) {
      var n = 0;
      q.ids.forEach(function (id) { var d = state[id] || {}; if (q.vals.indexOf((d[q.f] | 0)) >= 0) n++; });
      return n;
    }
    P.ops.forEach(function (o) {
      var r2 = o.r + o.rs - 1, c2 = o.c + o.cs - 1, rr, cc;
      if (o.cabin) {
        for (rr = o.r; rr <= r2; rr++) for (cc = o.c; cc <= c2; cc++) ws.getCell(rr, cc).fill = fill(o.fill);
        return;
      }
      if (o.rs > 1 || o.cs > 1) ws.mergeCells(o.r, o.c, r2, c2);
      var cell = ws.getCell(o.r, o.c);
      if (o.v !== undefined && o.v !== null) {
        cell.value = String(o.v).charAt(0) === '=' ? { formula: o.v.slice(1), result: o.q ? count(o.q) : undefined } : o.v;
      }
      cell.font = font(o.font);
      var a = o.align || {};
      cell.alignment = { horizontal: a.h, vertical: a.v || 'middle', wrapText: !!a.wrap };
      if (o.fmt) cell.numFmt = o.fmt;
      for (rr = o.r; rr <= r2; rr++) for (cc = o.c; cc <= c2; cc++) {
        var x = ws.getCell(rr, cc);
        if (o.fill) x.fill = fill(o.fill);
        if (o.border) x.border = BOX;
      }
      if (o.dv) cell.dataValidation = { type: 'list', allowBlank: true, formulae: ['"' + (o.dv === 'M' ? M : S).join(',') + '"'] };
    });
    var med = { style: 'medium', color: { argb: argb(C.MUTED) } };
    P.boxes.forEach(function (b) {
      for (var rr = b.r1; rr <= b.r2; rr++) for (var cc = b.c1; cc <= b.c2; cc++) {
        if (rr !== b.r1 && rr !== b.r2 && cc !== b.c1 && cc !== b.c2) continue;
        var x = ws.getCell(rr, cc), bd = Object.assign({}, x.border || {});
        if (rr === b.r1) bd.top = med; if (rr === b.r2) bd.bottom = med; if (cc === b.c1) bd.left = med; if (cc === b.c2) bd.right = med;
        x.border = bd;
      }
    });
    var rules = P.cf.map(function (c, i) {
      var st = { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: argb(c.fill) } } };
      if (c.font) st.font = { color: { argb: argb(c.font) } };
      return c.text !== undefined
        ? { type: 'cellIs', operator: 'equal', priority: i + 1, formulae: ['"' + c.text + '"'], style: st }
        : { type: 'expression', priority: i + 1, formulae: [c.f.slice(1)], style: st };
    });
    ws.addConditionalFormatting({ ref: P.cf[0].range, rules: rules });

    /* header and current state */
    var ls = data.lastSave || {};
    ws.getCell('D2').value = ls.by || '-';
    ws.getCell('M2').value = ls.at ? thText(ls.at) : '-';
    if (data.inspector) ws.getCell('D3').value = data.inspector;
    ws.getCell('B4').value = 'บันทึกสภาพที่นั่งและ Monitor · Export จากหน้าเว็บ ' + thText(new Date()) + ' · เวลาทั้งหมดเป็นเวลาประเทศไทย (TH-LT)';
    L.order.forEach(function (id) {
      var it = L.items[id], p = P.pos[id], d = state[id]; if (!d || !p) return;
      ws.getCell(p.status[0], p.status[1]).value = it.kind === 'mon' ? M[d.m | 0] : S[d.s | 0];
      if (d.note) ws.getCell(p.note[0], p.note[1]).value = d.note;
    });

    /* list sheets */
    var ZN = {}; root.SEAT_ZONES.forEach(function (z) { ZN[z.key] = z.name; });
    var HDR = ['ที่นั่ง / จุด', 'ประเภท', 'โซน', 'สภาพที่นั่ง', 'สภาพ Monitor', 'หมายเหตุ', 'ผู้บันทึกล่าสุด', 'วัน/เวลาล่าสุด (TH-LT)'];
    var WID = [52, 10, 18, 16, 14, 44, 24, 20];
    var CENTER = { horizontal: 'center', vertical: 'middle', wrapText: true };
    function col(n) { return root.seatColName(n); }
    function statusCF(s, end) {
      if (end < 2) return;
      var red = { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: argb(C.RED) } }, font: { color: { argb: 'FFFFFFFF' } } };
      var yel = { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: argb(C.YEL) } } };
      s.addConditionalFormatting({ ref: 'D2:E' + end, rules: [
        { type: 'cellIs', operator: 'equal', priority: 1, formulae: ['"' + S[1] + '"'], style: yel },
        { type: 'cellIs', operator: 'equal', priority: 2, formulae: ['"' + M[1] + '"'], style: yel },
        { type: 'cellIs', operator: 'equal', priority: 3, formulae: ['"' + S[2] + '"'], style: red },
        { type: 'cellIs', operator: 'equal', priority: 4, formulae: ['"' + M[2] + '"'], style: red }
      ] });
    }
    function header(s, titles, widths) {
      titles.forEach(function (t, j) {
        var c = s.getCell(1, j + 1); c.value = t; c.font = font({ sz: 10, b: true }); c.fill = fill(C.ZONEH); c.border = BOX; c.alignment = CENTER;
        s.getColumn(j + 1).width = widths[j];
      });
      s.views = [{ state: 'frozen', ySplit: 1 }];
    }
    function listSheet(title, ids, live) {
      var s = wb.addWorksheet(title); header(s, HDR, WID);
      var q = "'ผังที่นั่ง'!";
      ids.forEach(function (id, i) {
        var row = 2 + i, it = L.items[id], p = P.pos[id], d = state[id] || {}, isMon = it.kind === 'mon';
        var st = col(p.status[1]) + p.status[0], nt = col(p.note[1]) + p.note[0];
        var vals = [it.name, isMon ? 'Monitor' : 'ที่นั่ง', ZN[it.zone]];
        if (live) {
          vals.push(isMon ? '-' : { formula: q + st, result: S[d.s | 0] });
          vals.push(isMon ? { formula: q + st, result: M[d.m | 0] } : '-');
          vals.push({ formula: 'IF(' + q + nt + '="",""' + ',' + q + nt + ')', result: d.note || '' });
        } else {
          vals.push(isMon ? '-' : S[d.s | 0], isMon ? M[d.m | 0] : '-', d.note || '');
        }
        vals.push(d.by || '', d.at ? th(d.at) : '');
        vals.forEach(function (v, j) {
          var c = s.getCell(row, j + 1); c.value = v; c.font = font(); c.border = BOX;
          c.alignment = { horizontal: (j === 0 || j === 5 || j === 6) ? 'left' : 'center', vertical: 'top', wrapText: j === 0 || j === 5 };
        });
        s.getCell(row, 8).numFmt = 'dd/mm/yyyy hh:mm';
      });
      var end = 1 + ids.length; statusCF(s, end);
      if (end >= 2) s.autoFilter = 'A1:H' + end;
      return s;
    }
    var bad = L.order.filter(function (id) { var d = state[id] || {}; return (d.s | 0) || (d.m | 0) || d.note; });
    var sBad = listSheet('รวมข้อขัดข้องคงค้าง', bad, false);
    if (!bad.length) { sBad.getCell('A2').value = 'ไม่มีข้อขัดข้องคงค้าง'; sBad.getCell('A2').font = font(); }
    listSheet('ทุกที่นั่ง และ Monitor', L.order, true);

    /* history: every cell centred (horizontal + vertical) */
    var h = wb.addWorksheet('ประวัติการแก้ไข');
    header(h, ['วัน/เวลา (TH-LT)', 'อีเมลผู้แก้ไข', 'ผู้ตรวจ', 'ที่นั่ง / จุด', 'รายการ', 'ค่าเดิม', 'ค่าใหม่'], [20, 30, 24, 52, 14, 36, 36]);
    var hist = data.history;
    if (!hist) {
      h.mergeCells('A2:G2'); h.getCell('A2').value = 'ไม่สามารถดึงประวัติการแก้ไขได้ ดูในแท็บ "ประวัติการแก้ไข" ของ Google Sheet';
      h.getCell('A2').font = font(); h.getCell('A2').alignment = CENTER;
    } else {
      hist.forEach(function (row, i) {
        row.forEach(function (v, j) {
          var c = h.getCell(2 + i, j + 1);
          if (j === 0) { var t = (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v)) ? th(v) : null; c.value = t || String(v || ''); if (t) c.numFmt = 'dd/mm/yyyy hh:mm:ss'; }
          else c.value = v === null || v === undefined ? '' : String(v);
          c.font = font(); c.border = BOX; c.alignment = CENTER;
        });
      });
      if (hist.length) h.autoFilter = 'A1:G' + (1 + hist.length);
    }
    return wb;
  }

  root.buildSeatWorkbook = buildSeatWorkbook;
  root.seatThText = thText;
})(typeof window !== 'undefined' ? window : this);
