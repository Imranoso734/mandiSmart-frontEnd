"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const ProgressContext = createContext({
    start: () => { },
    stop: () => { },
});

export function useProgress() {
    return useContext(ProgressContext);
}

export default function ProgressBarProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(false);
    }, [pathname]);

    const start = useCallback(() => setLoading(true), []);
    const stop = useCallback(() => setLoading(false), []);
    const value = useMemo(() => ({ start, stop }), [start, stop]);

    return (
        <ProgressContext.Provider value={value}>
            {loading && (
                <div className="fixed top-0 left-0 w-full z-9999">
                    <div className="h-0.75 w-full bg-primary animate-loading-bar" />
                </div>
            )}
            {children}
        </ProgressContext.Provider>
    );
}