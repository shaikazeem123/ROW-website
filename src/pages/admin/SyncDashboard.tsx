import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { SyncService } from '@/lib/syncService';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function SyncDashboardPage() {
    const isOnline = useOnlineStatus();
    const [pendingCount, setPendingCount] = useState(0);
    const [syncedCount, setSyncedCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('last_sync_time'));

    const loadCounts = useCallback(async () => {
        const pending = await db.beneficiaries.where('sync_status').equals('pending').count();
        const synced = await db.beneficiaries.where('sync_status').equals('synced').count();
        const failed = await db.beneficiaries.where('sync_status').equals('failed').count();

        setPendingCount(pending);
        setSyncedCount(synced);
        setFailedCount(failed);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(loadCounts, 0);
        const interval = setInterval(loadCounts, 5000);
        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [loadCounts]);

    const handleManualSync = async () => {
        if (!isOnline) {
            alert('Cannot sync while offline.');
            return;
        }
        setIsSyncing(true);
        await SyncService.syncPendingRecords();
        const now = new Date().toLocaleTimeString();
        setLastSync(now);
        localStorage.setItem('last_sync_time', now);
        await loadCounts();
        setIsSyncing(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Sync Control Center</h1>
                    <p className="text-text-muted">Monitor and manage offline data synchronization.</p>
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border shadow-sm self-start md:self-auto whitespace-nowrap ${isOnline ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    {isOnline ? <><Wifi size={20} /> <span className="font-bold">SYSTEM ONLINE</span></> : <><WifiOff size={20} /> <span className="font-bold">SYSTEM OFFLINE</span></>}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                <Card className="p-4 lg:p-6 border-l-4 border-l-orange-500 min-w-0">
                    <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                            <CloudOff size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-text-muted truncate">Pending Sync</p>
                            <h3 className="text-3xl font-black text-text-main">{pendingCount}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 lg:p-6 border-l-4 border-l-green-500 min-w-0">
                    <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl shrink-0">
                            <Cloud size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-text-muted truncate">Recently Synced</p>
                            <h3 className="text-3xl font-black text-text-main">{syncedCount}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 lg:p-6 border-l-4 border-l-red-500 min-w-0">
                    <div className="flex items-center gap-3 lg:gap-4 min-w-0">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
                            <AlertTriangle size={24} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-text-muted truncate">Sync Errors</p>
                            <h3 className="text-3xl font-black text-text-main">{failedCount}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-8 text-center bg-gray-50/50 border-dashed border-2 border-gray-200">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="flex justify-center mb-2">
                        {isSyncing ? (
                            <RefreshCw className="text-primary animate-spin" size={48} />
                        ) : pendingCount > 0 ? (
                            <RefreshCw className="text-orange-500" size={48} />
                        ) : (
                            <CheckCircle2 className="text-green-500" size={48} />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-text-main">
                        {isSyncing ? 'Synchronizing Data...' : pendingCount > 0 ? 'Pending Records Ready' : 'Global Data is Up-to-Date'}
                    </h2>
                    <p className="text-text-muted text-sm">
                        {pendingCount > 0
                            ? `You have ${pendingCount} registration(s) waiting to be uploaded to the central ROW database.`
                            : 'All field registrations have been successfully synchronized with the server.'}
                    </p>
                    <div className="pt-4">
                        <Button
                            onClick={handleManualSync}
                            disabled={isSyncing || !isOnline || pendingCount === 0}
                            className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        {lastSync && (
                            <p className="mt-3 text-[10px] text-text-muted uppercase tracking-widest font-bold">
                                Last Sync Attempt: {lastSync}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {failedCount > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 mt-0.5" size={20} />
                    <div>
                        <h4 className="text-sm font-bold text-red-800 uppercase tracking-tight">Sync Conflict Detected</h4>
                        <p className="text-xs text-red-600 mt-1">
                            Some records could not be synchronized due to format errors or connection timeouts.
                            The system will automatically retry them on the next sync cycle.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
