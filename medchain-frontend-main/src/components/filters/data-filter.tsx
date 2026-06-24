"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, Calendar as CalendarIcon, SlidersHorizontal } from "lucide-react"

export function DataFilter() {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by record name, CID, or doctor..."
                    className="pl-9 w-full bg-background"
                />
            </div>

            <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Date Range
                </Button>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Record Type
                </Button>
                <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    More Filters
                </Button>
                <Button>Apply Filters</Button>
            </div>
        </div>
    )
}
