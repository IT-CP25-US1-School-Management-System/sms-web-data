export interface InnovationStudentRow {
  id?: string
  innovation_id?: string
  person_id?: string
  student_name?: string
  class_level?: string
  class_room?: string
  created_at?: string | null
  updated_at?: string | null
  innovation_student_awards_id?: string
  innovation_student_awards_innovation_id?: string
  innovation_student_awards_student_name?: string
  innovation_student_awards_class_level?: string
  innovation_student_awards_class_room?: string
  innovation_student_awards_created_at?: string | null
  innovation_student_awards_updated_at?: string | null
}

export interface InnovationStudentChanges {
  create: InnovationStudentRow[]
  update: InnovationStudentRow[]
  deleteIds: string[]
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeInnovationStudent(student: InnovationStudentRow): InnovationStudentRow {
  return {
    ...student,
    id: clean(student.id || student.innovation_student_awards_id) || undefined,
    innovation_id:
      clean(student.innovation_id || student.innovation_student_awards_innovation_id) || undefined,
    student_name: clean(student.student_name || student.innovation_student_awards_student_name),
    class_level: clean(student.class_level || student.innovation_student_awards_class_level),
    class_room: clean(student.class_room || student.innovation_student_awards_class_room),
    created_at: student.created_at || student.innovation_student_awards_created_at || null,
    updated_at: student.updated_at || student.innovation_student_awards_updated_at || null,
  }
}

function hasStudentValue(student: InnovationStudentRow) {
  return Boolean(student.student_name || student.class_level || student.class_room)
}

function studentValueKey(student: InnovationStudentRow) {
  return [student.student_name, student.class_level, student.class_room].join('\u0000')
}

function studentValuesMatch(left: InnovationStudentRow, right: InnovationStudentRow) {
  return studentValueKey(left) === studentValueKey(right)
}

export function uniqueInnovationStudents(
  students: InnovationStudentRow[] | null | undefined,
): InnovationStudentRow[] {
  const unique: InnovationStudentRow[] = []
  const seenIds = new Set<string>()
  const seenValues = new Set<string>()

  for (const source of students || []) {
    const student = normalizeInnovationStudent(source || {})
    if (!hasStudentValue(student)) continue

    const valueKey = studentValueKey(student)
    if ((student.id && seenIds.has(student.id)) || seenValues.has(valueKey)) continue

    if (student.id) seenIds.add(student.id)
    seenValues.add(valueKey)
    unique.push(student)
  }

  return unique
}

export function planInnovationStudentChanges(
  currentRows: InnovationStudentRow[] | null | undefined,
  desiredRows: InnovationStudentRow[] | null | undefined,
): InnovationStudentChanges {
  const current = (currentRows || [])
    .map((student) => normalizeInnovationStudent(student || {}))
    .filter(hasStudentValue)
  const desired = uniqueInnovationStudents(desiredRows)
  const currentById = new Map(
    current.filter((student) => student.id).map((student) => [student.id as string, student]),
  )
  const currentIdsByValue = new Map<string, string[]>()
  const unmatchedIdlessValues = new Map<string, number>()

  for (const student of current) {
    const key = studentValueKey(student)
    if (student.id) {
      currentIdsByValue.set(key, [...(currentIdsByValue.get(key) || []), student.id])
      continue
    }
    unmatchedIdlessValues.set(key, (unmatchedIdlessValues.get(key) || 0) + 1)
  }

  const keptIds = new Set<string>()
  const create: InnovationStudentRow[] = []
  const update: InnovationStudentRow[] = []

  for (const student of desired) {
    if (student.id && currentById.has(student.id)) {
      keptIds.add(student.id)
      const currentStudent = currentById.get(student.id) as InnovationStudentRow
      if (!studentValuesMatch(currentStudent, student)) update.push(student)
      continue
    }

    if (!student.id) {
      const key = studentValueKey(student)
      const matchingCurrentId = currentIdsByValue
        .get(key)
        ?.find((currentId) => !keptIds.has(currentId))
      if (matchingCurrentId) {
        keptIds.add(matchingCurrentId)
        continue
      }

      const matchCount = unmatchedIdlessValues.get(key) || 0
      if (matchCount > 0) {
        unmatchedIdlessValues.set(key, matchCount - 1)
        continue
      }
    }

    create.push(student)
  }

  const deleteIds = [
    ...new Set(
      current
        .map((student) => student.id)
        .filter((id): id is string => Boolean(id) && !keptIds.has(id as string)),
    ),
  ]

  return { create, update, deleteIds }
}
