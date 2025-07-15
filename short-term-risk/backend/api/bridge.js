class BridgeTrackerService {
    async getWormholeStatus() {
        try {
            const res = await fetch(`${process.env.WORMHOLESCAN_VAAS_URL}`, {
                signal: AbortSignal.timeout(5000)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            // Check if there's recent VAA activity (indicates bridge is working)
            const hasRecentActivity = data.data && data.data.length > 0;
            const lastVaaTime = hasRecentActivity ? new Date(data.data[0].timestamp) : null;
            const isRecent = lastVaaTime && (Date.now() - lastVaaTime.getTime()) < 300000; // 5 minutes
            
            return {
                status: isRecent ? "operational" : "degraded",
                lastChecked: new Date().toISOString(),
                message: hasRecentActivity ? `Last VAA: ${lastVaaTime?.toISOString()}` : "No recent activity",
                details: {
                    hasRecentActivity,
                    lastVaaTime: lastVaaTime?.toISOString()
                }
            };
        } catch (error) {
            console.warn('Wormholescan API failed, using fallback:', error.message);
            return {
                status: "operational",
                lastChecked: new Date().toISOString(),
                message: "Fallback: Assuming operational (API unavailable)"
            };
        }
    }
}

export default new BridgeTrackerService();

// async function test() {
//     const bridgeTracker = new BridgeTrackerService();
//     const status = await bridgeTracker.getWormholeStatus();
//     console.log(status);
// }

// test();