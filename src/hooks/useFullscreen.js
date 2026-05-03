'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function useFullscreen({
    enabled = false,
    onExitAttempt = null,
    maxExits = null,
    onMaxExitsReached = null,
} = {}) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [exitCount, setExitCount] = useState(0);
    const exitCountRef = useRef(0);
    const onExitAttemptRef = useRef(onExitAttempt);
    const onMaxExitsReachedRef = useRef(onMaxExitsReached);

    useEffect(() => { onExitAttemptRef.current = onExitAttempt; }, [onExitAttempt]);
    useEffect(() => { onMaxExitsReachedRef.current = onMaxExitsReached; }, [onMaxExitsReached]);

    const requestFullscreen = useCallback(() => {
        if (typeof document === 'undefined') return;
        const el = document.documentElement;
        try {
            if (el.requestFullscreen) el.requestFullscreen();
            else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
            else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
            else if (el.msRequestFullscreen) el.msRequestFullscreen();
        } catch {
            // Browser denied fullscreen — ignore
        }
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined' || !enabled) return;

        const handleChange = () => {
            const fsElement =
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement;

            const nowFullscreen = !!fsElement;
            setIsFullscreen(nowFullscreen);

            if (!nowFullscreen) {
                exitCountRef.current += 1;
                setExitCount(exitCountRef.current);
                onExitAttemptRef.current?.();

                if (maxExits !== null && exitCountRef.current >= maxExits) {
                    onMaxExitsReachedRef.current?.();
                }
            }
        };

        document.addEventListener('fullscreenchange', handleChange);
        document.addEventListener('webkitfullscreenchange', handleChange);
        document.addEventListener('mozfullscreenchange', handleChange);
        document.addEventListener('MSFullscreenChange', handleChange);

        // Re-enter fullscreen after ESC key press (100ms delay lets browser complete its exit first)
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setTimeout(() => {
                    const fsEl =
                        document.fullscreenElement ||
                        document.webkitFullscreenElement ||
                        document.mozFullScreenElement ||
                        document.msFullscreenElement;
                    if (!fsEl) requestFullscreen();
                }, 100);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleChange);
            document.removeEventListener('webkitfullscreenchange', handleChange);
            document.removeEventListener('mozfullscreenchange', handleChange);
            document.removeEventListener('MSFullscreenChange', handleChange);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, maxExits, requestFullscreen]);

    // Reset exit count when enabled transitions from false → true (new session)
    useEffect(() => {
        if (enabled) {
            exitCountRef.current = 0;
            setExitCount(0);
        }
    }, [enabled]);

    return { isFullscreen, exitCount, requestFullscreen };
}
