/**
 * API Usage Examples
 * Demonstrates how to use the Business Licensing API
 */

const http = require('http');

class APIExamples {
    constructor(baseUrl = 'http://localhost:3001') {
        this.baseUrl = baseUrl;
    }

    /**
     * Make HTTP request helper
     */
    async makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            if (data) {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const parsedBody = body ? JSON.parse(body) : null;
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            body: parsedBody
                        });
                    } catch (error) {
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            body: body
                        });
                    }
                });
            });

            req.on('error', reject);

            if (data) {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * Example 1: Small Family Restaurant
     */
    async example1_SmallFamilyRestaurant() {
        console.log('\n=== Example 1: Small Family Restaurant ===');
        
        const businessProfile = {
            businessType: 'restaurant',
            seatingCapacity: 25,
            floorArea: 85,
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
        };

        try {
            const response = await this.makeRequest('POST', '/api/requirements/match', businessProfile);
            
            if (response.body.success) {
                const data = response.body.data;
                console.log(`✅ Business Profile: ${data.businessProfile.businessType}`);
                console.log(`   Seating: ${data.businessProfile.seatingCapacity} people`);
                console.log(`   Floor Area: ${data.businessProfile.floorArea} m²`);
                console.log(`\n📋 Requirements Summary:`);
                console.log(`   Total Requirements: ${data.summary.totalRequirements}`);
                console.log(`   Mandatory: ${data.summary.mandatoryRequirements}`);
                console.log(`   Optional: ${data.summary.optionalRequirements}`);
                console.log(`   Estimated Processing Time: ${data.summary.estimatedProcessingTime}`);
                console.log(`   Complexity Level: ${data.summary.complexityLevel}`);
                
                console.log(`\n🏛️ Requirements by Authority:`);
                Object.entries(data.requirements).forEach(([authority, requirements]) => {
                    if (requirements.length > 0) {
                        console.log(`\n   ${authority.toUpperCase()} (${requirements.length} requirements):`);
                        requirements.forEach((req, index) => {
                            console.log(`   ${index + 1}. [${req.requirementId}] ${req.title}`);
                            console.log(`      Authority: ${req.authority}`);
                            console.log(`      Mandatory: ${req.mandatory ? 'Yes' : 'No'}`);
                        });
                    }
                });

                if (data.recommendations && data.recommendations.length > 0) {
                    console.log(`\n💡 Recommendations:`);
                    data.recommendations.forEach((rec, index) => {
                        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
                    });
                }
            } else {
                console.log('❌ Error:', response.body.error);
            }
        } catch (error) {
            console.log('❌ Request failed:', error.message);
        }
    }

    /**
     * Example 2: Large Restaurant with Bar
     */
    async example2_LargeRestaurantWithBar() {
        console.log('\n=== Example 2: Large Restaurant with Bar ===');
        
        const businessProfile = {
            businessType: 'restaurant',
            seatingCapacity: 65,
            floorArea: 180,
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
        };

        try {
            const response = await this.makeRequest('POST', '/api/requirements/match', businessProfile);
            
            if (response.body.success) {
                const data = response.body.data;
                console.log(`✅ Business Profile: Large ${data.businessProfile.businessType} with bar`);
                console.log(`   Seating: ${data.businessProfile.seatingCapacity} people`);
                console.log(`   Floor Area: ${data.businessProfile.floorArea} m²`);
                console.log(`   Special Services: Alcohol, Live Music, Outdoor Seating`);
                
                console.log(`\n📊 Complexity Analysis:`);
                console.log(`   Total Requirements: ${data.summary.totalRequirements}`);
                console.log(`   Complexity Level: ${data.summary.complexityLevel}`);
                console.log(`   Processing Time: ${data.summary.estimatedProcessingTime}`);
                
                // Show authority breakdown
                console.log(`\n🏛️ Authority Breakdown:`);
                Object.entries(data.summary.authorityCounts).forEach(([authority, count]) => {
                    console.log(`   ${authority}: ${count} requirements`);
                });

            } else {
                console.log('❌ Error:', response.body.error);
            }
        } catch (error) {
            console.log('❌ Request failed:', error.message);
        }
    }

    /**
     * Example 3: Small Cafe
     */
    async example3_SmallCafe() {
        console.log('\n=== Example 3: Small Neighborhood Cafe ===');
        
        const businessProfile = {
            businessType: 'cafe',
            seatingCapacity: 18,
            floorArea: 45,
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
        };

        try {
            const response = await this.makeRequest('POST', '/api/requirements/match', businessProfile);
            
            if (response.body.success) {
                const data = response.body.data;
                console.log(`✅ Business Profile: Small ${data.businessProfile.businessType}`);
                console.log(`   Seating: ${data.businessProfile.seatingCapacity} people`);
                console.log(`   Floor Area: ${data.businessProfile.floorArea} m²`);
                console.log(`   Simple operation: Dairy products, takeaway, outdoor seating`);
                
                console.log(`\n📋 Simple Requirements (${data.summary.totalRequirements} total):`);
                let requirementCount = 1;
                Object.entries(data.requirements).forEach(([authority, requirements]) => {
                    requirements.forEach(req => {
                        console.log(`   ${requirementCount}. ${req.title}`);
                        console.log(`      Authority: ${req.authority}`);
                        requirementCount++;
                    });
                });
                
                console.log(`\n✅ This is a ${data.summary.complexityLevel.toLowerCase()} complexity business with an estimated processing time of ${data.summary.estimatedProcessingTime}.`);

            } else {
                console.log('❌ Error:', response.body.error);
            }
        } catch (error) {
            console.log('❌ Request failed:', error.message);
        }
    }

    /**
     * Example 4: Get Detailed Requirement Information
     */
    async example4_RequirementDetails() {
        console.log('\n=== Example 4: Detailed Requirement Information ===');
        
        const requirementIds = ['GEN-001', 'POL-002', 'MOH-001', 'FIRE-001'];
        
        for (const reqId of requirementIds) {
            try {
                const response = await this.makeRequest('GET', `/api/requirements/${reqId}`);
                
                if (response.body.success) {
                    const req = response.body.data;
                    console.log(`\n📄 ${req.requirementId}: ${req.title}`);
                    console.log(`   Authority: ${req.authority}`);
                    console.log(`   Mandatory: ${req.mandatory ? 'Yes' : 'No'}`);
                    console.log(`   Description: ${req.description}`);
                    
                    if (req.processingTips && req.processingTips.length > 0) {
                        console.log(`   💡 Processing Tips:`);
                        req.processingTips.forEach((tip, index) => {
                            console.log(`      ${index + 1}. ${tip}`);
                        });
                    }
                    
                    if (req.relatedRequirements && req.relatedRequirements.length > 0) {
                        console.log(`   🔗 Related Requirements: ${req.relatedRequirements.map(r => r.requirementId).join(', ')}`);
                    }
                } else {
                    console.log(`❌ Error getting details for ${reqId}:`, response.body.error);
                }
            } catch (error) {
                console.log(`❌ Request failed for ${reqId}:`, error.message);
            }
        }
    }

    /**
     * Example 5: Business Types Information
     */
    async example5_BusinessTypes() {
        console.log('\n=== Example 5: Available Business Types ===');
        
        try {
            const response = await this.makeRequest('GET', '/api/business-types');
            
            if (response.body.success) {
                console.log(`📋 Available Business Types (${response.body.data.length}):`);
                response.body.data.forEach((type, index) => {
                    console.log(`\n   ${index + 1}. ${type.name} (${type.id})`);
                    console.log(`      Description: ${type.description}`);
                    console.log(`      Typical Seating: ${type.typicalSeating} people`);
                    console.log(`      Typical Area: ${type.typicalArea} m²`);
                });
            } else {
                console.log('❌ Error:', response.body.error);
            }
        } catch (error) {
            console.log('❌ Request failed:', error.message);
        }
    }

    /**
     * Example 6: Invalid Data Handling
     */
    async example6_InvalidDataHandling() {
        console.log('\n=== Example 6: Invalid Data Handling ===');
        
        const invalidProfiles = [
            {
                name: 'Missing Business Type',
                data: {
                    seatingCapacity: 20,
                    floorArea: 80
                }
            },
            {
                name: 'Invalid Business Type',
                data: {
                    businessType: 'invalid_business',
                    seatingCapacity: 20,
                    floorArea: 80
                }
            },
            {
                name: 'Negative Seating',
                data: {
                    businessType: 'restaurant',
                    seatingCapacity: -10,
                    floorArea: 80
                }
            }
        ];

        for (const test of invalidProfiles) {
            try {
                console.log(`\n🧪 Testing: ${test.name}`);
                const response = await this.makeRequest('POST', '/api/requirements/match', test.data);
                
                if (response.status === 400 && !response.body.success) {
                    console.log(`   ✅ Validation working: ${response.body.error}`);
                    if (response.body.details) {
                        console.log(`   Details: ${JSON.stringify(response.body.details, null, 6)}`);
                    }
                } else {
                    console.log(`   ❌ Expected validation error, got status ${response.status}`);
                }
            } catch (error) {
                console.log(`   ❌ Request failed: ${error.message}`);
            }
        }
    }

    /**
     * Run all examples
     */
    async runAllExamples() {
        console.log('🚀 Business Licensing API - Usage Examples');
        console.log('=' .repeat(50));
        console.log('📍 API Server:', this.baseUrl);
        console.log('⏰ Started at:', new Date().toISOString());

        // Check if server is running
        try {
            const healthCheck = await this.makeRequest('GET', '/health');
            if (healthCheck.status !== 200) {
                throw new Error(`Server health check failed (status: ${healthCheck.status})`);
            }
            console.log('✅ Server is healthy and ready');
        } catch (error) {
            console.log('❌ Server is not responding. Please start the server with: npm start');
            return;
        }

        // Run examples
        await this.example1_SmallFamilyRestaurant();
        await this.example2_LargeRestaurantWithBar();
        await this.example3_SmallCafe();
        await this.example4_RequirementDetails();
        await this.example5_BusinessTypes();
        await this.example6_InvalidDataHandling();

        console.log('\n' + '=' .repeat(50));
        console.log('✨ All examples completed!');
        console.log('📚 For more information, see API-DOCUMENTATION.md');
        console.log('⏰ Finished at:', new Date().toISOString());
    }
}

// Run examples if called directly
if (require.main === module) {
    const examples = new APIExamples();
    examples.runAllExamples()
        .then(() => {
            console.log('\n🎉 Examples finished successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Examples failed:', error.message);
            process.exit(1);
        });
}

module.exports = APIExamples;