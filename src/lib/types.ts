// Co-Reader Type Definitions

// ============================================
// Document Types
// ============================================

export type SourceType = 'pdf' | 'url';

export interface Document {
  id: string;
  title: string;
  sourceType: SourceType;
  sourcePath: string; // file path or URL
  createdAt: Date;
}

// ============================================
// Highlight Types
// ============================================

export type HighlightType = 'insight' | 'definition' | 'question';

export interface AnchorBase {
  startOffset: number;
  endOffset: number;
  context: string; // ±30 chars for fuzzy matching
}

export interface PdfAnchor extends AnchorBase {
  type: 'pdf';
  pageNumber: number;
}

export interface HtmlAnchor extends AnchorBase {
  type: 'html';
  xpath: string;
}

export type Anchor = PdfAnchor | HtmlAnchor;

export interface Highlight {
  id: string;
  documentId: string;
  type: HighlightType;
  text: string;
  anchor: Anchor;
  createdAt: Date;
}

// ============================================
// Note Types
// ============================================

export interface Note {
  id: string;
  highlightId: string;
  content: string;
  createdAt: Date;
}

// ============================================
// Vocabulary Types
// ============================================

export interface VocabularyEntry {
  id: string;
  word: string;
  contextSentence: string;
  documentId: string;
  userNote?: string;
  definition?: string;
  createdAt: Date;
}

// ============================================
// AI Types
// ============================================

export type AIOutputType = 'clarify' | 'assumptions' | 'questions' | 'synthesis';

export interface AIOutput {
  id: string;
  highlightId: string;
  type: AIOutputType;
  content: string;
  createdAt: Date;
}

// ============================================
// UI State Types
// ============================================

export interface SelectionState {
  text: string;
  range: Range | null;
  position: {
    top: number;
    left: number;
  };
}

export interface ReaderSettings {
  fontSize: number; // 14-24
  lineHeight: number; // 1.4-2.0
  theme: 'light' | 'dark';
}

export interface BoundingRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// ============================================
// PDF Types
// ============================================

export interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
}

export interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}
