import { describe, expect, test } from 'bun:test'
import { requestDetailSection } from '../src/lib/requestDetail'
import type { DocumentRequest } from '../src/types/document_request'

describe('request detail', () => {
  test('reads PA detail returned as an object and ignores empty joined placeholders', () => {
    const request: DocumentRequest = {
      id: 'request-1',
      person_id: 'person-1',
      document_type: 'การประเมินPA',
      status: 'กำลังดำเนินการ',
      created_at: '2026-09-13T21:05:42.399Z',
      request_committee_pa: {
        id: 'pa-1',
        request_id: 'request-1',
        subject_group: 'math',
        subject_name: 'คณิตศาสตร์',
        salary: 1111,
        teaching_level_1: 'ม.4',
        teaching_level_2: '',
        teaching_hours_per_week: 1,
        support_hours_per_week: 1,
        dev_quality_hours_per_week: 1,
        policy_hours_per_week: 1,
        committee_name_1: 'หนึ่ง',
        committee_name_2: 'สอง',
        committee_name_3: 'สาม',
      },
      request_general_documents: {
        id: null,
        request_id: null,
      },
    }

    const section = requestDetailSection(request)
    expect(section?.title).toBe('รายละเอียดการประเมิน PA')
    expect(
      Object.fromEntries(section?.fields.map((field) => [field.label, field.value]) || []),
    ).toMatchObject({
      กลุ่มสาระการเรียนรู้: 'กลุ่มสาระฯคณิตศาสตร์',
      เงินเดือนปัจจุบัน: '1111',
    })
  })

  test('shows a subject group saved with the shared department id', () => {
    const request: DocumentRequest = {
      id: 'request-2',
      person_id: 'person-2',
      document_type: 'การประเมินPA',
      status: 'กำลังดำเนินการ',
      created_at: '2026-09-14T10:00:00Z',
      request_committee_pa: {
        id: 'pa-2',
        request_id: 'request-2',
        subject_group: '12',
      },
    }

    const section = requestDetailSection(request)
    expect(section?.fields.find((field) => field.label === 'กลุ่มสาระการเรียนรู้')?.value).toBe(
      'บุคลากรทางการศึกษา',
    )
  })
})
