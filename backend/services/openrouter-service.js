const axios = require('axios');

/**
 * OpenRouter API Service for generating business licensing reports
 * Uses OpenRouter API to generate clear, user-friendly reports from licensing requirements
 */
class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseUrl = process.env.OPENROUTER_BASE_URL;
        this.model = process.env.OPENROUTER_BASE_MODEL;
        
        if (!this.apiKey) {
            console.warn('OpenRouter API key not found in environment variables. Set OPENROUTER_API_KEY in .env file.');
        } else {
            console.log('OpenRouter API key configured successfully');
        }
    }

    /**
     * Generate a clear, user-friendly report from licensing requirements
     * @param {Object} requirementsData - The requirements data from matching engine
     * @param {Object} businessProfile - The business profile used for matching
     * @returns {Promise<Object>} Generated report with structured content
     */
    async generateReport(requirementsData, businessProfile) {
        try {
            console.log('=== AI REPORT GENERATION DEBUG ===');
            console.log('Business Profile sent to AI:', JSON.stringify(businessProfile, null, 2));
            console.log('Requirements data being processed by AI:');
            console.log('- Total requirements found:', requirementsData.summary?.totalRequirements || 'N/A');
            console.log('- Requirements by authority:', JSON.stringify(requirementsData.summary?.authorityCounts || {}, null, 2));
            console.log('- Sample requirement from processed PDF data:', JSON.stringify(
                Object.values(requirementsData.requirements || {})[0]?.[0] || 'No requirements found', 
                null, 2
            ));
            console.log('=== END DEBUG INFO ===');
            
            const prompt = this.buildReportPrompt(requirementsData, businessProfile);
            
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'אתה מומחה מנוסה ברישוי עסקים בישראל עם יכולות עיבוד נתונים מתקדמות. אתה מתמחה בעיבוד חכם של דרישות רישוי גולמיות, התאמה אישית מדויקת לכל עסק, ותרגום שפה משפטית מורכבת לשפה עסקית ברורה ומעשית. הדוחות שלך מסודרים בקפדנות לפי עדיפויות עם המלצות פעולה קונקרטיות.'
                    },
                    {
                        role: 'user', 
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.3,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:3001',
                    'X-Title': 'Business Licensing Report Generator'
                }
            });

            const aiResponse = response.data.choices[0].message.content;
            
            return this.parseAIResponse(aiResponse, requirementsData, businessProfile);
            
        } catch (error) {
            console.error('Error generating report with OpenRouter:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            
            // Fallback to basic report if AI fails
            return this.generateFallbackReport(requirementsData, businessProfile);
        }
    }

    /**
     * Build the prompt for the AI to generate a comprehensive report
     * @param {Object} requirementsData - Requirements data
     * @param {Object} businessProfile - Business profile
     * @returns {string} Formatted prompt
     */
    buildReportPrompt(requirementsData, businessProfile) {
        return `
אתה מומחה מנוסה ברישוי עסקים בישראל. תפקידך לנתח דרישות רישוי גולמיות ולהפוך אותן לדוח מקיף, מותאם אישית וברור עבור בעל העסק.

**עיבוד חכם של הדרישות:**
קיבלת נתונים גולמיים של דרישות רישוי. תפקידך:
- לנתח ולעבד את הנתונים הגולמיים לתמצית ברורה ומובנת
- לסנן את הדרישות הרלוונטיות ספציפית לעסק הזה
- לזהות קשרים וחפיפות בין דרישות שונות
- להדגיש את הדרישות הקריטיות והדחופות ביותר

**פרטי העסק לעיבוד מותאם אישית:**
- סוג העסק: ${businessProfile.businessType}
- קיבולת ישיבה: ${businessProfile.seatingCapacity} מקומות
- שטח העסק: ${businessProfile.floorArea} מ"ר
- מוכר אלכוהול: ${businessProfile.services?.alcoholService ? 'כן' : 'לא'}
- מוכר בשר: ${businessProfile.kitchenFeatures?.meatHandling ? 'כן' : 'לא'}
- שימוש בגז: ${businessProfile.kitchenFeatures?.gasUsage ? 'כן' : 'לא'}
- פתוח עד מאוחר: ${businessProfile.operationalHours?.lateNightOperation ? 'כן' : 'לא'}

**נתונים גולמיים לעיבוד מקובץ ה-PDF המקורי:**
${JSON.stringify(requirementsData, null, 2)}

**הוראות יצירת הדוח:**

**התאמה אישית מלאה:**
- נתח את מאפייני העסק הספציפיים (גודל, תפוסה, פעילות)
- התאם את הדרישות בדיוק למה שרלוונטי לעסק הזה
- הסבר איך כל מאפיין משפיע על הדרישות (למשל: "בשל קיבולת של ${businessProfile.seatingCapacity} מקומות...")
- זהה דרישות שעלולות להשתנות בהתבסס על המאפיינים הספציפיים

**תרגום שפת חוק לשפה עסקית:**
- תרגם מונחים משפטיים וטכניים לשפה פשוטה ויומיומית
- הסבר את המשמעות המעשית של כל דרישה
- המר הליכים רשמיים לפעולות קונקרטיות שבעל העסק צריך לעשות
- הוסף דוגמאות מעשיות כשאפשר

**ארגון תוכן מובנה עם עדיפויות:**
1. **סיכום ביצועי מותאם** - המשמעות הכוללת לעסק הספציפי הזה
2. **מפת דרכים לפעולה** - סדר ביצוע מומלץ עם עדיפויות ברורות:
   - 🔴 **דחוף וקריטי** (חייב להתחיל מיד)
   - 🟡 **חשוב** (להתחיל בחודש הקרוב)  
   - 🟢 **לא דחוף** (ניתן לדחות)
3. **דרישות לפי רשות עם עלויות וזמנים:**
   - עירייה: פירוט ממוקד למה שרלוונטי לגודל/סוג העסק
   - משטרה: רק אם רלוונטי (אלכוהול/אירועים)
   - משרד הבריאות: מותאם לסוג המזון/הכנה
   - מכבי האש: מותאם לגודל ופעילות העסק
4. **תכנון כספי מותאם** - עלויות ספציפיות לעסק הזה
5. **לוח זמנים אישי** - התבסס על המאפיינים לתכנון ריאלי

**המלצות פעולה מותאמות:**
- המלצות ספציפיות בהתבסס על סוג ומאפייני העסק
- זהה חוסכי זמן וכסף עבור העסק הזה
- הצע אסטרטגיות להתמודד עם אתגרים צפויים
- ציין על שיתופי פעולה אפשריים עם גורמים מקצועיים

הדוח חייב להיות:
- **מותאם אישית 100%** למאפייני העסק הספציפיים
- **בשפה עסקית ברורה** ללא ז'רגון משפטי
- **מעשי ויישומי** עם פעולות קונקרטיות
- **מסודר לפי עדיפויות** עם חלוקה ברורה לדחוף/חשוב/לא דחוף

תשובה בפורמט JSON עם המבנה הבא:
{
  "title": "דוח רישוי מותאם אישית - [סוג העסק]",
  "summary": "סיכום מותאם אישית המתמקד במאפייני העסק הספציפיים",
  "sections": [
    {
      "title": "מפת דרכים לפעולה",
      "content": "תוכן markdown עם עדיפויות צבעוניות",
      "priority": "high"
    },
    {
      "title": "דרישות רשות [שם] - מותאם לעסק שלך",
      "content": "תוכן ספציפי לעסק בmarkdown",
      "priority": "high|medium|low"
    }
  ],
  "recommendations": ["המלצות מותאמות אישית לעסק הזה"],
  "personalizedInsights": ["תובנות ייחודיות לסוג ומאפייני העסק"],
  "totalEstimatedCost": "הערכת עלות מותאמת לעסק הספציפי",
  "estimatedTimeframe": "לוח זמנים מותאם למורכבות העסק הספציפי",
  "criticalDeadlines": ["מועדים קריטיים ודחופים עבור העסק הזה"]
}
`;
    }

    /**
     * Parse the AI response and structure it properly
     * @param {string} aiResponse - Raw AI response
     * @param {Object} requirementsData - Original requirements data
     * @param {Object} businessProfile - Business profile
     * @returns {Object} Structured report
     */
    parseAIResponse(aiResponse, requirementsData, businessProfile) {
        try {
            // Try to parse as JSON first
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsedReport = JSON.parse(jsonMatch[0]);
                
                // Add metadata and ensure new fields exist
                parsedReport.metadata = {
                    generatedAt: new Date().toISOString(),
                    businessProfile: businessProfile,
                    requirementsSummary: requirementsData.summary,
                    generatedBy: 'OpenRouter AI'
                };
                
                // Ensure new fields exist with fallbacks
                if (!parsedReport.personalizedInsights) {
                    parsedReport.personalizedInsights = [];
                }
                if (!parsedReport.criticalDeadlines) {
                    parsedReport.criticalDeadlines = [];
                }
                
                return parsedReport;
            }
        } catch (parseError) {
            console.warn('Failed to parse AI response as JSON, creating structured fallback');
        }

        // Fallback: create structured response from plain text
        return {
            title: `דוח דרישות רישוי עבור ${this.getBusinessTypeInHebrew(businessProfile.businessType)}`,
            summary: aiResponse.substring(0, 300) + '...',
            sections: [
                {
                    title: 'דוח מפורט',
                    content: aiResponse,
                    priority: 'high'
                }
            ],
            recommendations: this.extractRecommendations(requirementsData),
            personalizedInsights: this.extractPersonalizedInsights(businessProfile, requirementsData),
            totalEstimatedCost: 'לא זמין',
            estimatedTimeframe: 'לא זמין',
            criticalDeadlines: this.extractCriticalDeadlines(requirementsData),
            metadata: {
                generatedAt: new Date().toISOString(),
                businessProfile: businessProfile,
                requirementsSummary: requirementsData.summary,
                generatedBy: 'OpenRouter AI (Fallback)'
            }
        };
    }

    /**
     * Generate a fallback report when AI service fails
     * @param {Object} requirementsData - Requirements data
     * @param {Object} businessProfile - Business profile
     * @returns {Object} Basic structured report
     */
    generateFallbackReport(requirementsData, businessProfile) {
        const businessTypeHebrew = this.getBusinessTypeInHebrew(businessProfile.businessType);
        
        return {
            title: `דוח דרישות רישוי עבור ${businessTypeHebrew}`,
            summary: `נמצאו ${requirementsData.summary.totalRequirements} דרישות רישוי עבור העסק שלך. הדוח כולל דרישות מ-${Object.keys(requirementsData.summary.authorityCounts).length} רשויות שונות.`,
            sections: [
                {
                    title: 'סיכום הדרישות',
                    content: this.buildRequirementsSummaryMarkdown(requirementsData),
                    priority: 'high'
                },
                {
                    title: 'דרישות לפי רשות',
                    content: this.buildRequirementsByAuthorityMarkdown(requirementsData),
                    priority: 'high'
                },
                {
                    title: 'דרישות חובה',
                    content: this.buildMandatoryRequirementsMarkdown(requirementsData),
                    priority: 'high'
                }
            ],
            recommendations: this.extractRecommendations(requirementsData),
            personalizedInsights: this.extractPersonalizedInsights(businessProfile, requirementsData),
            totalEstimatedCost: 'דרוש חישוב מפורט',
            estimatedTimeframe: '2-6 חודשים (תלוי במורכבות)',
            criticalDeadlines: this.extractCriticalDeadlines(requirementsData),
            metadata: {
                generatedAt: new Date().toISOString(),
                businessProfile: businessProfile,
                requirementsSummary: requirementsData.summary,
                generatedBy: 'System Fallback'
            }
        };
    }

    /**
     * Get Hebrew business type name
     * @param {string} businessType - English business type
     * @returns {string} Hebrew business type
     */
    getBusinessTypeInHebrew(businessType) {
        const typeMap = {
            'restaurant': 'מסעדה',
            'cafe': 'בית קפה', 
            'fast_food': 'מזון מהיר',
            'delivery_only': 'משלוחים בלבד',
            'catering': 'קייטרינג',
            'bar_pub': 'בר/פאב'
        };
        return typeMap[businessType] || businessType;
    }

    /**
     * Build requirements summary in Markdown
     * @param {Object} requirementsData - Requirements data
     * @returns {string} Markdown content
     */
    buildRequirementsSummaryMarkdown(requirementsData) {
        return `
## סיכום כללי

- **סה"כ דרישות**: ${requirementsData.summary.totalRequirements}
- **דרישות חובה**: ${requirementsData.summary.mandatoryRequirements}
- **דרישות אופציונליות**: ${requirementsData.summary.optionalRequirements}
- **רשויות מעורבות**: ${Object.keys(requirementsData.summary.authorityCounts).join(', ')}

${requirementsData.businessMatch ? '✅ העסק שלך מתאים לקטגוריה שנבחרה' : '⚠️ ייתכן שיש צורך בהתאמות נוספות'}
`;
    }

    /**
     * Build requirements by authority in Markdown
     * @param {Object} requirementsData - Requirements data
     * @returns {string} Markdown content
     */
    buildRequirementsByAuthorityMarkdown(requirementsData) {
        let content = '';
        
        const byAuthority = {};
        
        // Flatten requirements from grouped structure
        const allRequirements = [];
        Object.keys(requirementsData.requirements).forEach(authority => {
            requirementsData.requirements[authority].forEach(req => {
                allRequirements.push({ ...req, authority });
            });
        });
        
        allRequirements.forEach(req => {
            if (!byAuthority[req.authority]) {
                byAuthority[req.authority] = [];
            }
            byAuthority[req.authority].push(req);
        });

        Object.keys(byAuthority).forEach(authority => {
            content += `\n### ${authority}\n\n`;
            byAuthority[authority].forEach(req => {
                const mandatory = req.mandatory ? '🔴 חובה' : '🟡 מותנה';
                content += `- **${req.title}** (${mandatory})\n`;
                if (req.description) {
                    content += `  - ${req.description}\n`;
                }
                if (req.conditions && req.conditions.length > 0) {
                    content += `  - תנאים: ${req.conditions.join(', ')}\n`;
                }
                content += '\n';
            });
        });

        return content;
    }

    /**
     * Build mandatory requirements in Markdown
     * @param {Object} requirementsData - Requirements data
     * @returns {string} Markdown content
     */
    buildMandatoryRequirementsMarkdown(requirementsData) {
        // Flatten requirements from grouped structure
        const allRequirements = [];
        Object.keys(requirementsData.requirements).forEach(authority => {
            requirementsData.requirements[authority].forEach(req => {
                allRequirements.push({ ...req, authority });
            });
        });
        
        const mandatory = allRequirements.filter(req => req.mandatory);
        
        let content = '## דרישות חובה - פעולות שחייבות לבצע\n\n';
        
        mandatory.forEach((req, index) => {
            content += `${index + 1}. **${req.title}**\n`;
            if (req.description) {
                content += `   - ${req.description}\n`;
            }
            if (req.authority) {
                content += `   - רשות: ${req.authority}\n`;
            }
            content += '\n';
        });

        return content;
    }

    /**
     * Extract recommendations from requirements data
     * @param {Object} requirementsData - Requirements data
     * @returns {Array<string>} Array of recommendations
     */
    extractRecommendations(requirementsData) {
        const recommendations = [];
        
        if (requirementsData.recommendations) {
            recommendations.push(...requirementsData.recommendations);
        }
        
        // Add general recommendations
        recommendations.push('התחל בתהליכי הרישוי מוקדם ככל הניתן - חלק מהתהליכים יכולים לקחת מספר חודשים');
        recommendations.push('שמור על קשר קבוע עם כל הרשויות הרלוונטיות לקבלת עדכונים');
        recommendations.push('הכן את כל המסמכים הנדרשים מראש כדי למהר את התהליך');
        
        // Flatten requirements from grouped structure to count mandatory requirements
        const allRequirements = [];
        Object.keys(requirementsData.requirements).forEach(authority => {
            requirementsData.requirements[authority].forEach(req => {
                allRequirements.push({ ...req, authority });
            });
        });
        
        const mandatoryCount = allRequirements.filter(req => req.mandatory).length;
        if (mandatoryCount > 5) {
            recommendations.push('בשל מספר הדרישות הגבוה, מומלץ לשקול העסקת יועץ רישוי');
        }

        return recommendations;
    }

    /**
     * Extract personalized insights based on business profile and requirements
     * @param {Object} businessProfile - Business profile
     * @param {Object} requirementsData - Requirements data
     * @returns {Array<string>} Array of personalized insights
     */
    extractPersonalizedInsights(businessProfile, requirementsData) {
        const insights = [];
        
        // Size-based insights
        if (businessProfile.floorArea > 100) {
            insights.push(`בשל שטח העסק הגדול (${businessProfile.floorArea} מ"ר), נדרש תשומת לב מיוחדת לבטיחות אש ונגישות`);
        }
        
        // Capacity-based insights  
        if (businessProfile.seatingCapacity > 50) {
            insights.push(`קיבולת גבוהה של ${businessProfile.seatingCapacity} מקומות מחייבת רישוי מורכב יותר ובקרות נוספות`);
        }
        
        // Activity-specific insights
        if (businessProfile.services?.alcoholService) {
            insights.push('מכירת אלכוהול מוסיפה שכבת רישוי נוספת עם המשטרה - יכול לקחת עד 3 חודשים');
        }
        
        if (businessProfile.kitchenFeatures?.meatHandling) {
            insights.push('הגשת בשר מחייבת הכשרות מיוחדות ובקרה קפדנית של משרד הבריאות');
        }
        
        if (businessProfile.operationalHours?.lateNightOperation) {
            insights.push('פעילות במשמרת לילה דורשת אישורים נוספים מהעירייה ועלולה להיות מוגבלת באזורים מסוימים');
        }

        return insights;
    }

    /**
     * Extract critical deadlines from requirements data
     * @param {Object} requirementsData - Requirements data
     * @returns {Array<string>} Array of critical deadlines
     */
    extractCriticalDeadlines(requirementsData) {
        const deadlines = [];
        
        // General business operation deadlines
        deadlines.push('רישיון עסק מהעירייה - חובה לפני פתיחה (2-4 שבועות)');
        deadlines.push('ביטוח חובה - חובה לפני פתיחה (מיידי)');
        
        // Flatten requirements to check for specific deadlines
        const allRequirements = [];
        Object.keys(requirementsData.requirements).forEach(authority => {
            requirementsData.requirements[authority].forEach(req => {
                allRequirements.push({ ...req, authority });
            });
        });
        
        // Check for alcohol-related deadlines
        const hasAlcoholRequirements = allRequirements.some(req => 
            req.title && req.title.includes('אלכוהול')
        );
        if (hasAlcoholRequirements) {
            deadlines.push('רישיון משקאות חריפים - להגיש 3 חודשים לפני פתיחה');
        }
        
        // Check for food-related deadlines
        const hasFoodRequirements = allRequirements.some(req => 
            req.title && (req.title.includes('מזון') || req.title.includes('מסעדה'))
        );
        if (hasFoodRequirements) {
            deadlines.push('רישיון עסק מזון מהמשרד לבריאות - 4-6 שבועות לפני פתיחה');
        }

        return deadlines;
    }
}

module.exports = OpenRouterService;