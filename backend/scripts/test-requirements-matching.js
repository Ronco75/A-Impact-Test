const LicensingDocumentProcessor = require('./process-licensing-document');
const fs = require('fs');
const path = require('path');

/**
 * Test script for requirements matching functionality
 */

class RequirementsMatchingTester {
    constructor() {
        this.processor = new LicensingDocumentProcessor();
        this.dataPath = path.join(__dirname, '../data/licensing-requirements.json');
    }

    async runTests() {
        console.log('Loading structured licensing data...');
        
        // Load the processed data
        const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
        this.processor.structuredData = data;

        console.log('Running requirement matching tests...\n');

        // Test case 1: Small restaurant with basic services
        await this.testBusinessProfile({
            name: "Small Restaurant - Basic",
            profile: {
                businessType: "restaurant",
                seatingCapacity: 15,
                floorArea: 60,
                services: {
                    alcoholService: false,
                    deliveryService: true,
                    takeaway: true,
                    liveMusic: false,
                    outdoorSeating: false
                },
                kitchenFeatures: {
                    gasUsage: true,
                    smokingArea: false,
                    meatHandling: true,
                    dairyProducts: true
                },
                operationalHours: {
                    lateNightOperation: false,
                    twentyFourSeven: false
                }
            }
        });

        // Test case 2: Large restaurant with alcohol service
        await this.testBusinessProfile({
            name: "Large Restaurant with Alcohol",
            profile: {
                businessType: "restaurant", 
                seatingCapacity: 45,
                floorArea: 150,
                services: {
                    alcoholService: true,
                    deliveryService: false,
                    takeaway: true,
                    liveMusic: true,
                    outdoorSeating: true
                },
                kitchenFeatures: {
                    gasUsage: true,
                    smokingArea: false,
                    meatHandling: true,
                    dairyProducts: true
                },
                operationalHours: {
                    lateNightOperation: true,
                    twentyFourSeven: false
                }
            }
        });

        // Test case 3: Small cafe
        await this.testBusinessProfile({
            name: "Small Cafe",
            profile: {
                businessType: "cafe",
                seatingCapacity: 12,
                floorArea: 40,
                services: {
                    alcoholService: false,
                    deliveryService: false,
                    takeaway: true,
                    liveMusic: false,
                    outdoorSeating: true
                },
                kitchenFeatures: {
                    gasUsage: false,
                    smokingArea: false,
                    meatHandling: false,
                    dairyProducts: true
                },
                operationalHours: {
                    lateNightOperation: false,
                    twentyFourSeven: false
                }
            }
        });

        // Test case 4: Fast food with meat handling
        await this.testBusinessProfile({
            name: "Fast Food with Meat",
            profile: {
                businessType: "fast_food",
                seatingCapacity: 25,
                floorArea: 80,
                services: {
                    alcoholService: false,
                    deliveryService: true,
                    takeaway: true,
                    liveMusic: false,
                    outdoorSeating: false
                },
                kitchenFeatures: {
                    gasUsage: true,
                    smokingArea: false,
                    meatHandling: true,
                    dairyProducts: false
                },
                operationalHours: {
                    lateNightOperation: false,
                    twentyFourSeven: false
                }
            }
        });

        console.log('All tests completed!');
    }

    async testBusinessProfile(testCase) {
        console.log(`=== Testing: ${testCase.name} ===`);
        console.log('Business Profile:');
        console.log(`- Type: ${testCase.profile.businessType}`);
        console.log(`- Seating: ${testCase.profile.seatingCapacity} seats`);
        console.log(`- Floor Area: ${testCase.profile.floorArea} m²`);
        
        const services = Object.entries(testCase.profile.services)
            .filter(([key, value]) => value)
            .map(([key, value]) => key);
        console.log(`- Services: ${services.join(', ') || 'None'}`);

        const kitchenFeatures = Object.entries(testCase.profile.kitchenFeatures)
            .filter(([key, value]) => value)
            .map(([key, value]) => key);
        console.log(`- Kitchen Features: ${kitchenFeatures.join(', ') || 'None'}`);

        console.log('\nApplicable Requirements:');
        const requirements = this.processor.getApplicableRequirements(testCase.profile);
        
        if (requirements.length === 0) {
            console.log('- No specific requirements found');
        } else {
            requirements.forEach((req, index) => {
                console.log(`${index + 1}. [${req.requirementId}] ${req.title}`);
                console.log(`   Authority: ${req.authority}`);
                console.log(`   Mandatory: ${req.mandatory ? 'Yes' : 'No'}`);
                console.log(`   Description: ${req.description}`);
                console.log('');
            });
        }

        console.log(`Total Requirements: ${requirements.length}`);
        console.log('==========================================\n');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new RequirementsMatchingTester();
    tester.runTests()
        .then(() => {
            console.log('Testing completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Testing failed:', error);
            process.exit(1);
        });
}

module.exports = RequirementsMatchingTester;