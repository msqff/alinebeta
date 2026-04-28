import React, { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { getDisplaySrc, GalleryAsset } from '../types';

interface ImageLightboxProps {
    currentAsset: GalleryAsset;
    parentAsset: GalleryAsset | null;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ currentAsset, parentAsset, onClose }) => {
    const [isComparisonMode, setIsComparisonMode] = useState(false);
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0, px: 0, py: 0 });
    const [showMagnifier, setShowMagnifier] = useState(false);
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const currentSrc = 'src' in currentAsset ? currentAsset.src : 
                        ('sources' in currentAsset ? getDisplaySrc(currentAsset.sources[0]) : 
                        ('views' in currentAsset ? getDisplaySrc(currentAsset.views[0].source) : ''));
    
    let parentSrc = '';
    if (parentAsset) {
        parentSrc = 'src' in parentAsset ? parentAsset.src : 
                    ('sources' in parentAsset ? getDisplaySrc(parentAsset.sources[0]) : 
                    ('views' in parentAsset ? getDisplaySrc(parentAsset.views[0].source) : ''));
    }

    const ZOOM_LEVEL = 2.5;
    const MAGNIFIER_SIZE = 180;

    const handleMouseMove = (e: ReactMouseEvent) => {
        if (isComparisonMode) {
            if (isDragging && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
                setSliderPos(pos);
            }
        } else {
            if (!imgRef.current) return;
            const rect = imgRef.current.getBoundingClientRect();
            // Check if mouse is within the image bounds
            if (
                e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom
            ) {
                setShowMagnifier(true);
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setMousePos({ 
                    x: e.clientX, 
                    y: e.clientY, 
                    px: x / rect.width, 
                    py: y / rect.height 
                });
                if (imgRef.current.width !== imgDimensions.width) {
                    setImgDimensions({ width: imgRef.current.width, height: imgRef.current.height });
                }
            } else {
                setShowMagnifier(false);
            }
        }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isComparisonMode && isDragging && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
            setSliderPos(pos);
        }
    };

    const handleGlobalMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging]);

    return (
        <div 
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div className="absolute top-6 right-6 flex items-center space-x-4 z-50" onClick={e => e.stopPropagation()}>
                {parentSrc && (
                    <button 
                        onClick={() => {
                            setIsComparisonMode(!isComparisonMode);
                            setShowMagnifier(false);
                        }}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${isComparisonMode ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                    >
                        {isComparisonMode ? 'Exit Comparison' : 'Compare to Parent'}
                    </button>
                )}
                
                <button 
                    onClick={onClose}
                    className="p-2 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div 
                className="relative w-full max-w-5xl h-[80vh] flex items-center justify-center overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black/50"
                ref={containerRef}
                onClick={e => e.stopPropagation()}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setShowMagnifier(false)}
            >
                {isComparisonMode && parentSrc ? (
                    <div className="relative w-full h-full cursor-ew-resize" onMouseDown={() => setIsDragging(true)}>
                        {/* Parent Image (Background) */}
                        <img 
                            src={parentSrc || undefined} 
                            alt="Parent" 
                            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none" 
                        />
                        
                        {/* Current Image (Foreground, clipped) */}
                        <div 
                            className="absolute inset-0 overflow-hidden select-none pointer-events-none border-r-2 border-indigo-500"
                            style={{ width: `${sliderPos}%` }}
                        >
                            <img 
                                src={currentSrc || undefined} 
                                alt="Current" 
                                className="absolute inset-0 w-full h-full object-contain max-w-none" 
                                style={{ width: containerRef.current?.offsetWidth || '100%' }}
                            />
                        </div>
                        
                        {/* Slider Handle */}
                        <div 
                            className="absolute top-0 bottom-0 flex items-center justify-center pointer-events-none"
                            style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                        >
                            <div className="w-8 h-8 bg-indigo-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <img 
                            ref={imgRef}
                            src={currentSrc || undefined} 
                            alt={currentAsset.tag} 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-crosshair" 
                        />
                        
                        {/* Magnifier */}
                        {showMagnifier && imgDimensions.width > 0 && (
                            <div 
                                className="fixed border-2 border-white/30 rounded-full shadow-2xl pointer-events-none z-50 bg-black/20 backdrop-blur-sm"
                                style={{
                                    width: MAGNIFIER_SIZE,
                                    height: MAGNIFIER_SIZE,
                                    left: mousePos.x - MAGNIFIER_SIZE / 2,
                                    top: mousePos.y - MAGNIFIER_SIZE / 2,
                                    backgroundImage: `url(${currentSrc})`,
                                    backgroundSize: `${imgDimensions.width * ZOOM_LEVEL}px ${imgDimensions.height * ZOOM_LEVEL}px`,
                                    backgroundPosition: `-${mousePos.px * imgDimensions.width * ZOOM_LEVEL - MAGNIFIER_SIZE / 2}px -${mousePos.py * imgDimensions.height * ZOOM_LEVEL - MAGNIFIER_SIZE / 2}px`,
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                        )}
                    </>
                )}
            </div>
            
            <div className="mt-6 text-center text-slate-300">
                <p className="font-medium">
                    {isComparisonMode 
                        ? `Comparing: ${parentAsset?.tag || 'Before'} vs ${currentAsset.tag || 'After'}` 
                        : currentAsset.tag}
                </p>
                {!isComparisonMode && (
                    <p className="text-xs text-slate-500 mt-1">Hover over the image to magnify details.</p>
                )}
            </div>
        </div>
    );
};
