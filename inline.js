import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

function inlineAssets() {
  const distDir = path.resolve('dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('dist/index.html not found! Run npm run build first.');
    return;
  }
  
  let html = fs.readFileSync(indexHtmlPath, 'utf-8');
  
  // Find css files (e.g. href="/assets/index-XXXX.css")
  const cssRegex = /<link\s+[^>]*rel="stylesheet"\s+[^>]*href="\/([^"]+)"[^>]*>/gi;
  html = html.replace(cssRegex, (match, cssPath) => {
    const fullCssPath = path.join(distDir, cssPath);
    if (fs.existsSync(fullCssPath)) {
      const cssContent = fs.readFileSync(fullCssPath, 'utf-8');
      return `<style>${cssContent}</style>`;
    }
    return match;
  });
  
  // Find script files (e.g. src="/assets/index-XXXX.js")
  const jsRegex = /<script\s+[^>]*type="module"\s+[^>]*src="\/([^"]+)"[^>]*><\/script>/gi;
  html = html.replace(jsRegex, (match, jsPath) => {
    const fullJsPath = path.join(distDir, jsPath);
    if (fs.existsSync(fullJsPath)) {
      let jsContent = fs.readFileSync(fullJsPath, 'utf-8');
      // Replace absolute asset paths inside JS with relative paths
      jsContent = jsContent.replace(/"\/assets\/([^"]+)"/g, '"./assets/$1"');
      return `<script type="module">${jsContent}</script>`;
    }
    return match;
  });

  // Replace absolute asset/manifest paths inside index.html with relative paths
  html = html.replace(/"\/assets\/([^"]+)"/g, '"./assets/$1"');
  html = html.replace(/"\/manifest\.json"/g, '"./manifest.json"');

  const outputPath = path.join(distDir, 'zarsa-offline.html');
  fs.writeFileSync(outputPath, html, 'utf-8');
  
  // Also copy to public directory so it gets compiled inside dist/ next build
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  fs.writeFileSync(path.join(publicDir, 'zarsa-offline.html'), html, 'utf-8');
  
  console.log('Successfully created single self-contained HTML file: dist/zarsa-offline.html and public/zarsa-offline.html');

  // Generate offline ZIP file using adm-zip
  try {
    console.log('Packaging offline files into ZIP...');
    const zip = new AdmZip();
    zip.addLocalFile(outputPath); // dist/zarsa-offline.html
    zip.writeZip(path.join(distDir, 'zarsa-offline.zip'));
    fs.copyFileSync(path.join(distDir, 'zarsa-offline.zip'), path.join(publicDir, 'zarsa-offline.zip'));
    console.log('Successfully created offline ZIP file: dist/zarsa-offline.zip and public/zarsa-offline.zip');
  } catch (err) {
    console.error('Failed to package ZIP with adm-zip:', err.message);
  }
}

inlineAssets();
