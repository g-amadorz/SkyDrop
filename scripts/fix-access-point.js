#!/usr/bin/env node

/**
 * Script to update an access point's stationId
 * Usage: node scripts/fix-access-point.js <accessPointId> <stationId>
 */

const args = process.argv.slice(2);

if (args.length !== 2) {
    console.error('Usage: node scripts/fix-access-point.js <accessPointId> <stationId>');
    console.error('Example: node scripts/fix-access-point.js 68e26fe5bc38b15282687a97 VCC-Clark');
    process.exit(1);
}

const [accessPointId, stationId] = args;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function updateAccessPoint() {
    try {
        console.log(`Updating access point ${accessPointId} with stationId: ${stationId}...`);
        
        const response = await fetch(`${BASE_URL}/api/access-points/update-station`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accessPointId,
                stationId,
            }),
        });

        const data = await response.json();

        if (data.success) {
            console.log('✓ Access point updated successfully!');
            console.log('Updated access point:', data.data);
        } else {
            console.error('✗ Failed to update access point:', data.error);
            process.exit(1);
        }
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

updateAccessPoint();
