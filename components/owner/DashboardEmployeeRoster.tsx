"use client"

import { Badge } from "@/components/ui"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { TextPagination } from "@/components/ui/text-pagination"
import { useMemo, useState } from "react"

export type EmployeeRow = {
  id: string
  name: string
  role: string
  modulesCompleted: number
  totalModules: number
  status: "on_track" | "needs_support"
}

const EMPLOYEES_PER_PAGE = 3

type DashboardEmployeeRosterProps = {
  employees: EmployeeRow[]
}

export function DashboardEmployeeRoster({
  employees,
}: DashboardEmployeeRosterProps) {
  const totalPages = Math.max(1, Math.ceil(employees.length / EMPLOYEES_PER_PAGE))
  const [currentPage, setCurrentPage] = useState(1)

  const pageEmployees = useMemo(
    () =>
      employees.slice(
        (currentPage - 1) * EMPLOYEES_PER_PAGE,
        currentPage * EMPLOYEES_PER_PAGE
      ),
    [currentPage, employees]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team progress</CardTitle>
        <CardDescription>
          Maria and Kevin are training on the published program. Share join code{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">HLEMON</code>{" "}
          for new hires.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y divide-border rounded-lg border">
          {pageEmployees.map((employee) => (
            <li
              key={employee.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="font-medium">{employee.name}</p>
                <p className="text-xs text-muted-foreground">{employee.role}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm tabular-nums text-muted-foreground">
                  {employee.modulesCompleted}/{employee.totalModules} modules
                </span>
                <Badge
                  tone={
                    employee.status === "on_track" ? "success" : "neutral"
                  }
                >
                  {employee.status === "on_track"
                    ? "On track"
                    : "Needs support"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
        {employees.length > EMPLOYEES_PER_PAGE ? (
          <TextPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </CardContent>
    </Card>
  )
}

