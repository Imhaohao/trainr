"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { TextPagination } from "@/components/ui/text-pagination"
import { DashboardModuleEditor } from "@/components/owner/DashboardModuleEditor"
import type { TrainingModule } from "@/types"

const MODULES_PER_PAGE = 4

type DashboardModulesListProps = {
  businessId: string
  modules: TrainingModule[]
  onModulesChange: (modules: TrainingModule[]) => void
}

export function DashboardModulesList({
  businessId,
  modules,
  onModulesChange,
}: DashboardModulesListProps) {
  const sorted = useMemo(
    () => modules.slice().sort((a, b) => a.order - b.order),
    [modules]
  )
  const totalPages = Math.max(1, Math.ceil(sorted.length / MODULES_PER_PAGE))
  const [currentPage, setCurrentPage] = useState(1)

  const pageModules = sorted.slice(
    (currentPage - 1) * MODULES_PER_PAGE,
    currentPage * MODULES_PER_PAGE
  )

  function handleSaved(updated: TrainingModule) {
    onModulesChange(
      modules.map((m) => (m.id === updated.id ? updated : m))
    )
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-lg border">
        {pageModules.map((mod) => (
          <DashboardModuleEditor
            key={mod.id}
            businessId={businessId}
            module={mod}
            onSaved={handleSaved}
          />
        ))}
      </ul>

      {sorted.length > MODULES_PER_PAGE ? (
        <TextPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      ) : null}
    </div>
  )
}

type DashboardProgramCardProps = {
  businessId: string
  version: number
  status: string
  moduleCount: number
  modules: TrainingModule[]
}

export function DashboardProgramCard({
  businessId,
  version,
  status,
  moduleCount,
  modules: initialModules,
}: DashboardProgramCardProps) {
  const [modules, setModules] = useState(initialModules)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Training program</CardTitle>
            <CardDescription>
              Version {version} · {moduleCount} modules · {status}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/compliance">
              <Button variant="outline" size="sm">
                Compliance
              </Button>
            </Link>
            <Link href="/deploy">
              <Button size="sm">Publish</Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DashboardModulesList
          businessId={businessId}
          modules={modules}
          onModulesChange={setModules}
        />
      </CardContent>
    </Card>
  )
}
