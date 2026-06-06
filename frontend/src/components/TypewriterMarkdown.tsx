import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterMarkdownProps {
    content: string;
    speed?: number; // ms per word
}

export const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({ content, speed = 50 }) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Split content by whitespace, keeping the whitespace as separate tokens
    const tokens = useMemo(() => content.split(/(\s+)/), [content]);

    useEffect(() => {
        // Reset if content changes completely
        if (!content.startsWith(displayedContent) && displayedContent !== '') {
            setDisplayedContent('');
            setCurrentIndex(0);
            return;
        }

        if (currentIndex < tokens.length) {
            const timer = setTimeout(() => {
                setDisplayedContent(prev => prev + tokens[currentIndex]);
                setCurrentIndex(prev => prev + 1);
            }, speed);
            return () => clearTimeout(timer);
        }
    }, [tokens, currentIndex, speed, displayedContent, content]);

    return <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>;
};
