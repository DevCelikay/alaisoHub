import React from 'react';
import { Copy, Check } from 'lucide-react';

export default function Prompts() {
    const prompts = [
        {
            title: "Code Review Assistant",
            content: "Please review the following code for security vulnerabilities, performance issues, and adherence to clean code principles. Highlight any potential bugs and suggest refactoring where appropriate.",
            tags: ["Development", "Security"]
        },
        {
            title: "SOP Generator",
            content: "Create a detailed Standard Operating Procedure for [Process Name]. Include: 1. Objective 2. Prerequisites 3. Step-by-step instructions 4. Troubleshooting 5. Verification steps.",
            tags: ["Documentation", "Productivity"]
        }
    ];

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Prompt Library</h1>
                <p className="text-gray-500 mt-2">Curated prompts for ChatGPT and interactions with custom GPTs.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {prompts.map((prompt, i) => (
                    <PromptCard key={i} prompt={prompt} />
                ))}
            </div>
        </div>
    );
}

function PromptCard({ prompt }) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{prompt.title}</h3>
                    <div className="flex gap-2 mt-2">
                        {prompt.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Copy to clipboard"
                >
                    {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm text-gray-700 leading-relaxed border border-gray-100">
                {prompt.content}
            </div>
        </div>
    );
}
