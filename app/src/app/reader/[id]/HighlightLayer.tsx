'use client';

import { useMemo } from 'react';
import { Highlight, BoundingRect } from '@/lib/types';

interface HighlightLayerProps {
    highlights: Highlight[];
    containerRef: React.RefObject<HTMLDivElement>;
    onHighlightClick: (highlight: Highlight) => void;
}

export default function HighlightLayer({
    highlights,
    containerRef,
    onHighlightClick,
}: HighlightLayerProps) {
    // For now, we'll render placeholder highlights
    // Full anchor resolution will be implemented with PDF integration

    return (
        <div className="highlight-layer">
            {highlights.map((highlight) => (
                <HighlightShape
                    key={highlight.id}
                    highlight={highlight}
                    onClick={() => onHighlightClick(highlight)}
                />
            ))}
        </div>
    );
}

interface HighlightShapeProps {
    highlight: Highlight;
    onClick: () => void;
}

function HighlightShape({ highlight, onClick }: HighlightShapeProps) {
    // For MVP, we'll just show a visual indicator
    // Full bounding rect calculation will be added with PDF anchor resolution

    const style = useMemo(() => {
        // Placeholder positioning - will be replaced with actual anchor resolution
        return {
            display: 'none', // Hidden until we have proper anchor data
        };
    }, []);

    return (
        <div
            className={`highlight-shape ${highlight.type}`}
            style={style}
            onClick={onClick}
            role="button"
            tabIndex={0}
            aria-label={`${highlight.type} highlight: ${highlight.text.slice(0, 50)}...`}
        />
    );
}
