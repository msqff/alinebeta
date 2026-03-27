
export type Tool = 'sketch' | 'visualiser' | 'multiview' | 'model' | 'sketchEditor' | 'video' | 'moodboard' | 'studioImageEditor' | 'techpack' | 'review' | 'shopperPulse';

export type GalleryTag = 'Sketch' | 'Studio Image' | 'Model Shot' | 'Mood Board' | 'Video' | 'Tech Pack' | 'Product Review' | 'Multi-View';

export interface ImageSource {
  data: string; // base64 encoded string
  mimeType: string;
}

export interface Collection {
    id: string;
    name: string;
    masterMoodBoard: ImageSource;
    extractedPalette: string[]; // Array of Hex codes
    styleDna: string; // Summary of the aesthetic
    created: number;
}

export interface ItemSlot {
    id: string;
    collectionId: string;
    name: string;
    // The slot tracks the latest 'primary' asset for each stage to show in the manager
    sketchId?: string;
    studioImageId?: string;
    techPackId?: string;
}

export interface AuditSection {
    risk_level: 'Low' | 'Medium' | 'High';
    flags: string[];
}

export interface ProductReviewResult {
    compliance_score: number;
    status: 'PASS' | 'FLAGGED';
    legal_audit: AuditSection;
    safety_audit: AuditSection;
    fabrication_audit: AuditSection;
}

export interface ShopperPulseResult {
    purchase_probability: number;
    headline: string;
    customer_voice: string;
}

export type ShopperPersona = 'The Value Seeker' | 'The Quality Conscious' | 'The Trend Hunter';

export interface GalleryItem {
  id: string;
  src: string; // data URI for <img> tag
  source: ImageSource;
  tag: 'Sketch' | 'Studio Image' | 'Model Shot';
  prompt: string;
  parentId?: string;
  // New Collection Links
  collectionId?: string;
  itemSlotId?: string;
}

export interface VideoItem {
  id: string;
  videoSource: { // Store the actual video data
    data: string; // base64 encoded string
    mimeType: string;
  };
  thumbnailSrc: string; // data URI of the source model shot for the thumbnail
  tag: 'Video';
  prompt: string;
  parentId: string;
  collectionId?: string;
  itemSlotId?: string;
}

export interface MoodBoardAsset {
  id: string;
  sources: ImageSource[];
  summary: string;
  tag: 'Mood Board';
  collectionId?: string;
  itemSlotId?: string;
}

export interface MultiViewAsset {
    id: string;
    tag: 'Multi-View';
    views: { view: string; source: ImageSource }[];
    parentId?: string;
    collectionId?: string;
    itemSlotId?: string;
}

export interface TechPackItem {
    id: string;
    label: string;
    value: string;
    options: string[]; // AI suggested alternatives
}

export interface TechPackSection {
    id: string;
    title: string;
    items: TechPackItem[];
}

export interface SizingRow {
    id: string;
    pointOfMeasure: string;
    xs: string;
    s: string;
    m: string;
    l: string;
    xl: string;
    xxl: string;
}

export interface CostingRow {
    id: string;
    materialName: string;
    consumption: number;
    unit: string;
    costPerUnit: number;
}

export interface BOMRow {
    id: string;
    placement: string;
    component: string;
    description: string;
    color: string;
    supplier: string;
    consumption: string;
}

export interface PlacementPin {
    id: string;
    pinNumber: number;
    x: number;
    y: number;
    title: string;
    note: string;
}

export interface TechPackAsset {
    id: string;
    src: string; // data URI for <img> tag
    source: ImageSource; // The source studio image
    additionalSources?: ImageSource[]; // Back/Side views used for analysis
    tag: 'Tech Pack';
    data: TechPackSection[]; // Structured data
    bomData?: BOMRow[]; // Bill of Materials data
    sizingData?: SizingRow[]; // Sizing matrix data
    costingData?: CostingRow[]; // Costing engine data
    placementData?: PlacementPin[]; // Placement guide data
    parentId: string;
    collectionId?: string;
    itemSlotId?: string;
}

export interface ProductReviewAsset {
    id: string;
    src: string;
    source: ImageSource;
    additionalSources?: ImageSource[]; // Back/Side views used for audit
    tag: 'Product Review';
    data: ProductReviewResult;
    parentId: string;
    collectionId?: string;
    itemSlotId?: string;
}


export type GalleryAsset = GalleryItem | VideoItem | MoodBoardAsset | TechPackAsset | ProductReviewAsset | MultiViewAsset;


export interface GeneratedPattern {
    id: string;
    src: string; // data URI
    source: ImageSource;
    prompt: string;
    collectionId?: string;
}