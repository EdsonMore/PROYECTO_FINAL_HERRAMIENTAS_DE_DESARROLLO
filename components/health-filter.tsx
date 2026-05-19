"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HEALTH_FILTER_OPTIONS, HEALTH_STATUS } from "@/lib/health-utils"

interface HealthFilterProps {
  activeFilters: string[]
  onFilterChange: (filters: string[]) => void
}

export function HealthFilter({ activeFilters, onFilterChange }: HealthFilterProps) {
  const handleToggle = (value: string) => {
    const newFilters = activeFilters.includes(value)
      ? activeFilters.filter((f) => f !== value)
      : [...activeFilters, value]
    onFilterChange(newFilters)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Filtrar por Estado de Salud</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {HEALTH_FILTER_OPTIONS.map((option) => {
            const health = HEALTH_STATUS[option.value as keyof typeof HEALTH_STATUS]
            const isChecked = activeFilters.includes(option.value)

            return (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(option.value)}
                  className="cursor-pointer"
                />
                <Label
                  htmlFor={option.value}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <span>{health.emoji}</span>
                  <span className="text-sm">{health.label}</span>
                </Label>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
          {activeFilters.map((filter) => {
            const health = HEALTH_STATUS[filter as keyof typeof HEALTH_STATUS]
            return (
              <div
                key={filter}
                className={`px-3 py-1 rounded-full text-xs font-medium ${health.bgColor} ${health.textColor} border ${health.borderColor}`}
              >
                {health.emoji} {health.label}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
