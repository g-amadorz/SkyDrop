/**
 * SkyTrain Network Graph - Millennium Line Only
 * Represents the Millennium Line as a graph structure
 * Each station is a node with connections to adjacent stations
 */

export interface SkyTrainStation {
    id: string;
    name: string;
    line: 'millennium';
    zone: 1 | 2 | 3;
    connections: string[]; // IDs of connected stations
    distanceToNext?: number; // Distance in km to next station (for pricing)
}

// Millennium Line Stations (VCC-Clark to Lafarge Lake-Douglas)
const millenniumLine: SkyTrainStation[] = [
    { id: 'vcc-clark', name: 'VCC-Clark', line: 'millennium', zone: 1, connections: ['commercial-broadway'], distanceToNext: 1.5 },
    { id: 'commercial-broadway', name: 'Commercial-Broadway', line: 'millennium', zone: 1, connections: ['vcc-clark', 'renfrew'], distanceToNext: 1.4 },
    { id: 'renfrew', name: 'Renfrew', line: 'millennium', zone: 2, connections: ['commercial-broadway', 'rupert'], distanceToNext: 1.6 },
    { id: 'rupert', name: 'Rupert', line: 'millennium', zone: 2, connections: ['renfrew', 'gilmore'], distanceToNext: 1.3 },
    { id: 'gilmore', name: 'Gilmore', line: 'millennium', zone: 2, connections: ['rupert', 'brentwood'], distanceToNext: 1.5 },
    { id: 'brentwood', name: 'Brentwood Town Centre', line: 'millennium', zone: 2, connections: ['gilmore', 'holdom'], distanceToNext: 1.2 },
    { id: 'holdom', name: 'Holdom', line: 'millennium', zone: 2, connections: ['brentwood', 'sperling'], distanceToNext: 1.8 },
    { id: 'sperling', name: 'Sperling-Burnaby Lake', line: 'millennium', zone: 2, connections: ['holdom', 'lake-city'], distanceToNext: 1.4 },
    { id: 'lake-city', name: 'Lake City Way', line: 'millennium', zone: 2, connections: ['sperling', 'production-way'], distanceToNext: 1.6 },
    { id: 'production-way', name: 'Production Way-University', line: 'millennium', zone: 2, connections: ['lake-city', 'lougheed'], distanceToNext: 2.5 },
    { id: 'lougheed', name: 'Lougheed Town Centre', line: 'millennium', zone: 2, connections: ['production-way', 'burquitlam'], distanceToNext: 2.0 },
    { id: 'burquitlam', name: 'Burquitlam', line: 'millennium', zone: 3, connections: ['lougheed', 'moody-centre'], distanceToNext: 1.8 },
    { id: 'moody-centre', name: 'Moody Centre', line: 'millennium', zone: 3, connections: ['burquitlam', 'inlet-centre'], distanceToNext: 1.5 },
    { id: 'inlet-centre', name: 'Inlet Centre', line: 'millennium', zone: 3, connections: ['moody-centre', 'coquitlam-central'], distanceToNext: 1.2 },
    { id: 'coquitlam-central', name: 'Coquitlam Central', line: 'millennium', zone: 3, connections: ['inlet-centre', 'lincoln'], distanceToNext: 1.0 },
    { id: 'lincoln', name: 'Lincoln', line: 'millennium', zone: 3, connections: ['coquitlam-central', 'lafarge'], distanceToNext: 1.0 },
    { id: 'lafarge', name: 'Lafarge Lake-Douglas', line: 'millennium', zone: 3, connections: ['lincoln'], distanceToNext: 0 },
];

// Combine all stations into a single network map
export const skyTrainNetwork: Map<string, SkyTrainStation> = new Map();

[...millenniumLine].forEach(station => {
    skyTrainNetwork.set(station.id, station);
});

/**
 * Calculate distance between two stations using BFS (Breadth-First Search)
 * Returns the shortest path distance in kilometers
 */
export function calculateStationDistance(fromStationId: string, toStationId: string): number {
    if (fromStationId === toStationId) return 0;

    const fromStation = skyTrainNetwork.get(fromStationId);
    const toStation = skyTrainNetwork.get(toStationId);

    if (!fromStation || !toStation) {
        throw new Error('Invalid station ID');
    }

    // BFS to find shortest path
    const queue: Array<{ stationId: string; distance: number }> = [{ stationId: fromStationId, distance: 0 }];
    const visited = new Set<string>([fromStationId]);
    const distances = new Map<string, number>([[fromStationId, 0]]);

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentStation = skyTrainNetwork.get(current.stationId)!;

        if (current.stationId === toStationId) {
            return current.distance;
        }

        for (const nextStationId of currentStation.connections) {
            if (!visited.has(nextStationId)) {
                visited.add(nextStationId);
                const nextStation = skyTrainNetwork.get(nextStationId)!;
                const distanceToNext = currentStation.distanceToNext || 0;
                const newDistance = current.distance + distanceToNext;
                
                distances.set(nextStationId, newDistance);
                queue.push({ stationId: nextStationId, distance: newDistance });
            }
        }
    }

    throw new Error('No path found between stations');
}

/**
 * Get all stations on a specific line
 */
export function getStationsByLine(line: 'expo' | 'millennium' | 'canada'): SkyTrainStation[] {
    return Array.from(skyTrainNetwork.values()).filter(station => station.line === line);
}

/**
 * Check if two stations are on the same line
 */
export function areStationsOnSameLine(stationId1: string, stationId2: string): boolean {
    const station1 = skyTrainNetwork.get(stationId1);
    const station2 = skyTrainNetwork.get(stationId2);
    
    if (!station1 || !station2) return false;
    
    return station1.line === station2.line;
}

/**
 * Get the shortest path between two stations (returns array of station IDs)
 */
export function getShortestPath(fromStationId: string, toStationId: string): string[] {
    if (fromStationId === toStationId) return [fromStationId];

    const queue: Array<{ stationId: string; path: string[] }> = [{ stationId: fromStationId, path: [fromStationId] }];
    const visited = new Set<string>([fromStationId]);

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentStation = skyTrainNetwork.get(current.stationId)!;

        if (current.stationId === toStationId) {
            return current.path;
        }

        for (const nextStationId of currentStation.connections) {
            if (!visited.has(nextStationId)) {
                visited.add(nextStationId);
                queue.push({
                    stationId: nextStationId,
                    path: [...current.path, nextStationId],
                });
            }
        }
    }

    throw new Error('No path found between stations');
}
