import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterMarkdownProps {
    content: string;
    speed?: number; // base ms per word/token
    onUpdate?: () => void;
}

export const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({ content, speed = 50, onUpdate }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Split content by whitespace, keeping the whitespace as separate tokens
    const tokens = useMemo(() => content.split(/(\s+)/), [content]);

    // Dynamically adjust step size and speed based on the length of the content
    const { dynamicSpeed, stepSize } = useMemo(() => {
        const total = tokens.length;
        if (total > 300) {
            return { dynamicSpeed: Math.max(4, speed / 5), stepSize: 6 };
        } else if (total > 150) {
            return { dynamicSpeed: Math.max(8, speed / 3), stepSize: 4 };
        } else if (total > 60) {
            return { dynamicSpeed: Math.max(12, speed / 2), stepSize: 2 };
        }
        return { dynamicSpeed: speed, stepSize: 1 };
    }, [tokens.length, speed]);

    useEffect(() => {
        // Reset if content changes completely
        if (!content.startsWith(displayedContent) && displayedContent !== '') {
            setDisplayedContent('');
            setCurrentIndex(0);
            return;
        }

        if (currentIndex < tokens.length) {
            const timer = setTimeout(() => {
                const nextChunk = tokens.slice(currentIndex, currentIndex + stepSize).join('');
                setDisplayedContent(prev => prev + nextChunk);
                setCurrentIndex(prev => prev + stepSize);
            }, dynamicSpeed);
            return () => clearTimeout(timer);
        }
    }, [tokens, currentIndex, dynamicSpeed, stepSize, displayedContent, content]);

    // Scroll callback helper
    useEffect(() => {
        if (onUpdate && displayedContent !== '') {
            onUpdate();
        }
    }, [displayedContent, onUpdate]);

    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>;
};
