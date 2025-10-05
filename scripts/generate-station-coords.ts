/**
 * Generate stationCoords with access points
 * Run with: MONGODB_URI="your-uri" npx tsx scripts/generate-station-coords.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
}

const accessPointSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    nearestStation: { type: String },
    stationId: { type: String },
    lat: { type: Number },
    lng: { type: Number },
});

const AccessPoint = mongoose.models.AccessPoint || mongoose.model('AccessPoint', accessPointSchema);

async function generateStationCoords() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const accessPoints = await AccessPoint.find({});
        
        console.log('// Add these to stationCoords in CalcHops.jsx:\n');
        
        accessPoints.forEach(ap => {
            if (ap.lat && ap.lng) {
                console.log(`\t"${ap.name}": [${ap.lat}, ${ap.lng}],`);
            }
        });

        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

generateStationCoords();
