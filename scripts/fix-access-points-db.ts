/**
 * Server-side script to check and fix access points directly in MongoDB
 * Run with: MONGODB_URI="your-uri" npx tsx scripts/fix-access-points-db.ts
 * Or set MONGODB_URI in your shell first
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined');
    console.error('Set it with: MONGODB_URI="your-connection-string" npx tsx scripts/fix-access-points-db.ts');
    process.exit(1);
}

// Define AccessPoint schema (matching your actual schema)
const accessPointSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    nearestStation: { type: String },
    stationId: { type: String }, // This is what we're fixing
    lat: { type: Number },
    lng: { type: Number },
});

const AccessPoint = mongoose.models.AccessPoint || mongoose.model('AccessPoint', accessPointSchema);

async function checkAndFixAccessPoints() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Fetch all access points
        const accessPoints = await AccessPoint.find({});
        console.log(`Found ${accessPoints.length} access points\n`);

        const missingStationId = [];

        // Check each access point
        for (const ap of accessPoints) {
            const hasStationId = !!ap.stationId;
            const status = hasStationId ? '✓' : '✗';
            
            console.log(`${status} ${ap.name}`);
            console.log(`   ID: ${ap._id}`);
            console.log(`   Station ID: ${ap.stationId || 'MISSING'}`);
            console.log(`   Nearest Station: ${ap.nearestStation || 'N/A'}`);
            console.log('');

            if (!hasStationId) {
                missingStationId.push(ap);
            }
        }

        // Auto-fix: set stationId = nearestStation for missing ones
        if (missingStationId.length > 0) {
            console.log(`\n⚠️  Found ${missingStationId.length} access points missing stationId\n`);
            
            for (const ap of missingStationId) {
                if (ap.nearestStation) {
                    console.log(`Fixing ${ap.name}...`);
                    console.log(`  Setting stationId = "${ap.nearestStation}"`);
                    
                    ap.stationId = ap.nearestStation;
                    await ap.save();
                    
                    console.log(`  ✓ Updated!\n`);
                } else {
                    console.log(`⚠️  Cannot auto-fix ${ap.name} - no nearestStation value`);
                    console.log(`   ID: ${ap._id}`);
                    console.log(`   Please update manually:\n`);
                    console.log(`   await AccessPoint.findByIdAndUpdate('${ap._id}', { stationId: 'STATION_NAME' });\n`);
                }
            }
        } else {
            console.log('✓ All access points have stationId values!');
        }

        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

checkAndFixAccessPoints();
