const axios = require('axios');

/**
 * OpenRouter API Service for generating business licensing reports
 * Uses OpenRouter API to generate clear, user-friendly reports from licensing requirements
 */
class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseUrl = 'https://openrouter.ai/api/v1';
        this.model = 'anthropic/claude-3.5-sonnet';
        
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
            const prompt = this.buildReportPrompt(requirementsData, businessProfile);
            
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'אתה מומחה ברישוי עסקים בישראל. תפקידך להפוך מידע טכני מורכב על דרישות רישוי לדוח ברור ומובן עבור בעלי עסקים. הדוח צריך להיות בעברית, מקצועי אך נגיש.'
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
                    'HTTP-Referer': 'https://localhost:3001',
                    'X-Title': 'Business Licensing Report Generator'
                }
            });

            const aiResponse = response.data.choices[0].message.content;
            
            return this.parseAIResponse(aiResponse, requirementsData, businessProfile);
            
        } catch (error) {
            console.error('Error generating report with OpenRouter:', error.message);
            
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
צור דוח מקיף ונגיש על דרישות הרישוי עבור העסק הבא:

**פרטי העסק:**
- סוג העסק: ${businessProfile.businessType}
- קיבולת ישיבה: ${businessProfile.seatingCapacity} מקומות
- שטח העסק: ${businessProfile.floorArea} מ"ר
- מוכר אלכוהול: ${businessProfile.servesAlcohol ? 'כן' : 'לא'}
- מוכר בשר: ${businessProfile.servesMeat ? 'כן' : 'לא'}
- מוכן מזון מראש: ${businessProfile.preparesFood ? 'כן' : 'לא'}
- פתוח עד מאוחר: ${businessProfile.lateHours ? 'כן' : 'לא'}

**דרישות הרישוי שנמצאו:**
${JSON.stringify(requirementsData, null, 2)}

אנא צור דוח מובנה הכולל:

1. **סיכום ביצוע** - הסבר קצר על המשמעות של הדרישות עבור העסק הזה
2. **דרישות חובה** - רשימה מסודרת של כל הדרישות החובה, מחולקת לפי רשות:
   - עירייה (רישיון עסק, ביטוח וכו')
   - משטרה (רישיון אלכוהול, אירועים)  
   - משרד הבריאות (רישיון מזון, הכשרות)
   - מכבי האש (בטיחות אש)
3. **עלויות צפויות** - הערכת עלויות לכל דרישה (אם ידוע)
4. **לוחות זמנים** - כמה זמן לוקח כל תהליך
5. **שלבים מומלצים** - סדר מומלץ לביצוע הדרישות
6. **טיפים וערות** - מידע חשוב נוסף והמלצות

הדוח צריך להיות:
- בעברית ברורה ופשוטה
- מעשי ופרקטי לבעל העסק
- מסודר בפורמט Markdown
- כולל כל המידע הרלוונטי מבלי להתעלם מפרטים חשובים

תשובה צריכה להיות בפורמט JSON עם המבנה הבא:
{
  "title": "כותרת הדוח",
  "summary": "סיכום קצר",
  "sections": [
    {
      "title": "כותרת הסעיף",
      "content": "תוכן הסעיף בmarkdown",
      "priority": "high|medium|low"
    }
  ],
  "recommendations": ["המלצה 1", "המלצה 2"],
  "totalEstimatedCost": "הערכת עלות כוללת",
  "estimatedTimeframe": "זמן הערכה כולל"
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
                
                // Add metadata
                parsedReport.metadata = {
                    generatedAt: new Date().toISOString(),
                    businessProfile: businessProfile,
                    requirementsSummary: requirementsData.summary,
                    generatedBy: 'OpenRouter AI'
                };
                
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
            totalEstimatedCost: 'לא זמין',
            estimatedTimeframe: 'לא זמין',
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
            summary: `נמצאו ${requirementsData.summary.totalRequirements} דרישות רישוי עבור העסק שלך. הדוח כולל דרישות מ-${requirementsData.summary.authoritiesCovered.length} רשויות שונות.`,
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
            totalEstimatedCost: 'דרוש חישוב מפורט',
            estimatedTimeframe: '2-6 חודשים (תלוי במורכבות)',
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
- **דרישות מותנות**: ${requirementsData.summary.conditionalRequirements}
- **רשויות מעורבות**: ${requirementsData.summary.authoritiesCovered.join(', ')}

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
        requirementsData.applicableRequirements.forEach(req => {
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
        const mandatory = requirementsData.applicableRequirements.filter(req => req.mandatory);
        
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
        
        const mandatoryCount = requirementsData.applicableRequirements.filter(req => req.mandatory).length;
        if (mandatoryCount > 5) {
            recommendations.push('בשל מספר הדרישות הגבוה, מומלץ לשקול העסקת יועץ רישוי');
        }

        return recommendations;
    }
}

module.exports = OpenRouterService;