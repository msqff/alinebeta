import React, { useState } from 'react';
import { GalleryItem, ShopperPersona, ShopperPulseResult } from '../types';
import { generateShopperPulse } from '../services/geminiService';
import { Spinner } from './common/Spinner';

interface ShopperPulseModalProps {
    item: GalleryItem;
    onClose: () => void;
}

export const ShopperPulseModal: React.FC<ShopperPulseModalProps> = ({ item, onClose }) => {
    const [price, setPrice] = useState<string>('');
    const [persona, setPersona] = useState<ShopperPersona>('The Value Seeker');
    const [result, setResult] = useState<ShopperPulseResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleRunPulse = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum <= 0) {
            setError("Please enter a valid price in GBP.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await generateShopperPulse(item.source, priceNum, persona);
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to generate shopper feedback.");
        } finally {
            setLoading(false);
        }
    };

    const getProbabilityColor = (prob: number) => {
        if (prob >= 75) return 'text-emerald-400';
        if (prob >= 40) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="glass-panel rounded-2xl shadow-2xl p-6 w-full max-w-lg m-4 border border-indigo-500/30 flex flex-col md:flex-row overflow-hidden relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col w-full">
                    <div className="mb-6 flex items-center space-x-3">
                        <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400 border border-pink-500/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Shopper Pulse</h2>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">UK Market Viability Test</p>
                        </div>
                    </div>

                    <div className="flex space-x-6 mb-6">
                        <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-slate-700">
                            <img src={item.src} alt="Design" className="w-full h-full object-cover" />
                        </div>
                        <form onSubmit={handleRunPulse} className="flex-grow flex flex-col justify-center space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Retail Price (£ GBP)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">£</span>
                                    <input 
                                        type="number" 
                                        value={price}
                                        onChange={e => setPrice(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-7 pr-3 text-white focus:border-indigo-500 outline-none transition-colors"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shopper Persona</label>
                                <select 
                                    value={persona}
                                    onChange={(e) => setPersona(e.target.value as ShopperPersona)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-white focus:border-indigo-500 outline-none transition-colors appearance-none"
                                >
                                    <option>The Value Seeker</option>
                                    <option>The Quality Conscious</option>
                                    <option>The Trend Hunter</option>
                                </select>
                            </div>
                        </form>
                    </div>

                    {!result && !loading && (
                        <button 
                            onClick={handleRunPulse}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-900/20"
                        >
                            Get Commercial Feedback
                        </button>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Spinner />
                            <p className="mt-4 text-sm text-slate-400 animate-pulse">Surveying UK Shoppers...</p>
                        </div>
                    )}

                    {result && (
                        <div className="bg-slate-900/60 rounded-xl p-5 border border-white/10 animate-fade-in relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-indigo-500 to-pink-500 opacity-50"></div>
                            
                            <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Purchase Probability</p>
                                    <p className={`text-4xl font-black ${getProbabilityColor(result.purchase_probability)}`}>
                                        {result.purchase_probability}%
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-slate-300 border border-white/10">
                                        {persona}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                                "{result.headline}"
                            </h3>
                            
                            <div className="relative pl-4 mt-3">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-full"></div>
                                <p className="text-sm text-slate-300 italic leading-relaxed">
                                    "{result.customer_voice}"
                                </p>
                            </div>

                            <button 
                                onClick={() => setResult(null)}
                                className="mt-6 w-full py-2 text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-white transition-colors"
                            >
                                Test Another Price
                            </button>
                        </div>
                    )}

                    {error && (
                        <p className="mt-4 text-center text-sm text-red-400 bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};