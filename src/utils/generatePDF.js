/**
 * Hutrit Intelligence OS — Generador de PDFs
 * Usa jsPDF + jspdf-autotable para producir informes profesionales en el browser.
 *
 * Exports:
 *   generateAuditPDF(empresa, auditData)         → descarga PDF de auditoría
 *   generateIntelPDF(empresa, competitors, trends) → descarga PDF de inteligencia
 *   generateSEOPDF(empresa, issues, metrics)     → descarga PDF de auditoría SEO
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const C = {
  primary: [13,  92,  84],   // #0D5C54
  accent:  [13, 148, 136],   // #0D9488
  white:   [255, 255, 255],
  text:    [15,  39,  36],   // #0F2724
  muted:   [90, 138, 133],   // #5A8A85
  surface: [247, 250, 250],  // #F7FAFA
  red:     [220,  38,  38],
  amber:   [217, 119,   6],
  green:   [  5, 150, 105],
  border:  [200, 224, 221],  // #C8E0DD
}

function today() {
  return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

function filename(prefix, empresa) {
  const slug = (empresa || 'Hutrit').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  const date = new Date().toISOString().slice(0, 10)
  return `${prefix}_${slug}_${date}.pdf`
}

// ─── Shared layout helpers ────────────────────────────────────────────────────

function addPageHeader(doc, empresa) {
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, W, 14, 'F')
  doc.setTextColor(...C.white)
  doc.setFontSize(8)
  doc.setFont(undefined, 'bold')
  doc.text('HUTRIT EUROPA', 12, 9.5)
  if (empresa) doc.text(empresa.toUpperCase(), W - 12, 9.5, { align: 'right' })
}

function addPageFooter(doc, pageNum, total) {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  doc.setFillColor(...C.primary)
  doc.rect(0, H - 12, W, 12, 'F')
  doc.setTextColor(...C.white)
  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.text('hutrit.com · hutriteuropa@gmail.com', W / 2, H - 4, { align: 'center' })
  if (total > 1) doc.text(`${pageNum} / ${total}`, W - 12, H - 4, { align: 'right' })
}

function addCover(doc, title, empresa, sector, subtitle = '') {
  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // Full-page green background
  doc.setFillColor(...C.primary)
  doc.rect(0, 0, W, H, 'F')

  // Logo pill
  doc.setFillColor(...C.accent)
  doc.roundedRect(16, 20, 38, 38, 5, 5, 'F')
  doc.setTextColor(...C.white)
  doc.setFontSize(22)
  doc.setFont(undefined, 'bold')
  doc.text('H', 35, 44, { align: 'center' })

  // Brand name
  doc.setFontSize(18)
  doc.text('Hutrit Europa', 62, 35)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(200, 224, 221)
  doc.text('Intelligence OS', 62, 46)

  // Divider
  doc.setDrawColor(...C.accent)
  doc.setLineWidth(1)
  doc.line(16, 72, W - 16, 72)

  // Main title
  doc.setTextColor(...C.white)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  doc.text(title.toUpperCase(), 16, 88)

  // Empresa name (large)
  doc.setFontSize(28)
  doc.setFont(undefined, 'bold')
  const empresaLines = doc.splitTextToSize(empresa, W - 32)
  doc.text(empresaLines, 16, 104)

  // Sector + date
  const afterEmpresa = 104 + empresaLines.length * 12
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(200, 224, 221)
  doc.text(`${sector ? sector + '  ·  ' : ''}${today()}`, 16, afterEmpresa + 4)

  if (subtitle) {
    doc.setFontSize(11)
    doc.text(subtitle, 16, afterEmpresa + 16)
  }

  // Bottom accent line
  doc.setFillColor(...C.accent)
  doc.rect(0, H - 24, W, 4, 'F')

  // Footer text
  doc.setTextColor(200, 224, 221)
  doc.setFontSize(9)
  doc.text('Generado por Hutrit Intelligence OS', 16, H - 10)
  doc.text(today(), W - 16, H - 10, { align: 'right' })
}

function urgencyColor(u) {
  if (u === 'alta' || u === 'crítica') return C.red
  if (u === 'media') return C.amber
  return C.green
}

// ─── M4a — Auditoría de empresa ───────────────────────────────────────────────

export function generateAuditPDF(empresa, auditData = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let pageNum = 1

  // ── Cover ──
  addCover(doc, 'Informe de Auditoría', empresa, auditData.sector || '', 'Análisis de presencia digital y oportunidades de talento')
  addPageFooter(doc, pageNum, 3)

  // ── Página 2: Análisis ──
  doc.addPage(); pageNum++
  addPageHeader(doc, empresa)

  let y = 24

  // Oportunidad Hutrit
  if (auditData.oportunidad) {
    doc.setFillColor(...C.accent)
    doc.roundedRect(12, y, W - 24, 18, 4, 4, 'F')
    doc.setTextColor(...C.white)
    doc.setFontSize(9)
    doc.setFont(undefined, 'bold')
    doc.text('OPORTUNIDAD HUTRIT', 20, y + 6)
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    const oppLines = doc.splitTextToSize(auditData.oportunidad, W - 48)
    doc.text(oppLines, 20, y + 13)
    y += Math.max(18, oppLines.length * 5 + 14) + 6
  }

  // Ángulo de outreach
  if (auditData.angulo_outreach) {
    doc.setFillColor(254, 242, 242)
    doc.roundedRect(12, y, W - 24, 16, 4, 4, 'F')
    doc.setFillColor(...C.red)
    doc.roundedRect(12, y, 3, 16, 1, 1, 'F')
    doc.setTextColor(...C.red)
    doc.setFontSize(8)
    doc.setFont(undefined, 'bold')
    doc.text('ÁNGULO DE OUTREACH', 19, y + 5)
    doc.setFont(undefined, 'italic')
    doc.setFontSize(10)
    const hookLines = doc.splitTextToSize(`"${auditData.angulo_outreach}"`, W - 46)
    doc.text(hookLines, 19, y + 12)
    y += Math.max(16, hookLines.length * 5 + 12) + 8
  }

  // Puntos de dolor
  const puntos = auditData.puntos_dolor || []
  if (puntos.length) {
    doc.setTextColor(...C.text)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.text('Puntos de Dolor Detectados', 12, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['#', 'Área', 'Problema detectado', 'Urgencia']],
      body: puntos.map((p, i) => [i + 1, p.area || '', p.problema || '', (p.urgencia || 'media').toUpperCase()]),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: C.text },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        1: { cellWidth: 30, fontStyle: 'bold' },
        3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const u = (data.cell.raw || '').toLowerCase()
          if (u === 'alta' || u === 'critica') data.cell.styles.textColor = C.red
          else if (u === 'media')              data.cell.styles.textColor = C.amber
          else                                 data.cell.styles.textColor = C.green
        }
      },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Talento buscado
  const talento = auditData.talento_buscado || []
  if (talento.length) {
    doc.setTextColor(...C.text)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.text('Talento Que Necesitan', 12, y)
    y += 6
    talento.forEach((t, i) => {
      doc.setFillColor(...C.accent)
      doc.circle(15, y + 1.5, 2, 'F')
      doc.setTextColor(...C.text)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      doc.text(t, 20, y + 3)
      y += 8
    })
    y += 4
  }

  addPageFooter(doc, pageNum, 3)

  // ── Página 3: Presencia digital + recomendaciones ──
  doc.addPage(); pageNum++
  addPageHeader(doc, empresa)
  y = 24

  // Presencia digital
  const digital = auditData.presencia_digital || {}
  if (Object.keys(digital).some(k => digital[k] && digital[k] !== 'Ver análisis')) {
    doc.setTextColor(...C.text)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.text('Presencia Digital', 12, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Canal', 'Análisis']],
      body: Object.entries(digital).filter(([, v]) => v).map(([k, v]) => [k.toUpperCase(), v]),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: C.text },
      columnStyles: { 0: { cellWidth: 28, fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Recomendaciones
  doc.setFillColor(...C.surface)
  doc.roundedRect(12, y, W - 24, 52, 4, 4, 'F')
  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.roundedRect(12, y, W - 24, 52, 4, 4, 'S')
  y += 8

  doc.setTextColor(...C.primary)
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Próximos Pasos Recomendados', 20, y)
  y += 8

  const pasos = [
    `Contactar a ${empresa} con el ángulo detectado`,
    'Proponer una llamada de 20 minutos para presentar perfiles disponibles',
    `Enviar 2-3 CVs de talento LATAM relevante para: ${(talento.slice(0, 2)).join(', ')}`,
    'Seguimiento a los 3 días si no hay respuesta',
  ]
  pasos.forEach((p, i) => {
    doc.setFillColor(...C.accent)
    doc.roundedRect(20, y - 3, 6, 6, 1, 1, 'F')
    doc.setTextColor(...C.white)
    doc.setFontSize(8)
    doc.setFont(undefined, 'bold')
    doc.text(String(i + 1), 23, y + 1.2, { align: 'center' })
    doc.setTextColor(...C.text)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    doc.text(p, 30, y + 1)
    y += 9
  })

  addPageFooter(doc, pageNum, 3)

  doc.save(filename('Auditoria_Hutrit', empresa))
}

// ─── M4b — Inteligencia de mercado ───────────────────────────────────────────

export function generateIntelPDF(sector = 'General', competitors = [], trends = []) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let pageNum = 1

  // Cover
  addCover(doc, 'Informe de Inteligencia de Mercado', sector, 'Hutrit Europa', 'Análisis competitivo y tendencias del sector')
  addPageFooter(doc, pageNum, 2)

  // Página 2
  doc.addPage(); pageNum++
  addPageHeader(doc, sector)
  let y = 24

  // Competidores
  if (competitors.length) {
    doc.setTextColor(...C.text)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.text('Análisis Competitivo', 12, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Empresa', 'Score', 'Ads', 'Pixel', 'Contratando', 'Amenaza']],
      body: competitors.map(c => [
        c.name, c.score, c.ads ? 'Sí' : 'No', c.pixel ? 'Sí' : 'No',
        c.hiring ? 'Sí' : 'No', (c.threat || '').toUpperCase()
      ]),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'center' }, 5: { halign: 'center', fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 5) {
          const t = (data.cell.raw || '').toLowerCase()
          if (t === 'critica' || t === 'alta') data.cell.styles.textColor = C.red
          else if (t === 'media')              data.cell.styles.textColor = C.amber
          else                                 data.cell.styles.textColor = C.green
        }
      },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Tendencias
  if (trends.length) {
    doc.setTextColor(...C.text)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.text('Keywords en Crecimiento', 12, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Keyword', 'Volumen/mes', 'Tendencia', 'Oportunidad']],
      body: trends.map(t => [t.keyword, t.vol, t.trend, t.opp]),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 2: { halign: 'center', textColor: C.green, fontStyle: 'bold' }, 3: { halign: 'center' } },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
    })
  }

  addPageFooter(doc, pageNum, 2)
  doc.save(filename('Inteligencia_Hutrit', sector))
}

// ─── M4c — SEO ────────────────────────────────────────────────────────────────

export function generateSEOPDF(empresa = 'hutrit.com', issues = [], metrics = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let pageNum = 1

  addCover(doc, 'Auditoría SEO', empresa, 'Hutrit Europa', 'Diagnóstico técnico y plan de acción')
  addPageFooter(doc, pageNum, 2)

  doc.addPage(); pageNum++
  addPageHeader(doc, empresa)
  let y = 24

  // Métricas
  const metricsList = [
    ['Score SEO',           metrics.score       || '68/100'],
    ['Issues críticos',     metrics.issues      || '12'],
    ['Keywords en Top 10',  metrics.keywords    || '8'],
    ['Tráfico orgánico',    metrics.traffic     || '1.4K/mes'],
  ]

  metricsList.forEach(([label, value], i) => {
    const x = 12 + (i % 2) * ((W - 24) / 2 + 4)
    const rowY = y + Math.floor(i / 2) * 20
    doc.setFillColor(...C.surface)
    doc.roundedRect(x, rowY, (W - 32) / 2, 16, 3, 3, 'F')
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, rowY, (W - 32) / 2, 16, 3, 3, 'S')
    doc.setTextColor(...C.muted)
    doc.setFontSize(8)
    doc.text(label.toUpperCase(), x + 6, rowY + 5.5)
    doc.setTextColor(...C.primary)
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(String(value), x + 6, rowY + 13)
    doc.setFont(undefined, 'normal')
  })
  y += 46

  if (issues.length) {
    doc.setTextColor(...C.text)
    doc.setFontSize(13)
    doc.setFont(undefined, 'bold')
    doc.text('Issues por Impacto', 12, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['#', 'Prioridad', 'Issue', 'Impacto']],
      body: issues.map((issue, i) => [i + 1, (issue.priority || '').toUpperCase(), issue.title, issue.impact]),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 20, halign: 'center' },
      },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 1) {
          const p = (data.cell.raw || '').toLowerCase()
          if (p === 'critica') data.cell.styles.textColor = C.red
          else if (p === 'alta') data.cell.styles.textColor = C.amber
          else                   data.cell.styles.textColor = C.green
        }
      },
    })
  }

  addPageFooter(doc, pageNum, 2)
  doc.save(filename('SEO_Hutrit', empresa))
}

// ─── Demo: SEO Report ─────────────────────────────────────────────────────────

export function generateSEOReportPDF(data = {}, email = '') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let pageNum = 1

  addCover(doc, 'Informe SEO', data.empresa || 'Tu empresa', data.sector || '', 'Diagnóstico de posicionamiento y plan de acción')
  addPageFooter(doc, pageNum, 3)

  // Page 2: Score + Keywords + Competitors
  doc.addPage(); pageNum++
  addPageHeader(doc, data.empresa || '')
  let y = 24

  // Score banner
  doc.setFillColor(...C.accent)
  doc.roundedRect(12, y, W - 24, 20, 4, 4, 'F')
  doc.setTextColor(...C.white)
  doc.setFontSize(10); doc.setFont(undefined, 'bold')
  doc.text('SCORE SEO GENERAL', 20, y + 7)
  doc.setFontSize(18); doc.text(`${data.puntuacion || '—'} / 100`, W - 20, y + 13, { align: 'right' })
  y += 28

  if (data.resumen) {
    doc.setTextColor(...C.text); doc.setFontSize(10); doc.setFont(undefined, 'normal')
    const lines = doc.splitTextToSize(data.resumen, W - 24)
    doc.text(lines, 12, y); y += lines.length * 5 + 10
  }

  if (data.keywords?.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Keywords de alto impacto', 12, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Keyword', 'Volumen', 'Dificultad', 'Oportunidad']],
      body: data.keywords.map(k => [k.kw, (k.volumen || '').toUpperCase(), (k.dificultad || '').toUpperCase(), k.dificultad === 'baja' ? 'ALTA' : k.dificultad === 'media' ? 'MEDIA' : 'BAJA']),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: C.text },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center', fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  if (data.competidores?.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Competidores identificados', 12, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Empresa', 'Dominio', 'Posición']],
      body: data.competidores.map(c => [c.nombre, c.dominio || '—', c.posicion || 'Competidor']),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: C.text },
      columnStyles: { 0: { fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
    })
  }

  addPageFooter(doc, pageNum, 3)

  // Page 3: Issues + Plan
  doc.addPage(); pageNum++
  addPageHeader(doc, data.empresa || '')
  y = 24

  if (data.problemas?.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Problemas técnicos detectados', 12, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Impacto', 'Problema', 'Solución recomendada']],
      body: data.problemas.map(p => [(p.impacto || 'MEDIO').toUpperCase(), p.titulo, p.solucion || '']),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: C.text },
      columnStyles: { 0: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }, 1: { fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 0) {
          const v = (data.cell.raw || '').toLowerCase()
          if (v === 'alto') data.cell.styles.textColor = C.red
          else if (v === 'medio') data.cell.styles.textColor = C.amber
          else data.cell.styles.textColor = C.green
        }
      },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  if (data.plan_accion?.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Plan de acción prioritario', 12, y); y += 8
    data.plan_accion.forEach((p, i) => {
      doc.setFillColor(...C.accent); doc.circle(17, y + 1.5, 3, 'F')
      doc.setTextColor(...C.white); doc.setFontSize(8); doc.setFont(undefined, 'bold')
      doc.text(String(i + 1), 17, y + 2.5, { align: 'center' })
      doc.setTextColor(...C.text); doc.setFont(undefined, 'normal'); doc.setFontSize(10)
      const lines = doc.splitTextToSize(p.accion, W - 56)
      doc.text(lines, 24, y + 1)
      doc.setTextColor(...C.accent); doc.setFontSize(9); doc.setFont(undefined, 'bold')
      doc.text(p.plazo || '', W - 12, y + 1, { align: 'right' })
      y += Math.max(8, lines.length * 5 + 4)
    })
  }

  if (email) {
    y += 6
    doc.setTextColor(...C.muted); doc.setFontSize(9); doc.setFont(undefined, 'normal')
    doc.text(`Informe generado para: ${email}`, 12, y)
  }

  addPageFooter(doc, pageNum, 3)
  doc.save(filename('Informe_SEO', data.empresa || 'empresa'))
}

// ─── Demo: Marketing Report ───────────────────────────────────────────────────

export function generateMarketingReportPDF(data = {}, fields = {}, imageBase64 = null) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let pageNum = 1

  addCover(doc, 'Pack de Marketing', data.empresa || 'Tu empresa', data.sector || '', 'Estrategia de contenido, posts y creativo visual')
  addPageFooter(doc, pageNum, 3)

  // Page 2: Strategy + LinkedIn
  doc.addPage(); pageNum++
  addPageHeader(doc, data.empresa || '')
  let y = 24

  if (data.estrategia) {
    doc.setFillColor(...C.accent)
    doc.roundedRect(12, y, W - 24, 18, 4, 4, 'F')
    doc.setTextColor(...C.white); doc.setFontSize(9); doc.setFont(undefined, 'bold')
    doc.text('ESTRATEGIA', 20, y + 6)
    doc.setFontSize(10); doc.setFont(undefined, 'normal')
    const sl = doc.splitTextToSize(data.estrategia, W - 48)
    doc.text(sl, 20, y + 13)
    y += Math.max(18, sl.length * 5 + 14) + 8
  }

  if (data.posts_linkedin?.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Posts para LinkedIn', 12, y); y += 8

    data.posts_linkedin.forEach((post, i) => {
      if (y > 240) { doc.addPage(); pageNum++; addPageHeader(doc, data.empresa || ''); y = 24 }
      doc.setFillColor(...C.surface); doc.roundedRect(12, y, W - 24, 4, 2, 2, 'F')
      doc.setTextColor(...C.primary); doc.setFontSize(10); doc.setFont(undefined, 'bold')
      doc.text(`Post ${i + 1}`, 16, y + 2.5)
      y += 8
      if (post.hook) {
        doc.setTextColor(...C.accent); doc.setFontSize(10); doc.setFont(undefined, 'bold')
        const hl = doc.splitTextToSize(`"${post.hook}"`, W - 24)
        doc.text(hl, 12, y); y += hl.length * 5 + 4
      }
      doc.setTextColor(...C.text); doc.setFontSize(9); doc.setFont(undefined, 'normal')
      const cl = doc.splitTextToSize(post.copy || '', W - 24)
      doc.text(cl, 12, y); y += cl.length * 5 + 12
    })
  }

  addPageFooter(doc, pageNum, 3)

  // Page 3: Instagram + Calendar
  doc.addPage(); pageNum++
  addPageHeader(doc, data.empresa || '')
  y = 24

  if (data.posts_instagram?.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Posts para Instagram', 12, y); y += 8

    data.posts_instagram.forEach((post, i) => {
      if (post.titulo) {
        doc.setTextColor(...C.primary); doc.setFontSize(10); doc.setFont(undefined, 'bold')
        doc.text(post.titulo, 12, y); y += 6
      }
      doc.setTextColor(...C.text); doc.setFontSize(9); doc.setFont(undefined, 'normal')
      const cl = doc.splitTextToSize(post.copy || '', W - 24)
      doc.text(cl, 12, y); y += cl.length * 5 + 4
      if (post.hashtags?.length) {
        doc.setTextColor(...C.accent); doc.setFontSize(9)
        doc.text(post.hashtags.map(h => `#${h}`).join(' '), 12, y); y += 10
      }
      y += 4
    })
  }

  if (data.calendario?.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Calendario editorial', 12, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Período', 'Acción recomendada']],
      body: data.calendario.map(c => [c.semana, c.accion]),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: C.text },
      columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' } },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
    })
    y = doc.lastAutoTable.finalY + 12
  }

  if (imageBase64) {
    try {
      if (y > 180) { doc.addPage(); pageNum++; addPageHeader(doc, data.empresa || ''); y = 24 }
      doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
      doc.text('Creativo visual generado', 12, y); y += 6
      const imgH = 60
      doc.addImage(imageBase64, 'JPEG', 12, y, 60, imgH)
      if (data.creativo_concepto?.mensaje_clave) {
        doc.setTextColor(...C.text); doc.setFontSize(10); doc.setFont(undefined, 'bold')
        const ml = doc.splitTextToSize(data.creativo_concepto.mensaje_clave, W - 88)
        doc.text(ml, 80, y + 10)
        doc.setFont(undefined, 'normal'); doc.setFontSize(9); doc.setTextColor(...C.muted)
        if (data.creativo_concepto.descripcion) {
          const dl = doc.splitTextToSize(data.creativo_concepto.descripcion, W - 88)
          doc.text(dl, 80, y + 20)
        }
      }
    } catch (_) { /* skip image if error */ }
  }

  if (fields.email) {
    const H = doc.internal.pageSize.getHeight()
    doc.setPage(pageNum)
    doc.setTextColor(...C.muted); doc.setFontSize(9); doc.setFont(undefined, 'normal')
    doc.text(`Generado para: ${fields.nombre || ''} · ${fields.email}${fields.empresa ? ` · ${fields.empresa}` : ''}`, 12, H - 16)
  }

  addPageFooter(doc, pageNum, 3)
  doc.save(filename('Pack_Marketing', data.empresa || 'empresa'))
}

// ─── Demo: Ventas / Prospects Report ─────────────────────────────────────────

export function generateVentasReportPDF(data = {}, email = '') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  let pageNum = 1

  addCover(doc, 'Lista de Prospectos', data.oferta ? (data.oferta.slice(0, 40) + (data.oferta.length > 40 ? '...' : '')) : 'Tu oferta', '', 'Empresas calificadas y estrategia de outreach')
  addPageFooter(doc, pageNum, 3)

  // Page 2: Strategy + Prospects table
  doc.addPage(); pageNum++
  addPageHeader(doc, 'Prospectos')
  let y = 24

  if (data.estrategia_general) {
    doc.setFillColor(...C.accent); doc.roundedRect(12, y, W - 24, 18, 4, 4, 'F')
    doc.setTextColor(...C.white); doc.setFontSize(9); doc.setFont(undefined, 'bold')
    doc.text('ESTRATEGIA DE VENTAS', 20, y + 6)
    doc.setFontSize(10); doc.setFont(undefined, 'normal')
    const sl = doc.splitTextToSize(data.estrategia_general, W - 48)
    doc.text(sl, 20, y + 13)
    y += Math.max(18, sl.length * 5 + 14) + 8
  }

  if (data.prospectos?.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Empresas objetivo', 12, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Empresa', 'Sector', 'Tamaño', 'Prioridad']],
      body: data.prospectos.map(p => [p.empresa, p.sector, p.tamaño, (p.prioridad || 'MEDIA').toUpperCase()]),
      headStyles: { fillColor: C.primary, textColor: C.white, fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: C.text },
      columnStyles: { 0: { fontStyle: 'bold' }, 3: { halign: 'center', fontStyle: 'bold', cellWidth: 22 } },
      alternateRowStyles: { fillColor: [247, 250, 250] },
      margin: { left: 12, right: 12 },
      didParseCell(d) {
        if (d.section === 'body' && d.column.index === 3) {
          const v = (d.cell.raw || '').toLowerCase()
          if (v === 'alta') d.cell.styles.textColor = C.red
          else if (v === 'media') d.cell.styles.textColor = C.amber
          else d.cell.styles.textColor = C.green
        }
      },
    })
  }

  addPageFooter(doc, pageNum, 3)

  // Page 3: Outreach details
  doc.addPage(); pageNum++
  addPageHeader(doc, 'Outreach')
  y = 24

  const alta = (data.prospectos || []).filter(p => p.prioridad === 'alta')
  if (alta.length) {
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Prospectos de alta prioridad', 12, y); y += 8

    alta.forEach(p => {
      if (y > 240) { doc.addPage(); pageNum++; addPageHeader(doc, 'Outreach'); y = 24 }
      doc.setFillColor(...C.surface); doc.roundedRect(12, y, W - 24, 6, 2, 2, 'F')
      doc.setTextColor(...C.primary); doc.setFontSize(10); doc.setFont(undefined, 'bold')
      doc.text(p.empresa, 16, y + 4)
      doc.setFillColor(...C.red); doc.roundedRect(W - 30, y + 1, 18, 4, 1, 1, 'F')
      doc.setTextColor(...C.white); doc.setFontSize(7); doc.text('ALTA', W - 21, y + 4, { align: 'center' })
      y += 10
      if (p.por_que) {
        doc.setTextColor(...C.text); doc.setFontSize(9); doc.setFont(undefined, 'normal')
        const wl = doc.splitTextToSize(p.por_que, W - 24)
        doc.text(wl, 12, y); y += wl.length * 5 + 4
      }
      if (p.angulo_outreach) {
        doc.setFillColor(255, 247, 237); doc.roundedRect(12, y, W - 24, 10, 2, 2, 'F')
        doc.setTextColor(120, 53, 15); doc.setFontSize(8); doc.setFont(undefined, 'bold')
        doc.text('ÁNGULO:', 16, y + 4)
        doc.setFont(undefined, 'normal'); doc.setFontSize(8)
        const al = doc.splitTextToSize(p.angulo_outreach, W - 52)
        doc.text(al, 38, y + 4)
        y += Math.max(10, al.length * 4 + 6) + 6
      }
    })
  }

  if (data.email_template) {
    if (y > 180) { doc.addPage(); pageNum++; addPageHeader(doc, 'Plantilla Email'); y = 24 }
    doc.setTextColor(...C.text); doc.setFontSize(13); doc.setFont(undefined, 'bold')
    doc.text('Plantilla de primer contacto', 12, y); y += 8
    doc.setFillColor(...C.surface); const tl = doc.splitTextToSize(data.email_template, W - 36)
    const th = tl.length * 5 + 12
    doc.roundedRect(12, y, W - 24, th, 3, 3, 'F')
    doc.setDrawColor(...C.border); doc.setLineWidth(0.3); doc.roundedRect(12, y, W - 24, th, 3, 3, 'S')
    doc.setTextColor(...C.text); doc.setFontSize(9); doc.setFont(undefined, 'normal')
    doc.text(tl, 18, y + 8); y += th + 6
  }

  if (email) {
    doc.setTextColor(...C.muted); doc.setFontSize(9)
    doc.text(`Generado para: ${email}`, 12, y)
  }

  addPageFooter(doc, pageNum, 3)
  doc.save(filename('Lista_Prospectos', (data.prospectos?.[0]?.sector || 'ventas')))
}
