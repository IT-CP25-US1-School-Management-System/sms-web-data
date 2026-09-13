import { describe, expect, test } from 'bun:test'
import { formatThaiBuddhistDateTime, getDateTimestamp } from '../src/lib/helpers'

describe('date helpers', () => {
  test('treats dataset timestamps without a timezone as UTC', () => {
    const formatted = formatThaiBuddhistDateTime('2026-09-13T21:05:42.399')

    expect(formatted).toContain('14 กันยายน 2569')
    expect(formatted).toContain('04:05')
    expect(getDateTimestamp('2026-09-13T21:05:42.399')).toBe(
      getDateTimestamp('2026-09-13T21:05:42.399Z'),
    )
  })

  test('provides timestamps that sort newer requests first', () => {
    const requests = [
      { id: 'older', created_at: '2026-09-10T08:00:00' },
      { id: 'newest', created_at: '2026-09-13T21:05:42.399' },
      { id: 'middle', created_at: '2026-09-13T20:00:00Z' },
    ]

    requests.sort(
      (left, right) => getDateTimestamp(right.created_at) - getDateTimestamp(left.created_at),
    )

    expect(requests.map(({ id }) => id)).toEqual(['newest', 'middle', 'older'])
  })
})
