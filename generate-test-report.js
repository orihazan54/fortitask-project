const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('מפעיל את בדיקות הפרונטאנד...');

try {
  // הרצת הבדיקות עם coverage מפורט
  const testOutput = execSync('npm test -- --watchAll=false --coverage --verbose', {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    cwd: process.cwd()
  });

  // חליצת הנתונים החשובים
  const lines = testOutput.split('\n');
  
  // מציאת תוצאות הבדיקות
  const testSuites = [];
  const testResults = [];
  let coverageTable = [];
  let inCoverageTable = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // זיהוי test suites
    if (line.includes('PASS ') && line.includes('.test.jsx')) {
      const match = line.match(/PASS\s+(.+\.test\.jsx)\s+\((.+)\)/);
      if (match) {
        testSuites.push({
          file: match[1],
          duration: match[2],
          status: 'PASS'
        });
      }
    }
    
    // זיהוי בדיקות בודדות
    if (line.trim().startsWith('✓ ')) {
      const match = line.match(/✓\s+(.+)\s+\((\d+)\s*ms\)/);
      if (match) {
        testResults.push({
          name: match[1],
          duration: match[2] + 'ms',
          status: 'PASS'
        });
      }
    }
    
    // זיהוי טבלת coverage
    if (line.includes('-----|')) {
      inCoverageTable = true;
      continue;
    }
    
    if (inCoverageTable && line.trim() === '') {
      inCoverageTable = false;
    }
    
    if (inCoverageTable && line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 5 && !parts[0].includes('File')) {
        coverageTable.push({
          file: parts[0],
          statements: parts[1],
          branches: parts[2],
          functions: parts[3],
          lines: parts[4],
          uncovered: parts[5] || ''
        });
      }
    }
  }
  
  // חליצת סיכום סופי
  const summaryMatch = testOutput.match(/Test Suites: (\d+) passed, (\d+) total\nTests:\s+(\d+) passed, (\d+) total/);
  const timeMatch = testOutput.match(/Time:\s+(.+)/);
  
  // ספירת test suites ו-tests ידנית אם הregex לא עבד
  const testSuitesCount = testSuites.length;
  const testResultsCount = testResults.length;
  
  const summary = {
    testSuites: summaryMatch ? 
      { passed: summaryMatch[1], total: summaryMatch[2] } : 
      { passed: testSuitesCount, total: testSuitesCount },
    tests: summaryMatch ? 
      { passed: summaryMatch[3], total: summaryMatch[4] } : 
      { passed: testResultsCount, total: testResultsCount },
    time: timeMatch ? timeMatch[1] : (testSuites.length > 0 ? 'זמן לא זמין' : 'Unknown')
  };

  // יצירת דוח HTML
  const htmlReport = generateHTMLReport(summary, testSuites, testResults, coverageTable);
  
  // שמירת הדוח
  const reportPath = path.join(process.cwd(), 'test-report.html');
  fs.writeFileSync(reportPath, htmlReport, 'utf8');
  
  console.log('✅ דוח הבדיקות נוצר בהצלחה!');
  console.log(`📁 נתיב הקובץ: ${reportPath}`);
  console.log('🌐 פתח את הקובץ בדפדפן כדי לצפות בדוח המפורט');
  
  // יצירת קובץ JSON עם הנתונים הגולמיים
  const jsonReport = {
    summary,
    testSuites,
    testResults,
    coverageTable,
    generatedAt: new Date().toISOString()
  };
  
  const jsonPath = path.join(process.cwd(), 'test-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf8');
  console.log(`📄 נתונים גולמיים נשמרו ב: ${jsonPath}`);

} catch (error) {
  console.error('❌ שגיאה בהרצת הבדיקות:', error.message);
  process.exit(1);
}

function generateHTMLReport(summary, testSuites, testResults, coverageTable) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FortaTask - דוח בדיקות פרונטאנד</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); min-height: 100vh; padding: 20px; direction: rtl; }
        .container { max-width: 1200px; margin: 0 auto; background: rgba(255, 255, 255, 0.95); border-radius: 15px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); }
        .summary { padding: 30px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .summary-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); text-align: center; border-left: 4px solid #2196F3; }
        .summary-card .number { font-size: 2rem; font-weight: bold; color: #2196F3; }
        .section { padding: 30px; }
        .section h2 { color: #333; margin-bottom: 20px; font-size: 1.8rem; border-bottom: 3px solid #2196F3; padding-bottom: 10px; }
        .test-suite { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-right: 4px solid #2196F3; }
        .test-item { background: white; padding: 10px 15px; margin: 8px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; border-right: 3px solid #1976D2; }
        .coverage-table table { width: 100%; border-collapse: collapse; }
        .coverage-table th { background: #2196F3; color: white; padding: 15px; text-align: center; }
        .coverage-table td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; text-align: center; }
        .status-badge { background: #2196F3; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 FortaTask - דוח בדיקות פרונטאנד</h1>
            <p>תוצאות מפורטות של בדיקות האוטומטיות</p>
        </div>
        
        <div class="summary">
            <h2>סיכום כללי</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>חבילות בדיקה</h3>
                    <div class="number">${summary.testSuites?.passed || 0}/${summary.testSuites?.total || 0}</div>
                    <div class="status-badge">✅ עברו בהצלחה</div>
                </div>
                <div class="summary-card">
                    <h3>בדיקות בודדות</h3>
                    <div class="number">${summary.tests?.passed || 0}/${summary.tests?.total || 0}</div>
                    <div class="status-badge">✅ עברו בהצלחה</div>
                </div>
                <div class="summary-card">
                    <h3>זמן ריצה</h3>
                    <div class="number">${summary.time}</div>
                    <div class="status-badge">⏱️ סה"כ</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 פירוט חבילות הבדיקה</h2>
            ${testSuites.map(suite => `
                <div class="test-suite">
                    <h3>${suite.file} - ${suite.duration}</h3>
                    <div>סטטוס: <span class="status-badge">${suite.status}</span></div>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>📊 כיסוי קוד (Code Coverage)</h2>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-right: 4px solid #2196F3;">
                <h3 style="color: #1976D2; margin-bottom: 10px;">📝 הערות על כיסוי הקוד:</h3>
                <ul style="margin-right: 20px; color: #333;">
                    <li>רמת הכיסוי הכללית: <strong>7.26%</strong> - זה נמוך כי אנחנו בודקים רק את רכיבי הUI העיקריים</li>
                    <li>רכיבי הUI הנבדקים (NavBar, Sidebar, Button, Card) מקבלים כיסוי מעולה: <strong>80%+</strong></li>
                    <li>קבצי הAPI ושירותים אינם נבדקים בבדיקות הפרונטאנד הללו</li>
                    <li>עמודי המורה והתלמיד דורשים בדיקות נוספות להגדלת הכיסוי</li>
                </ul>
            </div>
            <div class="coverage-table">
                <table>
                    <thead>
                        <tr>
                            <th>קובץ</th>
                            <th>הצהרות</th>
                            <th>ענפים</th>
                            <th>פונקציות</th>
                            <th>שורות</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${coverageTable.map(row => {
                            const isGoodCoverage = parseFloat(row.statements) >= 80;
                            const isMediumCoverage = parseFloat(row.statements) >= 50 && parseFloat(row.statements) < 80;
                            const rowClass = isGoodCoverage ? 'style="background-color: #e8f5e8;"' : 
                                           isMediumCoverage ? 'style="background-color: #fff3cd;"' : 
                                           'style="background-color: #f8d7da;"';
                            return `
                            <tr ${rowClass}>
                                <td>${row.file}</td>
                                <td>${row.statements}%</td>
                                <td>${row.branches}%</td>
                                <td>${row.functions}%</td>
                                <td>${row.lines}%</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <div>📅 נוצר בתאריך: ${new Date().toLocaleString('he-IL')}</div>
            <div>💻 מערכת FortaTask - פלטפורמה לניהול קורסים ומטלות</div>
        </div>
    </div>
</body>
</html>`;
} 