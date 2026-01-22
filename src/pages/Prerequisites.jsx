import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function Prerequisites() {
    const prerequisites = [
        { title: "Access Rights", desc: "Ensure you have Admin access to the repository." },
        { title: "VPN Connection", desc: "Connect to the corporate VPN for internal tool access." },
        { title: "Software Installation", desc: "Verify Node.js v20+ and Docker are installed." },
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Prerequisites</h1>
                <p className="text-gray-500 mt-2">Check these items before proceeding with any SOP.</p>
            </header>

            <div className="grid gap-4">
                {prerequisites.map((item, i) => (
                    <div key={i} className="flex items-start bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <CheckCircle2 className="text-emerald-500 mt-1 shrink-0" />
                        <div className="ml-4">
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-gray-600 mt-1">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
