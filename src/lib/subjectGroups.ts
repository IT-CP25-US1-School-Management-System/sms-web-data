export interface SubjectGroup {
  id: number
  name: string
}

export const subjectGroups: SubjectGroup[] = [
  { id: 13, name: 'คณะผู้บริหาร' },
  { id: 1, name: 'กลุ่มสาระภาษาไทย' },
  { id: 2, name: 'กลุ่มสาระฯคณิตศาสตร์' },
  { id: 3, name: 'กลุ่มสาระฯวิทยาศาสตร์และเทคโนโลยี' },
  { id: 4, name: 'กลุ่มสาระฯสังคมศึกษา ศาสนา และวัฒนธรรม' },
  { id: 5, name: 'กลุ่มสาระฯภาษาต่างประเทศ' },
  { id: 6, name: 'กลุ่มสาระฯการงานอาชีพ' },
  { id: 7, name: 'กลุ่มสาระฯสุขศึกษาและพลศึกษา' },
  { id: 8, name: 'กลุ่มสาระฯศิลปะ' },
  { id: 9, name: 'งานคอมพิวเตอร์' },
  { id: 10, name: 'งานแนะแนว' },
  { id: 11, name: 'งานบรรณารักษ์' },
  { id: 12, name: 'บุคลากรทางการศึกษา' },
]

export function getSubjectGroupName(departmentId: number | string | null | undefined) {
  if (departmentId === null || departmentId === undefined || departmentId === '') return undefined

  const id = Number(String(departmentId).trim())
  return subjectGroups.find((group) => group.id === id)?.name
}
