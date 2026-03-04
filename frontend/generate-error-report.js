/**
 * Script to generate a detailed error report from Playwright test results
 * This reads the test-results directories and generates a comprehensive error summary
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_RESULTS_DIR = path.join(__dirname, 'test-results');
const OUTPUT_FILE = path.join(__dirname, 'e2e-results', 'error-report.md');

function getAllTestResults() {
  if (!fs.existsSync(TEST_RESULTS_DIR)) {
    console.log('No test-results directory found');
    return [];
  }

  const entries = fs.readdirSync(TEST_RESULTS_DIR, { withFileTypes: true });
  const testDirs = entries
    .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
    .map(dirent => path.join(TEST_RESULTS_DIR, dirent.name));

  const results = [];

  for (const testDir of testDirs) {
    const dirName = path.basename(testDir);
    
    // Try to find error-context.md or trace.zip to identify failed tests
    const files = fs.readdirSync(testDir);
    const hasErrorContext = files.some(f => f === 'error-context.md');
    const hasTraceOrScreenshot = files.some(f => f.endsWith('.png') || f.endsWith('.webm') || f.endsWith('.zip'));
    
    if (!hasErrorContext && !hasTraceOrScreenshot) {
      continue; // Skip directories without failures
    }
    
    // Extract browser from directory name
    let browser = 'unknown';
    if (dirName.includes('-chromium')) browser = 'chromium';
    else if (dirName.includes('-firefox')) browser = 'firefox';
    else if (dirName.includes('-webkit')) browser = 'webkit';
    
    // Read error context if exists
    let errorContext = '';
    const errorContextPath = path.join(testDir, 'error-context.md');
    if (fs.existsSync(errorContextPath)) {
      errorContext = fs.readFileSync(errorContextPath, 'utf-8');
    }
    
    // Find screenshots
    const screenshots = files
      .filter(file => file.endsWith('.png'))
      .map(file => path.relative(__dirname, path.join(testDir, file)).replace(/\\/g, '/'));
    
    // Find videos
    const videos = files
      .filter(file => file.endsWith('.webm'))
      .map(file => path.relative(__dirname, path.join(testDir, file)).replace(/\\/g, '/'));
    
    // Extract test name from directory (remove browser suffix)
    let testName = dirName
      .replace(/-chromium$/, '')
      .replace(/-firefox$/, '')
      .replace(/-webkit$/, '')
      .replace(/-/g, ' ');

    results.push({
      testName,
      browser,
      errorContext,
      screenshots,
      videos,
      testDir: path.relative(__dirname, testDir).replace(/\\/g, '/')
    });
  }

  return results;
}

function generateErrorReport(results) {
  let report = '# ⚠️ Informe de Errores - Tests E2E Playwright\n\n';
  report += `**📅 Fecha de Generación:** ${new Date().toLocaleString('es-ES', {
    dateStyle: 'full',
    timeStyle: 'long'
  })}\n\n`;
  report += `**❌ Total de Tests Fallidos:** ${results.length}\n\n`;
  report += `**🧪 Tests Únicos con Fallos:** ${new Set(results.map(r => r.testName)).size}\n\n`;
  report += '---\n\n';
  report += '## 📋 Tabla de Contenidos\n\n';
  
  // Generate table of contents
  const groupedByTest = {};
  for (const result of results) {
    if (!groupedByTest[result.testName]) {
      groupedByTest[result.testName] = [];
    }
    groupedByTest[result.testName].push(result);
  }
  
  let testNumber = 1;
  for (const testName of Object.keys(groupedByTest)) {
    const sanitizedName = testName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    report += `${testNumber}. [${testName}](#${testNumber}-${sanitizedName})\n`;
    testNumber++;
  }
  report += '\n---\n\n';

  // Generate detailed reports
  testNumber = 1;
  for (const [testName, browsers] of Object.entries(groupedByTest)) {
    const sanitizedName = testName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    report += `## ${testNumber}. ${testName}\n\n`;
    report += `**🌐 Navegadores Afectados:** ${browsers.map(b => `\`${b.browser}\``).join(', ')}\n\n`;
    report += `**📊 Ocurrencias:** ${browsers.length}\n\n`;
    
    for (const result of browsers) {
      const browserEmoji = {
        chromium: '🔵',
        firefox: '🟠',
        webkit: '⚪'
      }[result.browser] || '🔘';
      
      report += `### ${browserEmoji} ${result.browser.toUpperCase()}\n\n`;
      report += `**📁 Directorio:** \`${result.testDir}\`\n\n`;
      
      if (result.errorContext) {
        report += '#### 🔴 Error Context\n\n';
        report += '```\n';
        report += result.errorContext.trim();
        report += '\n```\n\n';
      }
      
      if (result.screenshots.length > 0) {
        report += '#### 📸 Capturas de Pantalla\n\n';
        for (const screenshot of result.screenshots) {
          report += `- \`${screenshot}\`\n`;
        }
        report += '\n';
      }
      
      if (result.videos.length > 0) {
        report += '#### 🎥 Videos de Reproducción\n\n';
        for (const video of result.videos) {
          report += `- \`${video}\`\n`;
        }
        report += '\n';
      }
      
      report += '\n';
    }
    
    report += '---\n\n';
    testNumber++;
  }

  // Add summary statistics
  report += '## 📊 Resumen Estadístico\n\n';
  
  const browserCounts = results.reduce((acc, r) => {
    acc[r.browser] = (acc[r.browser] || 0) + 1;
    return acc;
  }, {});

  report += '### Distribución por Navegador\n\n';
  report += '| Navegador | Fallos | Porcentaje |\n';
  report += '|-----------|--------|------------|\n';
  for (const [browser, count] of Object.entries(browserCounts).sort((a, b) => b[1] - a[1])) {
    const percentage = ((count / results.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / results.length * 20));
    report += `| ${browser} | ${count} | ${percentage}% ${bar} |\n`;
  }
  report += '\n';

  // Group errors by module
  const moduleCounts = {};
  for (const [testName] of Object.entries(groupedByTest)) {
    // Try to extract module name from test name
    const patterns = [
      /Gestión de (.+?) ›/,
      /(.+?) ›/,
      /(.+?) -/,
    ];
    
    let module = 'Otros';
    for (const pattern of patterns) {
      const match = testName.match(pattern);
      if (match) {
        module = match[1].trim();
        break;
      }
    }
    
    moduleCounts[module] = (moduleCounts[module] || 0) + 1;
  }

  report += '### Distribución por Módulo\n\n';
  report += '| Módulo | Tests Fallidos | Porcentaje |\n';
  report += '|--------|----------------|------------|\n';
  const totalUniqueTests = new Set(results.map(r => r.testName)).size;
  for (const [module, count] of Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])) {
    const percentage = ((count / totalUniqueTests) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / totalUniqueTests * 20));
    report += `| ${module} | ${count} | ${percentage}% ${bar} |\n`;
  }
  report += '\n';
  
  // Common error patterns
  report += '### 🔍 Patrones de Error Comunes\n\n';
  const errorPatterns = {};
  for (const result of results) {
    if (!result.errorContext) continue;
    
    // Extract error type
    const patterns = [
      { pattern: /expect\(received\)\.toBeTruthy\(\)/, name: 'Assertion toBeTruthy Failed' },
      { pattern: /TimeoutError/, name: 'Timeout Error' },
      { pattern: /expect\(received\)\.toBe\(expected\)/, name: 'Assertion toBe Failed' },
      { pattern: /expect\(received\)\.toContain\(expected\)/, name: 'Assertion toContain Failed' },
      { pattern: /locator\.click/, name: 'Click Failed' },
      { pattern: /locator\.fill/, name: 'Fill Failed' },
    ];
    
    for (const { pattern, name } of patterns) {
      if (pattern.test(result.errorContext)) {
        errorPatterns[name] = (errorPatterns[name] || 0) + 1;
        break;
      }
    }
  }
  
  if (Object.keys(errorPatterns).length > 0) {
    for (const [pattern, count] of Object.entries(errorPatterns).sort((a, b) => b[1] - a[1])) {
      report += `- **${pattern}:** ${count} ocurrencias\n`;
    }
  } else {
    report += '*No se identificaron patrones de error específicos*\n';
  }
  report += '\n';

  report += '---\n\n';
  report += '*Este informe fue generado automáticamente a partir de los resultados de Playwright*\n';

  return report;
}

try {
  console.log('🔍 Buscando resultados de tests fallidos...');
  const results = getAllTestResults();
  
  if (results.length === 0) {
    console.log('✅ No se encontraron tests fallidos');
    const report = '# ✅ Informe de Tests E2E - Sin Errores\n\n' +
                   `**Fecha:** ${new Date().toLocaleString('es-ES')}\n\n` +
                   'Todos los tests ejecutados pasaron exitosamente.\n';
    fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');
    console.log(`\nInforme generado: ${OUTPUT_FILE}`);
    process.exit(0);
  }
  
  console.log(`❌ Se encontraron ${results.length} fallos en ${new Set(results.map(r => r.testName)).size} tests únicos`);
  console.log(`📝 Generando informe detallado...`);
  
  const report = generateErrorReport(results);
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');
  console.log(`\n✅ Informe generado exitosamente: ${OUTPUT_FILE}`);
  console.log(`\n📊 Resumen:`);
  console.log(`   - Total de fallos: ${results.length}`);
  console.log(`   - Tests únicos fallidos: ${new Set(results.map(r => r.testName)).size}`);
  console.log(`   - Navegadores afectados: ${Object.keys(results.reduce((acc, r) => { acc[r.browser] = true; return acc; }, {})).join(', ')}`);
} catch (error) {
  console.error('❌ Error generando el informe:', error.message);
  console.error(error.stack);
  process.exit(1);
}
