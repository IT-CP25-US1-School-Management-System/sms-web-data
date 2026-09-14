import { describe, expect, test } from 'bun:test'
import * as XLSX from 'xlsx'
import {
  classifyPAFile,
  collectPAPages,
  buildPAQuery,
  paSubjectGroup,
  paFields,
  paSubmissionYear,
  paYearOptions,
  paLoadError,
  checkPAFilterResults,
} from '../src/lib/pa'
import { buildPAWorkbook } from '../src/lib/paExport'
import { assertPADepartmentAccess, hasPAWebRole, paAllowedDepartmentIds } from '../src/lib/paAccess'
import { buildPAUploadFilename } from '../src/lib/paUpload'
import type { PADetail, PAFileCategory } from '../src/types/pa'

function detail(id = 'request-1', group = 'คณิตศาสตร์'): PADetail {
  return {
    request: {
      id,
      person_id: 'person-1',
      document_type: 'การประเมินPA',
      created_at: '2026-09-13',
      status: 'อนุมัติ',
    },
    assessment: {
      id: 'pa-1',
      request_id: id,
      subject_group: group,
      teaching_level_1: 'ม.4',
      teaching_level_2: '',
      subject_name: 'คณิตศาสตร์ 1',
      teaching_hours_per_week: 15.9,
      support_hours_per_week: 0,
      dev_quality_hours_per_week: 2.5,
      policy_hours_per_week: 1,
      committee_name_1: 'กรรมการหนึ่ง',
      committee_name_2: 'กรรมการสอง',
      committee_name_3: 'กรรมการสาม',
      salary: 42500,
    },
    year: '2569',
    subjectGroup: group,
    fullName: 'ครู ทดสอบ',
    personInfo: {
      person: {
        id: 'person-1',
        prefix_id: 1,
        role_id: 'teacher',
        is_government: true,
        first_name_th: 'ครู',
        last_name_th: 'ทดสอบ',
        personal_email: '=TEST@example.com',
        birth_date: '1986-08-20',
        created_at: '2020-01-01',
      },
      education: [
        {
          id: 'higher',
          person_id: 'person-1',
          education_level: 'ปริญญาโท',
          qualification: 'ศษ.ม.',
          qualification_name: 'ศึกษาศาสตรมหาบัณฑิต',
          institution: 'มหาวิทยาลัยทดสอบ',
          country: 'ไทย',
          is_highest_degree: true,
          graduation_date: '2017-05-05',
        },
        {
          id: 'newer',
          person_id: 'person-1',
          education_level: 'ปริญญาตรี',
          qualification: 'วท.บ.',
          qualification_name: '',
          institution: 'มหาวิทยาลัย',
          country: 'ไทย',
          graduation_date: '2022-05-05',
        },
      ],
      licenses: [
        {
          id: 'license',
          person_id: 'person-1',
          license_type: 'A-License',
          license_no: '0012345678',
          expiry_date: '2029-01-01',
        },
      ],
      governments: [
        {
          id: 'government',
          person_id: 'person-1',
          work_status: 'ทำงาน',
          salary: 40000,
          government_entry_date: '2010-05-01',
          created_at: '2020-01-01',
        },
      ],
      ranks: [
        {
          id: 'rank',
          person_id: 'person-1',
          ranking_type: 'ครูชำนาญการ',
          awarded_date: '2020-01-01',
        },
      ],
    },
    files: (['pa1', 'pa2-1', 'pa2-2', 'pa2-3', 'pa3', 'other'] as PAFileCategory[]).map(
      (category) => ({
        category,
        link: {
          document_key: category,
          entity_table: 'document_request',
          entity_id: id,
          created_at: '2026-09-13',
        },
        resource: {
          resource_id: category,
          original_filename: `${category}.pdf`,
          storage_filename: 'file.pdf',
          content_type: 'application/pdf',
          size: 100,
          created_at: '',
          metadata: {
            id: '',
            status: 'COMPLETED',
            uploaded_by: '',
            description: '',
            tags: [],
            created_at: '',
          },
          folder: { id: '', folder: '', path: { id: '', name: '', bucket_name: '' } },
          url: 'https://storage.example/temporary-signed-url',
        },
      }),
    ),
  }
}

describe('PA reports', () => {
  test('adds document category prefixes and classifies uploaded PA filenames', () => {
    expect(buildPAUploadFilename('เอกสาร.pdf', 'pa2-pa1')).toBe('pa1-เอกสาร.pdf')
    expect(buildPAUploadFilename('ผลประเมิน.pdf', 'pa2-eval1')).toBe('pa2-กรรมการ1-ผลประเมิน.pdf')
    expect(
      buildPAUploadFilename('คณิตศาสตร์-สมชาย-ตัวอย่าง-คศ.2-pa2-กรรมการ1.pdf', 'pa2-eval1'),
    ).toBe('คณิตศาสตร์-สมชาย-ตัวอย่าง-คศ.2-pa2-กรรมการ1.pdf')
    expect(buildPAUploadFilename('pa3-หลักฐาน.pdf', 'pa3')).toBe('pa3-หลักฐาน.pdf')
    expect(classifyPAFile('pa1-เอกสาร.pdf')).toBe('pa1')
    expect(classifyPAFile('pa2-กรรมการ2-ผลประเมิน.pdf')).toBe('pa2-2')
    expect(classifyPAFile('pa3-หลักฐาน.pdf')).toBe('pa3')
  })
  test('does not present ignored server filters as a successfully filtered page', () => {
    expect(() =>
      checkPAFilterResults([detail().request], { page: 1, per_page: 15, year: 2568 }),
    ).toThrow('นอกปี')
    expect(() =>
      checkPAFilterResults([detail().request], { page: 1, per_page: 15, departmentId: 2 }),
    ).not.toThrow()
    expect(() =>
      checkPAFilterResults([{ ...detail().request, person_data: { department_id: 1 } }], {
        page: 1,
        per_page: 15,
        departmentId: 2,
      }),
    ).toThrow('department_id')
    expect(() =>
      checkPAFilterResults([detail().request], { page: 1, per_page: 15, year: 2569 }),
    ).not.toThrow()
    expect(() =>
      checkPAFilterResults([detail().request], {
        page: 1,
        per_page: 15,
        status: 'กำลังดำเนินการ',
      }),
    ).toThrow('สถานะ')
  })
  test('year dropdown includes this year and ten prior years using Bangkok time', () => {
    const years = paYearOptions(new Date('2025-12-31T18:00:00Z'))
    expect(years).toHaveLength(11)
    expect(years[0]).toBe(2569)
    expect(years.at(-1)).toBe(2559)
  })
  test('reports disallowed dataset filters without pretending the query succeeded', () => {
    expect(
      paLoadError({
        response: { data: { message: 'filter is not allowed: document_requests.created_at >=' } },
      }),
    ).toContain('where_allow')
    expect(paLoadError(new Error('network'))).toContain('กรุณาลองใหม่')
  })
  test('year uses Buddhist calendar and Bangkok boundary', () => {
    expect(paSubmissionYear('2025-12-31T18:00:00Z')).toBe('2569')
    expect(paSubmissionYear('invalid')).toBe('ไม่ระบุปี')
  })
  test('sends page size, department id, year boundaries and name search as server filters', () => {
    const query = buildPAQuery({
      page: 3,
      per_page: 25,
      year: 2569,
      departmentId: 2,
      status: 'อนุมัติ',
      search: ' ทดสอบ ',
    })
    expect(query.page).toBe(3)
    expect(query.per_page).toBe(25)
    expect(query.where_logical_operator).toBe('AND')
    expect(query.where).toEqual([
      [
        {
          table_name: 'document_requests',
          field: 'document_type',
          operator: '=',
          value: 'การประเมินPA',
        },
      ],
      [{ table_name: 'person_data', field: 'department_id', operator: '=', value: 2 }],
      [{ table_name: 'document_requests', field: 'status', operator: '=', value: 'อนุมัติ' }],
      [
        {
          table_name: 'document_requests',
          field: 'created_at',
          operator: '>',
          value: '2025-12-31T23:59:59.999+07:00',
        },
      ],
      [
        {
          table_name: 'document_requests',
          field: 'created_at',
          operator: '<',
          value: '2027-01-01T00:00:00+07:00',
        },
      ],
      [
        { table_name: 'person_data', field: 'first_name_th', operator: 'LIKE', value: '%ทดสอบ%' },
        { table_name: 'person_data', field: 'last_name_th', operator: 'LIKE', value: '%ทดสอบ%' },
      ],
    ])
    expect(buildPAQuery({ page: 1, per_page: 15 }).where).toHaveLength(1)
  })
  test('rejects invalid filters and maps department IDs including executives', () => {
    expect(() => buildPAQuery({ page: 0, per_page: 15 })).toThrow()
    expect(() => buildPAQuery({ page: 1, per_page: 0 })).toThrow()
    expect(() => buildPAQuery({ page: 1, per_page: 15, departmentId: 14 })).toThrow()
    expect(() => buildPAQuery({ page: 1, per_page: 15, year: 2569.5 })).toThrow()
    expect(() => buildPAQuery({ page: 1, per_page: 15, status: 'เสร็จสิ้น' as never })).toThrow()
    expect(paSubjectGroup({ ...detail().request, department_id: '13' })).toBe('คณะผู้บริหาร')
    expect(paSubjectGroup({ ...detail().request, department_id: 2 })).toBe('กลุ่มสาระฯคณิตศาสตร์')
    expect(paSubjectGroup({ ...detail().request, person_data: { department_id: 1 } })).toBe(
      'กลุ่มสาระภาษาไทย',
    )
    expect(paSubjectGroup({ ...detail().request, department_id: 999 })).toBe(
      'ไม่ระบุกลุ่มสาระการเรียนรู้',
    )
    expect(paSubjectGroup(detail().request, detail('request-1', '2').assessment)).toBe(
      'กลุ่มสาระฯคณิตศาสตร์',
    )
    expect(paSubjectGroup(detail().request, detail('request-1', 'math').assessment)).toBe(
      'ไม่ระบุกลุ่มสาระการเรียนรู้',
    )
  })
  test('limits web PA access to departments assigned by roles', () => {
    expect(hasPAWebRole(['teacher', 'pa-thai'])).toBe(true)
    expect(hasPAWebRole(['teacher'])).toBe(false)
    expect(paAllowedDepartmentIds(['pa-thai', 'pa-art', 'pa-thai'])).toEqual([1, 8])
    expect(paAllowedDepartmentIds(['pa'])).toEqual([13, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

    const thaiRequest = { ...detail().request, person_data: { department_id: 1 } }
    expect(() => assertPADepartmentAccess(thaiRequest, [1, 8])).not.toThrow()
    expect(() => assertPADepartmentAccess(thaiRequest, [8])).toThrow('ไม่มีสิทธิ์')
    expect(() => assertPADepartmentAccess(detail().request, [1])).toThrow('ไม่มีสิทธิ์')
    expect(() =>
      assertPADepartmentAccess(
        {
          ...detail().request,
          request_committee_pa: { ...detail().assessment, subject_group: '8' },
        },
        [8],
      ),
    ).not.toThrow()
  })
  test('sends all authorized departments as one OR filter group', () => {
    const query = buildPAQuery({ page: 1, per_page: 15, departmentIds: [8, 1, 8] })
    expect(query.where?.[1]).toEqual([
      { table_name: 'person_data', field: 'department_id', operator: '=', value: 8 },
      { table_name: 'person_data', field: 'department_id', operator: '=', value: 1 },
    ])
    expect(() =>
      buildPAQuery({ page: 1, per_page: 15, departmentId: 1, departmentIds: [1] }),
    ).toThrow()
    expect(() => buildPAQuery({ page: 1, per_page: 15, departmentIds: [] })).toThrow()
    expect(() =>
      checkPAFilterResults([{ ...detail().request, person_data: { department_id: 8 } }], {
        page: 1,
        per_page: 15,
        departmentIds: [1, 8],
      }),
    ).not.toThrow()
    expect(() =>
      checkPAFilterResults([{ ...detail().request, person_data: { department_id: 4 } }], {
        page: 1,
        per_page: 15,
        departmentIds: [1, 8],
      }),
    ).toThrow('นอกกลุ่มสาระที่มีสิทธิ์')
  })
  test('uses identical filter conditions on every export page', async () => {
    const queries = []
    await collectPAPages(async (page) => {
      queries.push(
        buildPAQuery({ page, per_page: 1, year: 2569, departmentId: 13, search: 'ทดสอบ' }),
      )
      return { data: [page], page, per_page: 1, total_rows: 3, total_pages: 3 }
    })
    expect(queries.map((query) => query.page)).toEqual([1, 2, 3])
    expect(queries[1]?.where).toEqual(queries[0]?.where)
    expect(queries[2]?.where).toEqual(queries[0]?.where)
  })
  test('recognizes filenames without guessing ambiguous uploads', () => {
    expect(classifyPAFile('กลุ่มสาระ-ชื่อ-สกุล-คศ.2-pa1.pdf')).toBe('pa1')
    expect(classifyPAFile('กลุ่มสาระ-ชื่อ-pa2-กรรมการ1.pdf')).toBe('pa2-1')
    expect(classifyPAFile('กลุ่มสาระ-ชื่อ-PA2-กรรมการ 2.PDF')).toBe('pa2-2')
    expect(classifyPAFile('กลุ่มสาระ-ชื่อ-pa2-กรรมการ3.pdf')).toBe('pa2-3')
    expect(classifyPAFile('กลุ่มสาระ-ชื่อ-pa3.pdf')).toBe('pa3')
    expect(classifyPAFile('เอกสาร.pdf', 'การประเมินPA')).toBe('other')
  })
  test('maps highest degree, preserves license zeros and zero hours, truncates teaching hours', () => {
    const fields = Object.fromEntries(paFields(detail()).map((field) => [field.label, field.value]))
    expect(fields['ระดับการศึกษาสูงสุด']).toBe('ปริญญาโท')
    expect(fields['การสอนตามตารางสอน (ชั่วโมง/สัปดาห์)']).toBe(15)
    expect(fields['งานส่งเสริมและสนับสนุนการจัดการเรียนรู้ (ชั่วโมง/สัปดาห์)']).toBe(0)
    expect(fields['เลขที่ใบอนุญาตประกอบวิชาชีพครู/ผู้บริหารสถานศึกษา']).toBe('0012345678')
    expect(fields['วันเดือนปีเกิด (พ.ศ.)']).toBe('20 สิงหาคม 2529')
    expect(fields['เงินเดือนปัจจุบัน']).toBe(42500)
  })
  test('missing data stays missing rather than becoming zero', () => {
    const item = detail()
    item.assessment = null
    item.personInfo.education = []
    const fields = Object.fromEntries(paFields(item).map((field) => [field.label, field.value]))
    expect(fields['ระดับการศึกษาสูงสุด']).toBe('-')
    expect(fields['การสอนตามตารางสอน (ชั่วโมง/สัปดาห์)']).toBe('-')
  })
  test('loads every server page and rejects incomplete final pages', async () => {
    const calls: number[] = []
    const rows = await collectPAPages(async (page) => {
      calls.push(page)
      return { data: [page], page, per_page: 1, total_rows: 3, total_pages: 3 }
    })
    expect(rows).toEqual([1, 2, 3])
    expect(calls).toEqual([1, 2, 3])
    await expect(
      collectPAPages(async (page) => ({
        data: [],
        page,
        per_page: 10,
        total_rows: 3,
        total_pages: 1,
      })),
    ).rejects.toThrow('โหลดข้อมูลไม่ครบ')

    const brokenCountCalls: number[] = []
    const brokenCountRows = await collectPAPages(async (page) => {
      brokenCountCalls.push(page)
      if (page === 1)
        return { data: ['หนึ่ง', 'สอง'], page, per_page: 2, total_rows: 2, total_pages: 2 }
      return { data: ['สาม'], page, per_page: 2, total_rows: 3, total_pages: 2 }
    })
    expect(brokenCountRows).toEqual(['หนึ่ง', 'สอง', 'สาม'])
    expect(brokenCountCalls).toEqual([1, 2])
  })
  test('Excel round trip keeps data and authenticated frontend hyperlinks in separate unique sheets', () => {
    const prefix = 'กลุ่มสาระการเรียนรู้ที่มีชื่อยาวมากมากมาก'
    const book = buildPAWorkbook(
      [detail('a', `${prefix}หนึ่ง`), detail('b', `${prefix}สอง`)],
      (id, category) => `https://school.example/manage/pa/${id}/files?category=${category}`,
    )
    const restored = XLSX.read(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }), {
      type: 'buffer',
    })
    expect(restored.SheetNames).toHaveLength(2)
    expect(new Set(restored.SheetNames).size).toBe(2)
    for (const name of restored.SheetNames) {
      expect(name.length).toBeLessThanOrEqual(31)
      const sheet = restored.Sheets[name]!
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })
      expect(rows).toHaveLength(2)
      expect(rows[0]).toHaveLength(32)
      expect(sheet.C2?.t).toBe('s')
      expect(sheet.C2?.f).toBeUndefined()
      expect(sheet.C2?.v).toBe('=TEST@example.com')
      for (let column = 26; column < 32; column++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: 1, c: column })]!
        expect(cell.l?.Target).toStartWith('https://school.example/manage/pa/')
        expect(cell.l?.Target).not.toContain('storage.example')
      }
    }
  })
})
