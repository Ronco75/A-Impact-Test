const Joi = require('joi');

/**
 * Validation middleware for API endpoints
 */

// Business profile validation schema
const businessProfileSchema = Joi.object({
    businessType: Joi.string()
        .valid('restaurant', 'cafe', 'fast_food', 'delivery_only', 'catering', 'food_truck', 'bar_pub', 'hotel_restaurant')
        .required()
        .messages({
            'string.base': 'Business type must be a string',
            'any.only': 'Business type must be one of: restaurant, cafe, fast_food, delivery_only, catering, food_truck, bar_pub, hotel_restaurant',
            'any.required': 'Business type is required'
        }),
    
    seatingCapacity: Joi.number()
        .integer()
        .min(0)
        .max(1000)
        .required()
        .messages({
            'number.base': 'Seating capacity must be a number',
            'number.integer': 'Seating capacity must be an integer',
            'number.min': 'Seating capacity cannot be negative',
            'number.max': 'Seating capacity cannot exceed 1000',
            'any.required': 'Seating capacity is required'
        }),
    
    floorArea: Joi.number()
        .positive()
        .max(5000)
        .required()
        .messages({
            'number.base': 'Floor area must be a number',
            'number.positive': 'Floor area must be positive',
            'number.max': 'Floor area cannot exceed 5000 square meters',
            'any.required': 'Floor area is required'
        }),
    
    services: Joi.object({
        alcoholService: Joi.boolean().default(false),
        deliveryService: Joi.boolean().default(false),
        liveMusic: Joi.boolean().default(false),
        outdoorSeating: Joi.boolean().default(false)
    }).default({}),
    
    kitchenFeatures: Joi.object({
        gasUsage: Joi.boolean().default(false),
        meatHandling: Joi.boolean().default(false)
    }).default({}),
    
    operationalHours: Joi.object({
        lateNightOperation: Joi.boolean().default(false)
    }).default({})
});

// Requirement ID validation schema
const requirementIdSchema = Joi.object({
    requirementId: Joi.string()
        .pattern(/^[A-Z]+-\d{3}$/)
        .required()
        .messages({
            'string.pattern.base': 'Requirement ID must follow pattern: XXX-000 (e.g., GEN-001)',
            'any.required': 'Requirement ID is required'
        })
});

/**
 * Middleware to validate business profile data
 */
const validateBusinessProfile = (req, res, next) => {
    try {
        const { error, value } = businessProfileSchema.validate(req.body, {
            abortEarly: false, // Show all validation errors
            stripUnknown: true, // Remove unknown fields
            convert: true // Convert types when possible
        });

        if (error) {
            const errorDetails = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errorDetails,
                timestamp: new Date().toISOString()
            });
        }

        // Replace request body with validated and cleaned data
        req.body = value;
        next();
        
    } catch (err) {
        console.error('Validation middleware error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal validation error',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Middleware to validate requirement ID parameter
 */
const validateRequirementId = (req, res, next) => {
    try {
        const { error, value } = requirementIdSchema.validate({
            requirementId: req.params.requirementId
        });

        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid requirement ID format',
                details: error.details[0].message,
                timestamp: new Date().toISOString()
            });
        }

        req.params.requirementId = value.requirementId;
        next();
        
    } catch (err) {
        console.error('Requirement ID validation error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal validation error',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Generic error handler for validation
 */
const handleValidationError = (error, req, res, next) => {
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
    next(error);
};

/**
 * Middleware to sanitize and normalize input data
 */
const sanitizeInput = (req, res, next) => {
    try {
        if (req.body) {
            // Remove any potentially dangerous properties
            delete req.body.__proto__;
            delete req.body.constructor;
            
            // Trim string values
            Object.keys(req.body).forEach(key => {
                if (typeof req.body[key] === 'string') {
                    req.body[key] = req.body[key].trim();
                }
            });
        }
        
        next();
    } catch (err) {
        console.error('Input sanitization error:', err);
        return res.status(500).json({
            success: false,
            error: 'Input processing error',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Rate limiting validation (simple in-memory implementation)
 */
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 100;

const rateLimit = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of requestCounts.entries()) {
        if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
            requestCounts.delete(ip);
        }
    }
    
    // Check current client
    if (!requestCounts.has(clientIp)) {
        requestCounts.set(clientIp, {
            count: 1,
            firstRequest: now
        });
    } else {
        const clientData = requestCounts.get(clientIp);
        if (now - clientData.firstRequest > RATE_LIMIT_WINDOW) {
            // Reset window
            requestCounts.set(clientIp, {
                count: 1,
                firstRequest: now
            });
        } else {
            clientData.count++;
            if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
                return res.status(429).json({
                    success: false,
                    error: 'Rate limit exceeded',
                    message: `Too many requests. Limit: ${MAX_REQUESTS_PER_WINDOW} requests per 15 minutes`,
                    retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - clientData.firstRequest)) / 1000),
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    // Add rate limit headers
    const clientData = requestCounts.get(clientIp);
    res.set({
        'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW,
        'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS_PER_WINDOW - clientData.count),
        'X-RateLimit-Reset': new Date(clientData.firstRequest + RATE_LIMIT_WINDOW).toISOString()
    });
    
    next();
};

module.exports = {
    validateBusinessProfile,
    validateRequirementId,
    handleValidationError,
    sanitizeInput,
    rateLimit,
    businessProfileSchema,
    requirementIdSchema
};