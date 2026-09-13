import * as XLSX from 'xlsx'
import { paFields, PA_FILE_GROUPS } from '@/lib/pa'
import type { PADetail, PAFileCategory } from '@/types/pa'

export function buildPAWorkbook(
  details: PADetail[],
  fileUrl: (id: string, category: PAFileCategory) => string,
) {
  const workbook = XLSX.utils.book_new()
  const groups = [...new Set(details.map((detail) => detail.subjectGroup))].sort((a, b) =>
    a.localeCompare(b, 'th'),
  )
  for (const [index, group] of groups.entries()) {
    const people = details
      .filter((detail) => detail.subjectGroup === group)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'th'))
    const first = people[0]
    if (!first) continue
    const headers = [
      'ปีที่ส่งคำร้อง (พ.ศ.)',
      'สถานะ',
      ...paFields(first).map((field) => field.label),
      ...PA_FILE_GROUPS.map((item) => item.label),
    ]
    const rows = people.map((detail) => [
      detail.year,
      detail.request.status || 'กำลังดำเนินการ',
      ...paFields(detail).map((field) => field.value),
      ...PA_FILE_GROUPS.map((category) =>
        detail.files.some((file) => file.category === category.id)
          ? fileUrl(detail.request.id, category.id)
          : '-',
      ),
    ])
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const fileStart = headers.length - PA_FILE_GROUPS.length
    people.forEach((detail, row) =>
      PA_FILE_GROUPS.forEach((category, column) => {
        if (!detail.files.some((file) => file.category === category.id)) return
        const cell = sheet[XLSX.utils.encode_cell({ r: row + 1, c: fileStart + column })]
        cell.l = {
          Target: fileUrl(detail.request.id, category.id),
          Tooltip: 'เข้าสู่ระบบเพื่อดาวน์โหลดไฟล์',
        }
      }),
    )
    sheet['!cols'] = headers.map((_, column) => ({
      wch: column >= fileStart ? 55 : column < 2 ? 22 : 32,
    }))
    sheet['!autofilter'] = { ref: sheet['!ref']! }
    // Prefix guarantees uniqueness even when long Thai names truncate identically.
    const sheetName = `${index + 1} ${group}`.replace(/[\\/?*\[\]:]/g, '-').slice(0, 31)
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
  }
  return workbook
}
