import { describe, expect, test } from 'bun:test'
import {
  planInnovationStudentChanges,
  uniqueInnovationStudents,
} from '../src/lib/innovationStudents'

describe('innovation students', () => {
  test('does not create students again when only other innovation fields change', () => {
    const current = [
      { id: 'student-1', student_name: 'นักเรียนหนึ่ง', class_level: 'ม.4', class_room: '2' },
      { id: 'student-2', student_name: 'นักเรียนสอง', class_level: 'ม.6', class_room: '2' },
    ]
    const formValuesWithoutRelationIds = [
      { student_name: 'นักเรียนหนึ่ง', class_level: 'ม.4', class_room: '2' },
      { student_name: 'นักเรียนสอง', class_level: 'ม.6', class_room: '2' },
    ]

    expect(planInnovationStudentChanges(current, formValuesWithoutRelationIds)).toEqual({
      create: [],
      update: [],
      deleteIds: [],
    })
  })

  test('updates existing rows and creates only new students', () => {
    const changes = planInnovationStudentChanges(
      [{ id: 'student-1', student_name: 'นักเรียนหนึ่ง', class_level: 'ม.4', class_room: '2' }],
      [
        { id: 'student-1', student_name: 'นักเรียนหนึ่ง', class_level: 'ม.5', class_room: '2' },
        { student_name: 'นักเรียนสอง', class_level: 'ม.6', class_room: '1' },
      ],
    )

    expect(changes.update).toHaveLength(1)
    expect(changes.update[0]?.id).toBe('student-1')
    expect(changes.create).toHaveLength(1)
    expect(changes.create[0]?.student_name).toBe('นักเรียนสอง')
    expect(changes.deleteIds).toEqual([])
  })

  test('removes duplicate joined rows before rendering the form', () => {
    expect(
      uniqueInnovationStudents([
        {
          innovation_student_awards_id: 'student-1',
          innovation_student_awards_student_name: 'นักเรียนหนึ่ง',
          innovation_student_awards_class_level: 'ม.4',
          innovation_student_awards_class_room: '2',
        },
        { id: 'student-1', student_name: 'นักเรียนหนึ่ง', class_level: 'ม.4', class_room: '2' },
      ]),
    ).toHaveLength(1)
  })
})
