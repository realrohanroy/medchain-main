"use client"

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from "recharts"

const data = [
    { name: "Lab Results", value: 45 },
    { name: "Prescriptions", value: 30 },
    { name: "Imaging", value: 15 },
    { name: "Surgical Notes", value: 10 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function RecordTypesPieChart() {
    return (
        <div className="h-[350px] w-full mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                className="hover:opacity-80 transition-opacity duration-300 outline-none"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderRadius: '12px',
                            border: '1px solid hsl(var(--border))',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                            fontWeight: 600,
                            padding: '12px 16px'
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
                        formatter={(value: any) => [`${value}%`, 'Percentage']}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: '13px', fontWeight: 500 }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
