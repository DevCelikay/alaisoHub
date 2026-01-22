import React from 'react';
import { ChevronRight, FileText } from 'lucide-react';

export default function SOPIndex() {
    const categories = [
        {
            name: "Deployment",
            sops: [
                { title: "Production Deployment", id: "dep-01" },
                { title: "Staging Rollback", id: "dep-02" },
            ]
        },
        {
            name: "Onboarding",
            sops: [
                { title: "New Developer Setup", id: "onb-01" },
                { title: "Access Request Flow", id: "onb-02" },
            ]
        }
    ];

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Standard Operating Procedures</h1>
                <p className="text-gray-500 mt-2">Browse the complete library of operational guides.</p>
            </header>

            <div className="space-y-6">
                {categories.map((cat, i) => (
                    <section key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">{cat.name}</h2>
                        <div className="space-y-2">
                            {cat.sops.map((sop) => (
                                <div key={sop.id} className="group flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors border border-transparent hover:border-indigo-100">
                                    <div className="flex items-center">
                                        <FileText size={18} className="text-gray-400 group-hover:text-indigo-500 mr-3" />
                                        <span className="font-medium text-gray-700 group-hover:text-indigo-700">{sop.title}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400" />
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
