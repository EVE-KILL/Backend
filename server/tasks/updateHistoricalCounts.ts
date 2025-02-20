export default defineTask({
    meta: {
        name: "update:historicalcounts",
        description: "Updates the historical counts of members in alliances and corporations",
    },
    async run({ payload, context }) {
        if (process.env.NODE_ENV === 'development') {
        return {};
        }

        let currentDate = new Date();

        // Alliances
        let allianceCountAggregation = [
            {
                $group: {
                    _id: { alliance_id: "$alliance_id" },
                    count: { $sum: 1 },
                },
            },
        ];

        let allianceCounts = await Characters.aggregate(allianceCountAggregation);

        let allianceIDs = allianceCounts.map(a => a._id.alliance_id);
        let existingAllianceStats = await HistoricalStats.find({
            alliance_id: { $in: allianceIDs },
            corporation_id: 0
        });
        let existingAllianceMap = new Map();
        existingAllianceStats.forEach(s => existingAllianceMap.set(s.alliance_id, s));

        let allianceOps = allianceCounts.map(alliance => {
            let previousStats = existingAllianceMap.get(alliance._id.alliance_id);
            let historicalCounts = [];
            if (previousStats) {
                historicalCounts = previousStats.historicalCounts || [];
                historicalCounts.unshift({ count: previousStats.count, date: previousStats.date });
                if (historicalCounts.length > 30) {
                    historicalCounts = historicalCounts.slice(0, 30);
                }
            }
            return {
                updateOne: {
                    filter: {
                        alliance_id: alliance._id.alliance_id,
                        corporation_id: 0
                    },
                    update: {
                        $set: {
                            count: alliance.count,
                            previousCount: previousStats?.count,
                            date: currentDate,
                            historicalCounts
                        }
                    },
                    upsert: true
                }
            };
        });
        await HistoricalStats.bulkWrite(allianceOps);

        // Corporations
        let corporationCountAggregation = [
            {
                $group: {
                    _id: { corporation_id: "$corporation_id" },
                    count: { $sum: 1 },
                },
            },
        ];

        let corporationCounts = await Characters.aggregate(corporationCountAggregation);

        let corporationIDs = corporationCounts.map(c => c._id.corporation_id);
        let existingCorpStats = await HistoricalStats.find({
            alliance_id: 0,
            corporation_id: { $in: corporationIDs }
        });
        let existingCorpMap = new Map();
        existingCorpStats.forEach(s => existingCorpMap.set(s.corporation_id, s));

        let corporationOps = corporationCounts.map(corporation => {
            let previousStats = existingCorpMap.get(corporation._id.corporation_id);
            let historicalCounts = [];
            if (previousStats) {
                historicalCounts = previousStats.historicalCounts || [];
                historicalCounts.unshift({ count: previousStats.count, date: previousStats.date });
                if (historicalCounts.length > 30) {
                    historicalCounts = historicalCounts.slice(0, 30);
                }
            }
            return {
                updateOne: {
                    filter: {
                        alliance_id: 0,
                        corporation_id: corporation._id.corporation_id
                    },
                    update: {
                        $set: {
                            count: corporation.count,
                            previousCount: previousStats?.count,
                            date: currentDate,
                            historicalCounts
                        }
                    },
                    upsert: true
                }
            };
        });
        await HistoricalStats.bulkWrite(corporationOps);

        return { result: "success" };
    }
});
