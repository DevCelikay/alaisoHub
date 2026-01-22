import React from 'react';

export default function Home() {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-10 text-white shadow-xl">
                <h1 className="text-4xl font-bold mb-4">Welcome to Alaiso Hub</h1>
                <p className="text-lg opacity-90 text-indigo-100 max-w-2xl">
                    Your central repository for Standard Operating Procedures, Prerequisites, and AI Prompts.
                    Streamline your workflow with organized documentation.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard
                    title="Prerequisites"
                    count="4"
                    description="Essential checks before starting tasks."
                    color="bg-emerald-50 text-emerald-700"
                />
                <DashboardCard
                    title="SOPs"
                    count="12"
                    description="Detailed operating procedures."
                    color="bg-blue-50 text-blue-700"
                />
                <DashboardCard
                    title="Prompts"
                    count="8"
                    description="Ready-to-use AI prompts."
                    color="bg-amber-50 text-amber-700"
                />
            </div>
        </div>
    );
}

function DashboardCard({ title, count, description, color }) {
    return (
        <div className={`p-6 rounded-2xl ${color} border border-transparent hover:border-current transition-colors cursor-pointer`}>
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <div className="text-3xl font-bold mb-2">{count}</div>
            <p className="text-sm opacity-80">{description}</p>
        </div>
    );
}
