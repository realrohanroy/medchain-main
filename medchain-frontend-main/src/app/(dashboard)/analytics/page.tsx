import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AccessBarChart } from "@/components/charts/access-bar-chart"
import { RecordTypesPieChart } from "@/components/charts/record-types-pie-chart"
import { AccessTrendsAreaChart } from "@/components/charts/access-trends-area-chart"
import { DataFilter } from "@/components/filters/data-filter"
import { Download, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AnalyticsPage() {
    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 min-h-[calc(100vh-4rem)] lg:max-w-7xl mx-auto">

            {/* Minimalist Data Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Access Analytics</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Deep-dive into your document interaction metrics across the Medchain network.</p>
                </div>
                <Button className="gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Reusable Filter System (Moved up for distinct data-flow) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-1">
                <DataFilter />
            </div>

            {/* Macro Hero Chart - Replaces the 4 KPI cards to distinguish from Dashboard */}
            <Card className="shadow-sm border-slate-200/60 bg-white">
                <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
                    <div>
                        <CardTitle className="text-lg">Network Interaction Volume</CardTitle>
                        <CardDescription className="mt-1">
                            Total instances your encrypted files were accessed or queried.
                        </CardDescription>
                    </div>
                    {/* Integrated Macro Stat instead of separate cards */}
                    <div className="text-right">
                        <div className="text-4xl font-extrabold tracking-tight text-slate-900">169</div>
                        <p className="text-sm font-medium text-emerald-600 flex items-center justify-end mt-1">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            +24% over previous period
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* New Glowing Area Chart */}
                    <AccessTrendsAreaChart />
                </CardContent>
            </Card>

            {/* Analytics Detail Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-full xl:col-span-1 shadow-sm border-slate-200/60 bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle>Provider Access Frequency</CardTitle>
                        <CardDescription>Number of times each authorized provider specifically fetched your records.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <AccessBarChart />
                    </CardContent>
                </Card>

                <Card className="col-span-full xl:col-span-1 shadow-sm border-slate-200/60 bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle>Data Type Composition</CardTitle>
                        <CardDescription>
                            Percentage breakdown of your securely pinned documents by medical category.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 flex items-center justify-center">
                        <RecordTypesPieChart />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
