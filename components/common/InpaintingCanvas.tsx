import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';

export interface InpaintingCanvasRef {
  getMaskDataUrl: () => string | null;
  clear: () => void;
  undo: () => void;
}

interface InpaintingCanvasProps {
  imageSrc: string;
  brushSize: number;
  brushColor?: string;
}

const InpaintingCanvas = React.forwardRef<InpaintingCanvasRef, InpaintingCanvasProps>(
  ({ imageSrc, brushSize, brushColor = 'rgba(233, 74, 107, 0.75)' }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const getCanvas = () => canvasRef.current;
    const getContext = () => getCanvas()?.getContext('2d', { willReadFrequently: true });

    useEffect(() => {
        const canvas = getCanvas();
        if (!canvas) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;
        img.onload = () => {
            const { width, height } = img;
            setDimensions({ width, height });
            canvas.width = width;
            canvas.height = height;
            const ctx = getContext();
            if (ctx) {
                // Initial clear to ensure a clean slate
                ctx.clearRect(0, 0, width, height);
                // Save the initial empty state
                const initialImageData = ctx.getImageData(0, 0, width, height);
                setHistory([initialImageData]);
                setHistoryIndex(0);
            }
        };
    }, [imageSrc]);

    const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = getCanvas();
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();

        // Intrinsic dimensions of the canvas
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Displayed dimensions of the canvas element
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        // Calculate aspect ratios
        const canvasRatio = canvasWidth / canvasHeight;
        const displayRatio = displayWidth / displayHeight;

        let renderedWidth, renderedHeight, offsetX, offsetY;

        if (canvasRatio > displayRatio) {
            // Canvas is wider than its container, it's constrained by width
            renderedWidth = displayWidth;
            renderedHeight = displayWidth / canvasRatio;
            offsetX = 0;
            offsetY = (displayHeight - renderedHeight) / 2;
        } else {
            // Canvas is taller than or same aspect as its container, it's constrained by height
            renderedHeight = displayHeight;
            renderedWidth = displayHeight * canvasRatio;
            offsetX = (displayWidth - renderedWidth) / 2;
            offsetY = 0;
        }

        const touch = 'touches' in e ? e.touches[0] : null;
        const clientX = touch ? touch.clientX : (e as React.MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (e as React.MouseEvent).clientY;

        // Mouse position relative to the canvas element's top-left
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;

        // Mouse position relative to the *rendered image area* inside the canvas element
        const relativeX = mouseX - offsetX;
        const relativeY = mouseY - offsetY;

        // Scale the coordinates to the canvas's intrinsic resolution
        const finalX = (relativeX / renderedWidth) * canvasWidth;
        const finalY = (relativeY / renderedHeight) * canvasHeight;

        return { x: finalX, y: finalY };
    };

    const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
        const ctx = getContext();
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const coords = getCoords(e);
        setIsDrawing(true);
        lastPos.current = coords;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const coords = getCoords(e);
        if (lastPos.current) {
            drawLine(lastPos.current.x, lastPos.current.y, coords.x, coords.y);
        }
        lastPos.current = coords;
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        lastPos.current = null;
        saveHistory();
    };

    const saveHistory = () => {
        const ctx = getContext();
        const canvas = getCanvas();
        if (!ctx || !canvas) return;
        const newHistory = history.slice(0, historyIndex + 1);
        const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        newHistory.push(currentImageData);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const restoreHistory = (index: number) => {
        const ctx = getContext();
        if (!ctx || !history[index]) return;
        ctx.putImageData(history[index], 0, 0);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            restoreHistory(newIndex);
        }
    };
    
    const clearCanvas = () => {
        const ctx = getContext();
        const canvas = getCanvas();
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            saveHistory();
        }
    };

    useImperativeHandle(ref, () => ({
        getMaskDataUrl: () => {
            const canvas = getCanvas();
            if (!canvas || historyIndex <= 0) return null; // Nothing to return if canvas is empty
            return canvas.toDataURL('image/png');
        },
        clear: clearCanvas,
        undo: handleUndo,
    }));
    
    return (
        <div 
            className="relative bg-gray-700 rounded-lg overflow-hidden" 
            style={{ width: dimensions.width, height: dimensions.height, maxWidth: '100%', maxHeight: 'calc(70vh - 100px)'}}
        >
            <img 
                src={imageSrc} 
                alt="Input for editing"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
});

export default InpaintingCanvas;