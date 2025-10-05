#!/usr/bin/env node

/**
 * Script to check all access points and their stationId values
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function checkAccessPoints() {
    try {
        console.log('Fetching all access points...\n');
        
        const response = await fetch(`${BASE_URL}/api/access-points`);
        const data = await response.json();

        if (data.success && data.data && data.data.accessPoints) {
            const accessPoints = data.data.accessPoints;
            
            console.log(`Found ${accessPoints.length} access points:\n`);
            
            const missingStationId = [];
            
            accessPoints.forEach((ap, index) => {
                const status = ap.stationId ? '✓' : '✗';
                console.log(`${status} [${index + 1}] ${ap.name}`);
                console.log(`   ID: ${ap._id}`);
                console.log(`   Station ID: ${ap.stationId || 'MISSING'}`);
                console.log(`   Nearest Station: ${ap.nearestStation || 'N/A'}`);
                console.log('');
                
                if (!ap.stationId) {
                    missingStationId.push({
                        _id: ap._id,
                        name: ap.name,
                        nearestStation: ap.nearestStation,
                    });
                }
            });
            
            if (missingStationId.length > 0) {
                console.log('\n⚠️  Access points missing stationId:');
                missingStationId.forEach(ap => {
                    console.log(`\n  Name: ${ap.name}`);
                    console.log(`  ID: ${ap._id}`);
                    console.log(`  Suggested: ${ap.nearestStation || 'Unknown'}`);
                    console.log(`\n  Fix with:`);
                    console.log(`  node scripts/fix-access-point.js ${ap._id} ${ap.nearestStation || 'STATION_NAME'}`);
                });
            } else {
                console.log('✓ All access points have stationId values!');
            }
        } else {
            console.error('Failed to fetch access points');
            if (!data.success) {
                console.error('Error:', data.error);
            }
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAccessPoints();
