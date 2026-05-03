'use client';

import { useEffect, useRef, useState } from 'react';

export default function useContentProtection({
    blockCopy = false,
    blockPrint = false,
    blockRightClick = false,
    blockDevtools = false,
    onDevtoolsOpen = null,
    enabled = true,
} = {}) {
    const [devtoolsOpen, setDevtoolsOpen] = useState(false);
    const onDevtoolsOpenRef = useRef(onDevtoolsOpen);

    useEffect(() => {
        onDevtoolsOpenRef.current = onDevtoolsOpen;
    }, [onDevtoolsOpen]);

    // Block copy and cut
    useEffect(() => {
        if (typeof document === 'undefined' || !enabled || !blockCopy) return;

        const prevent = (e) => e.preventDefault();

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && ['c', 'C', 'a', 'A', 'x', 'X'].includes(e.key)) {
                e.preventDefault();
            }
        };

        document.addEventListener('copy', prevent);
        document.addEventListener('cut', prevent);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('copy', prevent);
            document.removeEventListener('cut', prevent);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, blockCopy]);

    // Block print
    useEffect(() => {
        if (typeof window === 'undefined' || !enabled || !blockPrint) return;

        const prevent = (e) => e.preventDefault();

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && ['p', 'P'].includes(e.key)) {
                e.preventDefault();
            }
        };

        window.addEventListener('beforeprint', prevent);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('beforeprint', prevent);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, blockPrint]);

    // Block right-click context menu
    useEffect(() => {
        if (typeof document === 'undefined' || !enabled || !blockRightClick) return;

        const prevent = (e) => e.preventDefault();
        document.addEventListener('contextmenu', prevent);

        return () => document.removeEventListener('contextmenu', prevent);
    }, [enabled, blockRightClick]);

    // Detect docked DevTools via window size deviation
    useEffect(() => {
        if (typeof window === 'undefined' || !enabled || !blockDevtools) return;

        const id = setInterval(() => {
            const widthGap = window.outerWidth - window.innerWidth;
            const heightGap = window.outerHeight - window.innerHeight;
            const open = widthGap > 160 || heightGap > 160;

            setDevtoolsOpen((prev) => {
                if (open && !prev) {
                    onDevtoolsOpenRef.current?.();
                }
                return open;
            });
        }, 500);

        return () => clearInterval(id);
    }, [enabled, blockDevtools]);

    return { devtoolsOpen };
}
