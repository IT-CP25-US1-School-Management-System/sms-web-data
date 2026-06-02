<script lang="ts" setup>
import type { DateValue, RangeCalendarRootEmits, RangeCalendarRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { RangeCalendarRoot, useDateFormatter, useForwardPropsEmits } from 'reka-ui'
import { toDate } from 'reka-ui/date'
import {
  RangeCalendarCell,
  RangeCalendarCellTrigger,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHead,
  RangeCalendarGridRow,
  RangeCalendarHeadCell,
  RangeCalendarHeader,
  RangeCalendarNextButton,
  RangeCalendarPrevButton,
} from '@/components/ui/range-calendar'
import { THAI_GREGORIAN_LOCALE } from '@/lib/helpers'
import { cn } from '@/lib/utils'

const props = defineProps<RangeCalendarRootProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<RangeCalendarRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'locale')

const formatter = useDateFormatter(THAI_GREGORIAN_LOCALE)

function formatThaiBuddhistYear(year: number) {
  return String(year + 543)
}

function formatThaiBuddhistHeading(date: DateValue) {
  return `${formatter.custom(toDate(date), { month: 'long' })} ${formatThaiBuddhistYear(date.year)}`
}

function formatRangeHeading(grid: Array<{ value: DateValue }>) {
  const firstMonth = grid[0]?.value
  const lastMonth = grid[grid.length - 1]?.value

  if (!firstMonth) return ''
  if (!lastMonth || (firstMonth.month === lastMonth.month && firstMonth.year === lastMonth.year)) {
    return formatThaiBuddhistHeading(firstMonth)
  }

  return `${formatThaiBuddhistHeading(firstMonth)} - ${formatThaiBuddhistHeading(lastMonth)}`
}

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <RangeCalendarRoot
    v-slot="{ grid, weekDays }"
    v-bind="forwarded"
    :locale="THAI_GREGORIAN_LOCALE"
    data-slot="range-calendar"
    :class="cn('p-3', props.class)"
  >
    <RangeCalendarHeader>
      <div data-slot="range-calendar-heading" class="text-sm font-medium">
        {{ formatRangeHeading(grid) }}
      </div>

      <div class="flex items-center gap-1">
        <RangeCalendarPrevButton />
        <RangeCalendarNextButton />
      </div>
    </RangeCalendarHeader>

    <div class="mt-4 flex flex-col gap-y-4 sm:flex-row sm:gap-x-4 sm:gap-y-0">
      <RangeCalendarGrid v-for="month in grid" :key="month.value.toString()">
        <RangeCalendarGridHead>
          <RangeCalendarGridRow>
            <RangeCalendarHeadCell v-for="day in weekDays" :key="day">
              {{ day }}
            </RangeCalendarHeadCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridHead>
        <RangeCalendarGridBody>
          <RangeCalendarGridRow
            v-for="(weekDates, index) in month.rows"
            :key="`weekDate-${index}`"
            class="mt-2 w-full"
          >
            <RangeCalendarCell
              v-for="weekDate in weekDates"
              :key="weekDate.toString()"
              :date="weekDate"
            >
              <RangeCalendarCellTrigger :day="weekDate" :month="month.value" />
            </RangeCalendarCell>
          </RangeCalendarGridRow>
        </RangeCalendarGridBody>
      </RangeCalendarGrid>
    </div>
  </RangeCalendarRoot>
</template>
