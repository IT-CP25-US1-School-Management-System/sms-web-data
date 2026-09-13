<script setup lang="ts">
import type { Component } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TableAction = {
  key: string
  label: string
  icon: Component
  destructive?: boolean
  disabled?: boolean
}

defineProps<{
  actions: TableAction[]
  menuLabel?: string
}>()

const emit = defineEmits<{
  select: [key: string]
}>()
</script>

<template>
  <div class="flex items-center justify-center gap-1" @click.stop @keydown.stop>
    <template v-if="actions.length <= 3">
      <Button
        v-for="action in actions"
        :key="action.key"
        variant="ghost"
        size="icon-sm"
        :class="action.destructive ? 'text-destructive hover:text-destructive' : undefined"
        :disabled="action.disabled"
        :aria-label="action.label"
        :title="action.label"
        @click="emit('select', action.key)"
      >
        <component :is="action.icon" class="h-4 w-4" />
      </Button>
    </template>

    <DropdownMenu v-else>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon-sm"
          :aria-label="menuLabel || 'การดำเนินการ'"
          :title="menuLabel || 'การดำเนินการ'"
        >
          <MoreHorizontal class="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          v-for="action in actions"
          :key="action.key"
          :variant="action.destructive ? 'destructive' : 'default'"
          :disabled="action.disabled"
          @click="emit('select', action.key)"
        >
          <component :is="action.icon" class="h-4 w-4" />
          {{ action.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
