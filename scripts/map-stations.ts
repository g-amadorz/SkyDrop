/**
 * Maps station names to valid station IDs
 * Run with: MONGODB_URI="your-uri" npx tsx scripts/map-stations.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined');
    process.exit(1);
}

// Valid station IDs from skytrainNetwork.ts (Millennium Line only)
const validStationIds = [
    'vcc-clark',
    'commercial-broadway',
    'renfrew',
    'rupert',
    'gilmore',
    'brentwood',
    'holdom',
    'sperling',
    'lake-city',
    'production-way',
    'lougheed',
    'burquitlam',
    'moody-centre',
    'inlet-centre',
    'coquitlam-central',
    'lincoln',
    'lafarge'
];

// Mapping from common names to valid IDs
const stationMapping: Record<string, string> = {
    'VCC-Clark': 'vcc-clark',
    'vcc-clark': 'vcc-clark',
    'Commercial-Broadway': 'commercial-broadway',
    'commercial-broadway': 'commercial-broadway',
    'Renfrew': 'renfrew',
    'renfrew': 'renfrew',
    'Rupert': 'rupert',
    'rupert': 'rupert',
    'Gilmore': 'gilmore',
    'gilmore': 'gilmore',
    'Brentwood Town Centre': 'brentwood',
    'Brentwood': 'brentwood',
    'brentwood': 'brentwood',
    'Holdom': 'holdom',
    'holdom': 'holdom',
    'Sperling-Burnaby Lake': 'sperling',
    'Sperling': 'sperling',
    'sperling': 'sperling',
    'Lake City Way': 'lake-city',
    'Lake City': 'lake-city',
    'lake-city': 'lake-city',
    'Production Way-University': 'production-way',
    'Production Way': 'production-way',
    'production-way': 'production-way',
    'Lougheed Town Centre': 'lougheed',
    'Lougheed': 'lougheed',
    'lougheed': 'lougheed',
    'Burquitlam': 'burquitlam',
    'burquitlam': 'burquitlam',
    'Moody Centre': 'moody-centre',
    'moody-centre': 'moody-centre',
    'Inlet Centre': 'inlet-centre',
    'inlet-centre': 'inlet-centre',
    'Coquitlam Central': 'coquitlam-central',
    'coquitlam-central': 'coquitlam-central',
    'Lincoln': 'lincoln',
    'lincoln': 'lincoln',
    'Lafarge Lake-Douglas': 'lafarge',
    'Lafarge': 'lafarge',
    'lafarge': 'lafarge',
    
    // Map non-millennium line stations to closest millennium line station
    'Burrard': 'commercial-broadway',
    'Main Street-Science World': 'commercial-broadway',
    'Nanaimo': 'commercial-broadway',
    '29th Avenue': 'commercial-broadway',
};

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

async function mapStations() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        const accessPoints = await AccessPoint.find({});
        console.log(`Found ${accessPoints.length} access points\n`);

        let updated = 0;
        let errors = 0;

        for (const ap of accessPoints) {
            const currentStationId = ap.stationId;
            
            // Check if current stationId is valid
            if (validStationIds.includes(currentStationId)) {
                console.log(`✓ ${ap.name} - already valid: ${currentStationId}`);
                continue;
            }

            // Try to map to valid station ID
            const mappedStationId = stationMapping[currentStationId];
            
            if (mappedStationId) {
                console.log(`⟳ ${ap.name}`);
                console.log(`  From: "${currentStationId}"`);
                console.log(`  To:   "${mappedStationId}"`);
                
                ap.stationId = mappedStationId;
                await ap.save();
                updated++;
                console.log(`  ✓ Updated!\n`);
            } else {
                console.log(`✗ ${ap.name} - cannot map: "${currentStationId}"`);
                console.log(`  Defaulting to: "commercial-broadway"\n`);
                ap.stationId = 'commercial-broadway';
                await ap.save();
                errors++;
            }
        }

        console.log(`\n✓ Mapping complete!`);
        console.log(`  Updated: ${updated}`);
        console.log(`  Defaulted: ${errors}`);
        console.log(`  Already valid: ${accessPoints.length - updated - errors}`);

        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

mapStations();
