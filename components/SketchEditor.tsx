import React from 'react';
import { GalleryItem, ImageSource } from '../types';
import { ImageEditor } from './common/ImageEditor';

interface SketchEditorProps {
    onGenerateTweak: (baseImage: ImageSource, prompt: string, maskImage?: ImageSource, imageCount?: number) => void;
    onBack: () => void;
    inputImage: GalleryItem | null;
}

export const SketchEditor: React.FC<SketchEditorProps> = ({ onGenerateTweak, onBack, inputImage }) => {
    
    if (!inputImage) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-400">No image selected for editing.</p>
                 <button onClick={onBack} className="mt-4 px-6 py-2 bg-jelly-bean-500 text-white font-bold rounded-lg hover:bg-jelly-bean-600">
                    Go Back
                </button>
            </div>
        )
    }

    return (
       <ImageEditor
            title="Sketch Editor"
            description="Use the brush to mask an area, then describe the changes you'd like to make."
            placeholder="e.g., make the sleeves shorter, or add a collar"
            submitButtonText="Generate Tweaks"
            onGenerate={onGenerateTweak}
            onBack={onBack}
            inputImage={inputImage}
       />
    );
};
