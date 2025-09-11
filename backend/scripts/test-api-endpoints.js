const http = require('http');

/**
 * API Endpoints Testing Script
 * Tests all endpoints of the Business Licensing API
 */

class APITester {
    constructor() {
        this.baseUrl = 'http://localhost:3001';
        this.testResults = [];
    }

    /**
     * Make HTTP request
     */
    makeRequest(method, path, data = null) {
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
     * Log test result
     */
    logTest(testName, success, details = null) {
        const result = {
            test: testName,
            success: success,
            timestamp: new Date().toISOString(),
            details: details
        };
        
        this.testResults.push(result);
        
        const status = success ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${testName}`);
        if (details && !success) {
            console.log(`   Details: ${details}`);
        }
    }

    /**
     * Test health endpoint
     */
    async testHealthEndpoint() {
        try {
            const response = await this.makeRequest('GET', '/health');
            
            const success = response.status === 200 && 
                           response.body.status === 'healthy';
            
            this.logTest('Health Check Endpoint', success, 
                success ? null : `Status: ${response.status}, Body: ${JSON.stringify(response.body)}`);
                
        } catch (error) {
            this.logTest('Health Check Endpoint', false, error.message);
        }
    }

    /**
     * Test API info endpoint
     */
    async testAPIInfoEndpoint() {
        try {
            const response = await this.makeRequest('GET', '/api/info');
            
            const success = response.status === 200 && 
                           response.body.name && 
                           response.body.endpoints;
            
            this.logTest('API Info Endpoint', success,
                success ? null : `Status: ${response.status}`);
                
        } catch (error) {
            this.logTest('API Info Endpoint', false, error.message);
        }
    }

    /**
     * Test business types endpoint
     */
    async testBusinessTypesEndpoint() {
        try {
            const response = await this.makeRequest('GET', '/api/business-types');
            
            const success = response.status === 200 && 
                           response.body.success && 
                           Array.isArray(response.body.data) &&
                           response.body.data.length > 0;
            
            this.logTest('Business Types Endpoint', success,
                success ? `Found ${response.body.data.length} business types` : `Status: ${response.status}`);
                
        } catch (error) {
            this.logTest('Business Types Endpoint', false, error.message);
        }
    }

    /**
     * Test requirements matching endpoint with valid data
     */
    async testRequirementsMatchingValid() {
        const testCases = [
            {
                name: 'Small Restaurant',
                data: {
                    businessType: 'restaurant',
                    seatingCapacity: 20,
                    floorArea: 80,
                    services: {
                        alcoholService: false,
                        deliveryService: true,
                        takeaway: true
                    },
                    kitchenFeatures: {
                        gasUsage: true,
                        meatHandling: true
                    }
                }
            },
            {
                name: 'Large Restaurant with Alcohol',
                data: {
                    businessType: 'restaurant',
                    seatingCapacity: 50,
                    floorArea: 150,
                    services: {
                        alcoholService: true,
                        liveMusic: true
                    },
                    kitchenFeatures: {
                        gasUsage: true,
                        meatHandling: true
                    }
                }
            },
            {
                name: 'Small Cafe',
                data: {
                    businessType: 'cafe',
                    seatingCapacity: 15,
                    floorArea: 50,
                    services: {
                        takeaway: true
                    },
                    kitchenFeatures: {
                        dairyProducts: true
                    }
                }
            },
            {
                name: 'Delivery Only',
                data: {
                    businessType: 'delivery_only',
                    seatingCapacity: 0,
                    floorArea: 30,
                    services: {
                        deliveryService: true
                    },
                    kitchenFeatures: {
                        gasUsage: false
                    }
                }
            }
        ];

        for (const testCase of testCases) {
            try {
                const response = await this.makeRequest('POST', '/api/requirements/match', testCase.data);
                
                const success = response.status === 200 && 
                               response.body.success && 
                               response.body.data.requirements &&
                               response.body.data.summary;
                
                this.logTest(`Requirements Matching - ${testCase.name}`, success,
                    success ? `Found ${response.body.data.summary.totalRequirements} requirements` : 
                             `Status: ${response.status}, Error: ${JSON.stringify(response.body)}`);
                             
            } catch (error) {
                this.logTest(`Requirements Matching - ${testCase.name}`, false, error.message);
            }
        }
    }

    /**
     * Test requirements matching endpoint with invalid data
     */
    async testRequirementsMatchingInvalid() {
        const invalidTestCases = [
            {
                name: 'Missing Business Type',
                data: {
                    seatingCapacity: 20,
                    floorArea: 80
                },
                expectedStatus: 400
            },
            {
                name: 'Invalid Business Type',
                data: {
                    businessType: 'invalid_type',
                    seatingCapacity: 20,
                    floorArea: 80
                },
                expectedStatus: 400
            },
            {
                name: 'Negative Seating Capacity',
                data: {
                    businessType: 'restaurant',
                    seatingCapacity: -5,
                    floorArea: 80
                },
                expectedStatus: 400
            },
            {
                name: 'Zero Floor Area',
                data: {
                    businessType: 'restaurant',
                    seatingCapacity: 20,
                    floorArea: 0
                },
                expectedStatus: 400
            },
            {
                name: 'Missing Required Fields',
                data: {},
                expectedStatus: 400
            }
        ];

        for (const testCase of invalidTestCases) {
            try {
                const response = await this.makeRequest('POST', '/api/requirements/match', testCase.data);
                
                const success = response.status === testCase.expectedStatus && 
                               response.body.success === false;
                
                this.logTest(`Invalid Data Test - ${testCase.name}`, success,
                    success ? null : `Expected status ${testCase.expectedStatus}, got ${response.status}`);
                             
            } catch (error) {
                this.logTest(`Invalid Data Test - ${testCase.name}`, false, error.message);
            }
        }
    }

    /**
     * Test requirement details endpoint
     */
    async testRequirementDetailsEndpoint() {
        const testCases = [
            { id: 'GEN-001', shouldExist: true },
            { id: 'POL-002', shouldExist: true },
            { id: 'MOH-001', shouldExist: true },
            { id: 'FIRE-001', shouldExist: true },
            { id: 'INVALID-999', shouldExist: false }
        ];

        for (const testCase of testCases) {
            try {
                const response = await this.makeRequest('GET', `/api/requirements/${testCase.id}`);
                
                const success = testCase.shouldExist ? 
                    (response.status === 200 && response.body.success) :
                    (response.status === 404 && response.body.success === false);
                
                this.logTest(`Requirement Details - ${testCase.id}`, success,
                    success ? null : `Status: ${response.status}`);
                             
            } catch (error) {
                this.logTest(`Requirement Details - ${testCase.id}`, false, error.message);
            }
        }
    }

    /**
     * Test all requirements endpoint
     */
    async testAllRequirementsEndpoint() {
        try {
            const response = await this.makeRequest('GET', '/api/requirements');
            
            const success = response.status === 200 && 
                           response.body.success && 
                           response.body.data.requirements &&
                           response.body.data.total > 0;
            
            this.logTest('All Requirements Endpoint', success,
                success ? `Found ${response.body.data.total} total requirements` : `Status: ${response.status}`);
                
        } catch (error) {
            this.logTest('All Requirements Endpoint', false, error.message);
        }
    }

    /**
     * Test 404 endpoint
     */
    async testNotFoundEndpoint() {
        try {
            const response = await this.makeRequest('GET', '/api/nonexistent');
            
            const success = response.status === 404 && 
                           response.body.success === false;
            
            this.logTest('404 Endpoint Test', success,
                success ? null : `Status: ${response.status}`);
                
        } catch (error) {
            this.logTest('404 Endpoint Test', false, error.message);
        }
    }

    /**
     * Test rate limiting (simplified)
     */
    async testRateLimit() {
        console.log('Testing rate limiting (making multiple requests)...');
        
        try {
            const requests = [];
            for (let i = 0; i < 10; i++) {
                requests.push(this.makeRequest('GET', '/health'));
            }
            
            const responses = await Promise.all(requests);
            const allSuccessful = responses.every(r => r.status === 200);
            
            this.logTest('Rate Limiting Test', allSuccessful,
                allSuccessful ? 'Multiple requests handled properly' : 'Some requests failed');
                
        } catch (error) {
            this.logTest('Rate Limiting Test', false, error.message);
        }
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting API Endpoints Testing...\n');
        console.log('🔗 Testing server at:', this.baseUrl);
        console.log('⏰ Started at:', new Date().toISOString());
        console.log('=' .repeat(50));

        // Basic endpoints
        await this.testHealthEndpoint();
        await this.testAPIInfoEndpoint();
        await this.testBusinessTypesEndpoint();
        
        // Main functionality
        await this.testRequirementsMatchingValid();
        await this.testRequirementsMatchingInvalid();
        await this.testRequirementDetailsEndpoint();
        await this.testAllRequirementsEndpoint();
        
        // Edge cases
        await this.testNotFoundEndpoint();
        await this.testRateLimit();

        // Summary
        console.log('\n' + '=' .repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('=' .repeat(50));
        
        const passedTests = this.testResults.filter(t => t.success).length;
        const totalTests = this.testResults.length;
        const passRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log(`✅ Passed: ${passedTests}`);
        console.log(`❌ Failed: ${totalTests - passedTests}`);
        console.log(`📈 Pass Rate: ${passRate}%`);
        console.log(`⏰ Completed at: ${new Date().toISOString()}\n`);

        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! API is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Check the details above.');
            
            // Show failed tests
            const failedTests = this.testResults.filter(t => !t.success);
            console.log('\n❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`   - ${test.test}: ${test.details || 'Unknown error'}`);
            });
        }

        return {
            passed: passedTests,
            total: totalTests,
            passRate: passRate,
            results: this.testResults
        };
    }

    /**
     * Wait for server to be ready
     */
    async waitForServer(maxAttempts = 10, delay = 2000) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await this.makeRequest('GET', '/health');
                if (response.status === 200) {
                    console.log('✅ Server is ready for testing');
                    return true;
                }
            } catch (error) {
                console.log(`⏳ Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error('Server is not responding after maximum attempts');
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new APITester();
    
    tester.waitForServer()
        .then(() => tester.runAllTests())
        .then((results) => {
            process.exit(results.passed === results.total ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Testing failed:', error.message);
            process.exit(1);
        });
}

module.exports = APITester;