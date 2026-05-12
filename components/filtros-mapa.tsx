"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HEALTH_STATUS } from "@/lib/health-utils"

interface FiltrosMapaProps {
  activeFilters: string[]
  onFilterChange: (filters: string[]) => void
}

export function FiltrosMapa({ activeFilters, onFilterChange }: FiltrosMapaProps) {
  const filterOptions = [
    { value: "excelente", label: "Excelente" },
    { value: "regular", label: "Regular" },
    { value: "malo", label: "Crítico" },
  ]

  const handleToggle = (value: string) => {
    const newFilters = activeFilters.includes(value)
      ? activeFilters.filter((f) => f !== value)
      : [...activeFilters, value]
    onFilterChange(newFilters)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Filtros Mapa</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filterOptions.map((option) => {
              const health = HEALTH_STATUS[option.value as keyof typeof HEALTH_STATUS]
              const isChecked = activeFilters.includes(option.value)

              return (
                <div
                  key={option.value}
                  className="flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: isChecked ? health.color : "#e5e7eb",
                    backgroundColor: isChecked ? `${health.color}10` : "transparent",
                  }}
                  onClick={() => handleToggle(option.value)}
                >
                  <Checkbox
                    id={option.value}
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(option.value)}
                    className="cursor-pointer"
                  />
                  <Label
                    htmlFor={option.value}
                    className="cursor-pointer flex items-center gap-2 flex-1 mb-0"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: health.color }}
                    />
                    <span className="font-medium">{health.label}</span>
                    <span className="text-sm text-muted-foreground">
                      ({health.emoji})
                    </span>
                  </Label>
                </div>
              )
            })}
          </div>

          {activeFilters.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                Filtros activos:
              </p>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => {
                  const health = HEALTH_STATUS[filter as keyof typeof HEALTH_STATUS]
                  return (
                    <div
                      key={filter}
                      className="px-3 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: health.color }}
                    >
                      {health.emoji} {health.label}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
