import type { GeneratedReport } from '../services/api';

interface ReportProps {
  report: GeneratedReport;
  onStartOver: () => void;
}

export default function Report({ report, onStartOver }: ReportProps) {

  const renderMarkdownContent = (content: string) => {
    // Simple markdown rendering for basic elements
    return content
      .replace(/## (.*)/g, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/- (.*)/g, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '')
      .join('');
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>{report.title}</h1>
        <p className="report-summary">{report.summary}</p>
        
        <div className="report-meta">
          <div className="meta-item">
            <span className="meta-label">עלות צפויה:</span>
            <span className="meta-value">{report.totalEstimatedCost}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">זמן עבודה:</span>
            <span className="meta-value">{report.estimatedTimeframe}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">דו"ח נוצר בתאריך:</span>
            <span className="meta-value">{new Date(report.metadata.generatedAt).toLocaleDateString('he-IL')}</span>
          </div>
        </div>
      </div>

      <div className="report-content">
        {report.sections.map((section, index) => (
          <div key={index} className={`report-section priority-${section.priority}`}>
            <h2 className="section-title">
              {getPriorityIcon(section.priority)} {section.title}
            </h2>
            <div 
              className="section-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdownContent(section.content) }}
            />
          </div>
        ))}

        {report.recommendations && report.recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2>💡 המלצות חשובות</h2>
            <ul className="recommendations-list">
              {report.recommendations.map((recommendation, index) => (
                <li key={index} className="recommendation-item">
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="report-actions">
        <button onClick={onStartOver} className="start-over-button">
          התחל מחדש
        </button>
        
        <button 
          onClick={() => window.print()} 
          className="print-button"
        >
          הדפס דוח
        </button>
      </div>

    </div>
  );
}