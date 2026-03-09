import React, { useCallback } from 'react';

interface FileUploadProps {
    onFilesUpload: (files: File[]) => void;
    multiple?: boolean;
    compact?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesUpload, multiple = false, compact = false }) => {
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            onFilesUpload(Array.from(event.target.files));
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            onFilesUpload(Array.from(event.dataTransfer.files));
        }
    }, [onFilesUpload]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const inputId = `file-upload-${React.useId()}`;

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`flex items-center justify-center w-full ${compact ? 'h-full min-h-[100px]' : ''}`}
        >
            <label
                htmlFor={inputId}
                className={`group flex flex-col items-center justify-center w-full ${compact ? 'h-full rounded-xl' : 'h-64 rounded-2xl'} border border-slate-700 border-dashed cursor-pointer bg-slate-900/30 hover:bg-indigo-900/20 hover:border-indigo-500/50 transition-all duration-300 backdrop-blur-sm`}
            >
                <div className={`flex flex-col items-center justify-center ${compact ? 'p-2' : 'pt-5 pb-6'}`}>
                    <div className={`p-3 bg-slate-800/50 rounded-full group-hover:scale-110 transition-transform group-hover:bg-indigo-500/20 ${compact ? 'mb-2' : 'mb-3'}`}>
                        <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                        </svg>
                    </div>
                    <p className={`mb-1 text-sm text-slate-400 text-center group-hover:text-slate-300 ${compact ? 'text-xs leading-tight' : ''}`}><span className="font-semibold text-slate-200">Click to upload</span> {compact ? '' : 'or drag and drop'}</p>
                    <p className={`text-[10px] text-slate-600 uppercase tracking-wide ${compact ? 'hidden' : ''}`}>PNG, JPG, WEBP</p>
                </div>
                <input id={inputId} type="file" multiple={multiple} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            </label>
        </div>
    );
};