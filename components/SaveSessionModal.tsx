import React, { useState, useEffect } from 'react';

interface SaveSessionModalProps {
    onClose: () => void;
    onSave: (sessionName: string) => void;
}

export const SaveSessionModal: React.FC<SaveSessionModalProps> = ({ onClose, onSave }) => {
    const [sessionName, setSessionName] = useState('');

    useEffect(() => {
        // Pre-fill with a default name when the modal opens
        const date = new Date();
        const defaultName = `a-line-ai-session-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        setSessionName(defaultName);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sessionName.trim()) {
            onSave(sessionName.trim());
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="glass-panel rounded-2xl shadow-2xl p-8 w-full max-w-md m-4 transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold mb-2 text-white">Save Session</h2>
                    <p className="text-slate-400 mb-6 text-sm">Enter a name for your session file to resume later.</p>
                    
                    <label htmlFor="sessionName" className="block text-xs font-bold uppercase text-slate-500 mb-2">Session Name</label>
                    <input
                        id="sessionName"
                        type="text"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="w-full p-3 bg-slate-950/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-white"
                        required
                        autoFocus
                    />
                    
                    <div className="flex justify-end space-x-3 mt-8">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 text-sm font-medium bg-transparent border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="px-5 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!sessionName.trim()}
                        >
                            Save File
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};