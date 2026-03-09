import React, { useState, useEffect } from 'react';
import { VideoItem } from '../types';

interface VideoPlayerModalProps {
    video: VideoItem;
    onClose: () => void;
}

const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};


export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
    const [videoUrl, setVideoUrl] = useState<string>('');

    useEffect(() => {
        if (!video) return;

        const blob = base64ToBlob(video.videoSource.data, video.videoSource.mimeType);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [video]);
    
    return (
        <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="glass-panel rounded-2xl shadow-2xl p-1 w-full max-w-5xl m-4 relative border border-slate-700 animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute -top-12 right-0 z-10 p-2 text-white hover:text-indigo-400 transition-colors flex items-center">
                     Close Preview
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <video 
                    src={videoUrl} 
                    controls 
                    autoPlay
                    className="w-full max-h-[80vh] rounded-xl bg-black shadow-2xl"
                >
                    Your browser does not support the video tag.
                </video>
                <div className="p-6 text-center bg-slate-900/80 rounded-b-xl border-t border-white/5">
                    <p className="text-slate-300 font-light text-lg">{video.prompt}</p>
                </div>
            </div>
        </div>
    );
};