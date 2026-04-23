import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Options = {
    tables: string | string[];
    onChange: () => void;
    enabled?: boolean;
    debounceMs?: number;
};

// Subscribes to Supabase Realtime postgres_changes on the given tables and
// also refetches when the tab regains focus. Refetches are debounced so a
// burst of row changes only triggers one reload.
export function useRealtimeSync({ tables, onChange, enabled = true, debounceMs = 400 }: Options) {
    const callbackRef = useRef(onChange);
    callbackRef.current = onChange;

    useEffect(() => {
        if (!enabled) return;

        const tableList = Array.isArray(tables) ? tables : [tables];
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const triggerRefetch = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                callbackRef.current();
            }, debounceMs);
        };

        const channel = supabase.channel(`realtime-${tableList.join('-')}-${Date.now()}`);

        tableList.forEach((table) => {
            channel.on(
                'postgres_changes' as never,
                { event: '*', schema: 'public', table },
                () => triggerRefetch()
            );
        });

        channel.subscribe();

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') triggerRefetch();
        };
        const handleFocus = () => triggerRefetch();

        document.addEventListener('visibilitychange', handleVisibility);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('online', handleFocus);

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            supabase.removeChannel(channel);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('online', handleFocus);
        };
    }, [Array.isArray(tables) ? tables.join('|') : tables, enabled, debounceMs]);
}
