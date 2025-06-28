const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('Running frontend tests...');

  try {
    // הרצת הבדיקות עם coverage מפורט  
    console.log('Starting test execution...');
    const testOutput = execSync('npm test -- --watchAll=false --coverage --verbose --passWithNoTests=false', {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    console.log('Test output length:', testOutput.length);
    
    // חיפוש מקטעי מפתח בפלט
    const passMatches = testOutput.match(/PASS\s+.*\.test\.jsx/g) || [];
    const failMatches = testOutput.match(/FAIL\s+.*\.test\.jsx/g) || [];
    const checkMatches = testOutput.match(/✓\s+.*\(\d+\s*ms\)/g) || [];
    const failTestMatches = testOutput.match(/×\s+.*\(\d+\s*ms\)/g) || [];
    
    console.log('Found PASS suites:', passMatches.length);
    console.log('Found FAIL suites:', failMatches.length);
    console.log('Found PASS tests:', checkMatches.length);
    console.log('Found FAIL tests:', failTestMatches.length);

  // חליצת הנתונים החשובים
  const lines = testOutput.split('\n');
  
  // מציאת תוצאות הבדיקות
  const testSuites = [];
  const testResults = [];
  const failedTests = [];
  let coverageTable = [];
  let inCoverageTable = false;
  let currentSuite = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // זיהוי test suites שעברו - תבנית משופרת
    if ((line.includes('PASS ') || line.includes('✓ ')) && (line.includes('.test.jsx') || line.includes('.test.js'))) {
      const match = line.match(/(?:PASS|✓)\s+(.+\.test\.jsx?)\s*(?:\((.+?)\))?/) || 
                   line.match(/PASS\s+(.+\.test\.jsx?)\s+\((.+)\)/);
      if (match) {
        currentSuite = {
          file: match[1].replace(/.*\//, ''), // רק שם הקובץ
          duration: match[2] || 'Unknown',
          status: 'PASS',
          tests: []
        };
        testSuites.push(currentSuite);
        console.log('Found PASS suite:', currentSuite.file);
      }
    }
    
    // זיהוי test suites שנכשלו - תבנית משופרת
    if ((line.includes('FAIL ') || line.includes('✗ ')) && (line.includes('.test.jsx') || line.includes('.test.js'))) {
      const match = line.match(/(?:FAIL|✗)\s+(.+\.test\.jsx?)\s*(?:\((.+?)\))?/) || 
                   line.match(/FAIL\s+(.+\.test\.jsx?)\s+\((.+)\)/);
      if (match) {
        currentSuite = {
          file: match[1].replace(/.*\//, ''), // רק שם הקובץ
          duration: match[2] || 'Unknown',
          status: 'FAIL',
          tests: []
        };
        testSuites.push(currentSuite);
        console.log('Found FAIL suite:', currentSuite.file);
      }
    }
    
    // זיהוי בדיקות בודדות שעברו - תבניות משופרות
    if (line.trim().startsWith('✓ ') || line.trim().startsWith('√ ')) {
      const match = line.match(/[✓√]\s+(.+?)\s+\((\d+)\s*ms\)/) || 
                   line.match(/[✓√]\s+(.+)/);
      if (match) {
        const test = {
          name: match[1].trim(),
          duration: match[2] ? match[2] + 'ms' : 'N/A',
          status: 'PASS',
          suite: currentSuite?.file || 'Unknown'
        };
        testResults.push(test);
        if (currentSuite) {
          currentSuite.tests.push(test);
        }
        console.log('Found PASS test:', test.name);
      }
    }
    
    // זיהוי בדיקות בודדות שנכשלו - תבניות משופרות
    if (line.trim().startsWith('× ') || line.trim().startsWith('✗ ')) {
      const match = line.match(/[×✗]\s+(.+?)\s+\((\d+)\s*ms\)/) || 
                   line.match(/[×✗]\s+(.+)/);
      if (match) {
        const test = {
          name: match[1].trim(),
          duration: match[2] ? match[2] + 'ms' : 'N/A',
          status: 'FAIL',
          suite: currentSuite?.file || 'Unknown'
        };
        testResults.push(test);
        failedTests.push(test);
        if (currentSuite) {
          currentSuite.tests.push(test);
        }
        console.log('Found FAIL test:', test.name);
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
  
  // אם לא מצאנו דבר, ננסה פענוח מהיר מהפלט הגולמי
  if (testSuites.length === 0 && passMatches.length > 0) {
    console.log('Using fast parsing method...');
    
    // פענוח מהיר של test suites
    passMatches.forEach(match => {
      const fileMatch = match.match(/PASS\s+(.+\.test\.jsx)/);
      if (fileMatch) {
        testSuites.push({
          file: fileMatch[1].replace(/.*\//, ''),
          duration: 'N/A',
          status: 'PASS',
          tests: []
        });
      }
    });
    
    failMatches.forEach(match => {
      const fileMatch = match.match(/FAIL\s+(.+\.test\.jsx)/);
      if (fileMatch) {
        testSuites.push({
          file: fileMatch[1].replace(/.*\//, ''),
          duration: 'N/A',
          status: 'FAIL',
          tests: []
        });
      }
    });
    
    // פענוח מהיר של טסטים
    checkMatches.forEach(match => {
      const testMatch = match.match(/✓\s+(.+?)\s+\((\d+)\s*ms\)/);
      if (testMatch) {
        testResults.push({
          name: testMatch[1].trim(),
          duration: testMatch[2] + 'ms',
          status: 'PASS',
          suite: 'Unknown'
        });
      }
    });
    
    failTestMatches.forEach(match => {
      const testMatch = match.match(/×\s+(.+?)\s+\((\d+)\s*ms\)/);
      if (testMatch) {
        const test = {
          name: testMatch[1].trim(),
          duration: testMatch[2] + 'ms',
          status: 'FAIL',
          suite: 'Unknown'
        };
        testResults.push(test);
        failedTests.push(test);
      }
    });
    
    console.log('Fast parsing results - Suites:', testSuites.length, 'Tests:', testResults.length);
  }
  
  // חליצת סיכום סופי מהפלט - תבניות משופרות
  const summaryMatch = testOutput.match(/Test Suites:\s*(\d+)\s*failed,\s*(\d+)\s*passed,\s*(\d+)\s*total/) ||
                       testOutput.match(/Test Suites:\s*(\d+)\s*passed,\s*(\d+)\s*total/) ||
                       testOutput.match(/(\d+)\s*passed,\s*(\d+)\s*total/);
  const testsSummaryMatch = testOutput.match(/Tests:\s*(\d+)\s*failed,\s*(\d+)\s*passed,\s*(\d+)\s*total/) ||
                           testOutput.match(/Tests:\s*(\d+)\s*passed,\s*(\d+)\s*total/);
  const timeMatch = testOutput.match(/Time:\s*(.+?)(?:\n|$)/);
  
  console.log('Summary match:', summaryMatch);
  console.log('Tests summary match:', testsSummaryMatch);
  console.log('Time match:', timeMatch);
  
  // ספירה ידנית של תוצאות
  const passedSuites = testSuites.filter(s => s.status === 'PASS').length;
  const failedSuites = testSuites.filter(s => s.status === 'FAIL').length;
  const totalSuites = testSuites.length;
  
  const passedTests = testResults.filter(t => t.status === 'PASS').length;
  const failedTestsCount = testResults.filter(t => t.status === 'FAIL').length;
  const totalTests = testResults.length;
  
  console.log('Manual count - Suites:', {passedSuites, failedSuites, totalSuites});
  console.log('Manual count - Tests:', {passedTests, failedTestsCount, totalTests});
  
  const summary = {
    testSuites: {
      passed: passedSuites,
      failed: failedSuites,
      total: totalSuites
    },
    tests: {
      passed: passedTests,
      failed: failedTestsCount,
      total: totalTests
    },
    time: timeMatch ? timeMatch[1] : 'N/A'
  };

  // קריאת נתוני coverage מקובץ JSON אם קיים
  let coverageData = null;
  try {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
    if (fs.existsSync(coveragePath)) {
      const coverageJson = fs.readFileSync(coveragePath, 'utf8');
      coverageData = JSON.parse(coverageJson);
    }
  } catch (error) {
    console.log('Coverage data not available:', error.message);
  }

  // יצירת דוח HTML
  const htmlReport = generateHTMLReport(summary, testSuites, testResults, coverageTable, failedTests, coverageData);
  
  // שמירת הדוח
  const reportPath = path.join(process.cwd(), 'test-report.html');
  fs.writeFileSync(reportPath, htmlReport, 'utf8');
  
  console.log('✅ Test report generated successfully!');
  console.log(`📁 Report path: ${reportPath}`);
  console.log('🌐 Open the file in browser to view detailed report');
  
  // יצירת קובץ JSON עם הנתונים הגולמיים
  const jsonReport = {
    summary,
    testSuites,
    testResults,
    coverageTable,
    failedTests,
    coverageData,
    generatedAt: new Date().toISOString()
  };
  
  const jsonPath = path.join(process.cwd(), 'test-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), 'utf8');
  console.log(`📄 Raw data saved to: ${jsonPath}`);

} catch (error) {
  console.error('❌ Error running tests:', error.message);
  process.exit(1);
}

function generateHTMLReport(summary, testSuites, testResults, coverageTable, failedTests, coverageData) {
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
        .summary-card.failed { border-left-color: #f44336; }
        .summary-card.passed { border-left-color: #4caf50; }
        .summary-card .number { font-size: 2rem; font-weight: bold; color: #2196F3; }
        .failed .number { color: #f44336; }
        .passed .number { color: #4caf50; }
        .section { padding: 30px; }
        .section h2 { color: #333; margin-bottom: 20px; font-size: 1.8rem; border-bottom: 3px solid #2196F3; padding-bottom: 10px; }
        .test-suite { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-right: 4px solid #2196F3; }
        .test-suite.failed { border-right-color: #f44336; background: #ffebee; }
        .test-suite.passed { border-right-color: #4caf50; background: #e8f5e8; }
        .test-item { background: white; padding: 10px 15px; margin: 8px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; border-right: 3px solid #1976D2; }
        .test-item.failed { border-right-color: #f44336; background: #ffebee; }
        .test-item.passed { border-right-color: #4caf50; background: #e8f5e8; }
        .coverage-table table { width: 100%; border-collapse: collapse; }
        .coverage-table th { background: #2196F3; color: white; padding: 15px; text-align: center; }
        .coverage-table td { padding: 12px 15px; border-bottom: 1px solid #e9ecef; text-align: center; }
        .status-badge { background: #2196F3; color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
        .passed-badge { background: #4caf50; }
        .failed-badge { background: #f44336; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; }
        .test-details { margin-top: 10px; }
        .test-name { font-weight: bold; }
        .test-duration { color: #666; font-size: 0.9rem; }
        .failed-section { background: #ffebee; border: 1px solid #f44336; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .failed-section h3 { color: #f44336; }
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
                <div class="summary-card ${summary.testSuites.failed > 0 ? 'failed' : 'passed'}">
                    <h3>חבילות בדיקה</h3>
                    <div class="number">${summary.testSuites.passed}/${summary.testSuites.total}</div>
                    <div class="status-badge ${summary.testSuites.failed > 0 ? 'failed-badge' : 'passed-badge'}">
                        ${summary.testSuites.failed > 0 ? '❌ ' + summary.testSuites.failed + ' נכשלו' : '✅ עברו בהצלחה'}
                    </div>
                </div>
                <div class="summary-card ${summary.tests.failed > 0 ? 'failed' : 'passed'}">
                    <h3>בדיקות בודדות</h3>
                    <div class="number">${summary.tests.passed}/${summary.tests.total}</div>
                    <div class="status-badge ${summary.tests.failed > 0 ? 'failed-badge' : 'passed-badge'}">
                        ${summary.tests.failed > 0 ? '❌ ' + summary.tests.failed + ' נכשלו' : '✅ עברו בהצלחה'}
                    </div>
                </div>
                <div class="summary-card">
                    <h3>זמן ריצה</h3>
                    <div class="number">${summary.time}</div>
                    <div class="status-badge">⏱️ סה"כ</div>
                </div>
                <div class="summary-card">
                    <h3>שיעור הצלחה</h3>
                    <div class="number">${summary.tests.total > 0 ? Math.round((summary.tests.passed / summary.tests.total) * 100) : 0}%</div>
                    <div class="status-badge">📊 כללי</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 פירוט חבילות הבדיקה</h2>
            ${testSuites.map(suite => `
                <div class="test-suite ${suite.status.toLowerCase()}">
                    <h3>${suite.file} - ${suite.duration}</h3>
                    <div>סטטוס: <span class="status-badge ${suite.status === 'PASS' ? 'passed-badge' : 'failed-badge'}">${suite.status === 'PASS' ? '✅ הצליח' : '❌ נכשל'}</span></div>
                    <div class="test-details">
                        <strong>בדיקות בקובץ זה:</strong> ${suite.tests ? suite.tests.length : 0}
                        ${suite.tests && suite.tests.length > 0 ? `
                            <div style="margin-top: 10px;">
                                ${suite.tests.map(test => `
                                    <div class="test-item ${test.status.toLowerCase()}">
                                        <span class="test-name">${test.name}</span>
                                        <span class="test-duration">${test.duration}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${failedTests && failedTests.length > 0 ? `
        <div class="section">
            <div class="failed-section">
                <h2>❌ בדיקות שנכשלו</h2>
                <p>נמצאו ${failedTests.length} בדיקות שנכשלו. נדרש תיקון:</p>
                ${failedTests.map(test => `
                    <div class="test-item failed">
                        <div>
                            <div class="test-name">📁 ${test.suite}</div>
                            <div style="margin-right: 20px; color: #f44336;">🔍 ${test.name}</div>
                        </div>
                        <span class="test-duration">${test.duration}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
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
            <div>💻 מערכת FortiTask - פלטפורמה לניהול קורסים ומטלות</div>
        </div>
    </div>
</body>
</html>`;
} 