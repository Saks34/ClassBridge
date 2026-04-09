import { useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';

export default function StreamInfo({ streamKey, ingestionUrl }) {
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedKey, setCopiedKey] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const copyToClipboard = async (text, setter) => {
        if (!text) return;
        await navigator.clipboard.writeText(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    return (
        <div className="rounded-2xl shadow-xl border border-outline-variant/10 p-6 bg-surface-container">
            <h3 className="text-xl font-bold mb-6 text-on-surface font-headline">
                OBS Stream Setup
            </h3>

            <div className="space-y-6">
                {/* RTMP URL */}
                <div>
                    <label className="text-sm font-semibold mb-2 block text-on-surface-variant">
                        Server URL (RTMP)
                    </label>
                    <div className="flex gap-2">
                        <code className="flex-1 px-4 py-3 rounded-lg text-xs font-mono overflow-x-auto bg-surface-container-high text-on-surface-variant border border-outline-variant/5">
                            {ingestionUrl || 'Loading...'}
                        </code>
                        <button
                            onClick={() => copyToClipboard(ingestionUrl, setCopiedUrl)}
                            className={`px-6 py-3 rounded-xl font-bold tracking-wider text-xs transition-all shadow-lg ${copiedUrl ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary hover:shadow-primary/20'}`}
                        >
                            {copiedUrl ? <Check className="w-4 h-4" /> : 'COPY'}
                        </button>
                    </div>
                </div>

                {/* Stream Key */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-on-surface-variant">
                            Stream Key
                        </label>
                        <button
                            onClick={() => setShowKey(!showKey)}
                            className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-primary hover:text-primary-container transition-colors"
                        >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {showKey ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <code className="flex-1 px-4 py-3 rounded-lg text-xs font-mono overflow-x-auto bg-surface-container-high text-on-surface-variant border border-outline-variant/5">
                            {showKey ? streamKey : '••••••••••••••••••••'}
                        </code>
                        <button
                            onClick={() => copyToClipboard(streamKey, setCopiedKey)}
                            className={`px-6 py-3 rounded-xl font-bold tracking-wider text-xs transition-all shadow-lg ${copiedKey ? 'bg-secondary text-on-secondary' : 'bg-primary text-on-primary hover:shadow-primary/20'}`}
                        >
                            {copiedKey ? <Check className="w-4 h-4" /> : 'COPY'}
                        </button>
                    </div>
                </div>

                {/* Quick Guide */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <h4 className="text-sm font-bold mb-3 text-primary uppercase tracking-widest">
                        Quick Setup Guide
                    </h4>
                    <ol className="space-y-2 text-xs text-on-surface-variant/80 font-medium">
                        <li>1. Open OBS Studio → Settings → Stream</li>
                        <li>2. Select "Custom" as Service</li>
                        <li>3. Paste Server URL and Stream Key</li>
                        <li>4. Click "Start Streaming"</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
