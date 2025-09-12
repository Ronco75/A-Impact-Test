require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');

// Import services and middleware
const MatchingEngine = require('./services/matching-engine');
const OpenRouterService = require('./services/openrouter-service');
const {
    validateBusinessProfile,
    validateRequirementId,
    handleValidationError,
    sanitizeInput,
    rateLimit
} = require('./middleware/validation');

/**
 * Business Licensing API Server
 * Provides endpoints for business licensing requirements matching
 */

class BusinessLicensingAPI {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3001;
        this.matchingEngine = null;
        this.openRouterService = null;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.initializeServices();
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? ['https://yourdomain.com'] 
                : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
            credentials: true,
            optionsSuccessStatus: 200
        }));

        // Request processing middleware
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Logging
        this.app.use(morgan('combined'));
        
        // Custom middleware
        this.app.use(sanitizeInput);
        this.app.use(rateLimit);
    }

    /**
     * Initialize services
     */
    async initializeServices() {
        try {
            this.matchingEngine = new MatchingEngine();
            this.openRouterService = new OpenRouterService();
            console.log('Matching engine initialized successfully');
            console.log('OpenRouter service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize services:', error);
            process.exit(1);
        }
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                service: 'Business Licensing API'
            });
        });

        // API info endpoint
        this.app.get('/api/info', (req, res) => {
            res.json({
                name: 'Business Licensing Requirements API',
                version: '1.0.0',
                description: 'API for Israeli business licensing requirements matching',
                endpoints: {
                    'POST /api/requirements/match': 'Get applicable requirements for business profile',
                    'GET /api/requirements/:requirementId': 'Get detailed requirement information',
                    'POST /api/generate-report': 'Generate user-friendly report from requirements',
                    'GET /api/business-types': 'Get available business types',
                    'GET /health': 'Health check'
                },
                documentation: 'See README.md for detailed API documentation'
            });
        });

        // Get available business types
        this.app.get('/api/business-types', (req, res) => {
            try {
                const businessTypes = [
                    { 
                        id: 'restaurant', 
                        name: 'מסעדה', 
                        description: 'מסעדה עם שירות מלא',
                        typicalSeating: '20-100',
                        typicalArea: '80-300'
                    },
                    { 
                        id: 'cafe', 
                        name: 'בית קפה', 
                        description: 'בית קפה עם מזון קל',
                        typicalSeating: '10-40',
                        typicalArea: '30-100'
                    },
                    { 
                        id: 'fast_food', 
                        name: 'מזון מהיר', 
                        description: 'מזון מהיר ושירות עצמי',
                        typicalSeating: '15-50',
                        typicalArea: '40-150'
                    },
                    { 
                        id: 'delivery_only', 
                        name: 'משלוחים בלבד', 
                        description: 'עסק משלוחים ללא ישיבה',
                        typicalSeating: '0-5',
                        typicalArea: '20-80'
                    },
                    { 
                        id: 'catering', 
                        name: 'קייטרינג', 
                        description: 'שירותי קייטרינג ואירועים',
                        typicalSeating: '0-20',
                        typicalArea: '50-200'
                    },
                    { 
                        id: 'bar_pub', 
                        name: 'בר/פאב', 
                        description: 'בר או פאב עם אלכוהול',
                        typicalSeating: '20-80',
                        typicalArea: '60-200'
                    }
                ];

                res.json({
                    success: true,
                    data: businessTypes,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error fetching business types:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch business types',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Main endpoint: Match requirements to business profile
        this.app.post('/api/requirements/match', validateBusinessProfile, async (req, res) => {
            try {
                console.log('Processing requirements matching request:', {
                    businessType: req.body.businessType,
                    seatingCapacity: req.body.seatingCapacity,
                    floorArea: req.body.floorArea
                });

                // Get applicable requirements using matching engine
                const result = this.matchingEngine.findApplicableRequirements(req.body);
                
                // Add business recommendations
                const recommendations = this.matchingEngine.getBusinessRecommendations(req.body);
                result.recommendations = recommendations;

                console.log(`Found ${result.summary.totalRequirements} applicable requirements`);

                res.json({
                    success: true,
                    data: result,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Error processing requirements match:', error);
                
                if (error.message.includes('Missing required field') || 
                    error.message.includes('Invalid business type')) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid business profile',
                        details: error.message,
                        timestamp: new Date().toISOString()
                    });
                }

                res.status(500).json({
                    success: false,
                    error: 'Internal server error during requirements matching',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Generate user-friendly report from requirements
        this.app.post('/api/generate-report', validateBusinessProfile, async (req, res) => {
            try {
                console.log('Processing report generation request:', JSON.stringify(req.body, null, 2));
                console.log('=== BUSINESS PROFILE CHECKBOX VALUES ===');
                console.log('servesAlcohol:', req.body.servesAlcohol);
                console.log('servesMeat:', req.body.servesMeat);
                console.log('lateHours:', req.body.lateHours);
                console.log('=====================================');

                // First get applicable requirements using matching engine
                const requirementsData = this.matchingEngine.findApplicableRequirements(req.body);
                
                // Add business recommendations
                const recommendations = this.matchingEngine.getBusinessRecommendations(req.body);
                requirementsData.recommendations = recommendations;

                console.log(`Generating report for ${requirementsData.summary.totalRequirements} requirements`);

                // Generate user-friendly report using OpenRouter
                const report = await this.openRouterService.generateReport(requirementsData, req.body);

                console.log('Report generated successfully');

                res.json({
                    success: true,
                    data: {
                        report: report,
                        rawRequirements: requirementsData // Include raw data for reference
                    },
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Error generating report:', error);
                
                if (error.message.includes('Missing required field') || 
                    error.message.includes('Invalid business type')) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid business profile',
                        details: error.message,
                        timestamp: new Date().toISOString()
                    });
                }

                res.status(500).json({
                    success: false,
                    error: 'Internal server error during report generation',
                    details: process.env.NODE_ENV === 'development' ? error.message : 'Report generation failed',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Get detailed requirement information
        this.app.get('/api/requirements/:requirementId', validateRequirementId, async (req, res) => {
            try {
                const requirementId = req.params.requirementId;
                console.log(`Fetching requirement details for: ${requirementId}`);

                const requirementDetails = this.matchingEngine.getRequirementDetails(requirementId);

                res.json({
                    success: true,
                    data: requirementDetails,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Error fetching requirement details:', error);
                
                if (error.message.includes('Requirement not found')) {
                    return res.status(404).json({
                        success: false,
                        error: 'Requirement not found',
                        details: error.message,
                        timestamp: new Date().toISOString()
                    });
                }

                res.status(500).json({
                    success: false,
                    error: 'Internal server error while fetching requirement details',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Get all available requirements (for development/debugging)
        this.app.get('/api/requirements', (req, res) => {
            try {
                const allRequirements = this.matchingEngine.getAllRequirements();
                
                res.json({
                    success: true,
                    data: {
                        total: allRequirements.length,
                        requirements: allRequirements.map(req => ({
                            requirementId: req.requirementId,
                            title: req.title,
                            authority: req.authority,
                            category: req.category,
                            mandatory: req.mandatory
                        }))
                    },
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Error fetching all requirements:', error);
                res.status(500).json({
                    success: false,
                    error: 'Failed to fetch requirements',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // 404 handler for unknown routes
        this.app.use((req, res) => {
            res.status(404).json({
                success: false,
                error: 'Endpoint not found',
                availableEndpoints: [
                    'GET /health',
                    'GET /api/info',
                    'GET /api/business-types',
                    'POST /api/requirements/match',
                    'POST /api/generate-report',
                    'GET /api/requirements/:requirementId',
                    'GET /api/requirements'
                ],
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Setup error handling middleware
     */
    setupErrorHandling() {
        // Validation error handler
        this.app.use(handleValidationError);

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            
            res.status(error.status || 500).json({
                success: false,
                error: process.env.NODE_ENV === 'production' 
                    ? 'Internal server error' 
                    : error.message,
                timestamp: new Date().toISOString()
            });
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            process.exit(1);
        });
    }

    /**
     * Start the server
     */
    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Business Licensing API Server started successfully`);
            console.log(`📍 Server running on http://localhost:${this.port}`);
            console.log(`📊 Health check available at http://localhost:${this.port}/health`);
            console.log(`📚 API info available at http://localhost:${this.port}/api/info`);
            console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`⏰ Started at: ${new Date().toISOString()}`);
        });
    }
}

// Create and start server
const server = new BusinessLicensingAPI();
server.start();

// Export for testing
module.exports = BusinessLicensingAPI;