#!/usr/bin/env node

const fs = require('fs');

function removeSecurityBlocks(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Split content into lines for precise editing
  const lines = content.split('\n');
  const cleanedLines = [];
  let skipUntilClosingBrace = false;
  let braceCount = 0;
  let lineIndex = 0;
  
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    
    // Check if this line starts a security validation block
    if (line.includes('const securityResult = await unifiedSecurityService.validateAction')) {
      // Skip this line and start tracking braces
      skipUntilClosingBrace = true;
      braceCount = 0;
      lineIndex++;
      continue;
    }
    
    if (skipUntilClosingBrace) {
      // Count braces to know when the block ends
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      // Look for the if (!securityResult.allowed) block and skip it entirely
      if (line.includes('if (!securityResult.allowed)')) {
        // Skip until we find the closing brace of this if block
        let ifBraceCount = 0;
        while (lineIndex < lines.length) {
          const currentLine = lines[lineIndex];
          ifBraceCount += (currentLine.match(/\{/g) || []).length;
          ifBraceCount -= (currentLine.match(/\}/g) || []).length;
          lineIndex++;
          
          if (ifBraceCount <= 0) {
            // We've reached the end of the if block
            break;
          }
        }
        
        // Reset skip flag
        skipUntilClosingBrace = false;
        continue;
      }
      
      lineIndex++;
      continue;
    }
    
    cleanedLines.push(line);
    lineIndex++;
  }
  
  content = cleanedLines.join('\n');
  
  // Fix step numbering
  content = content.replace(/\/\/\s*(\d+)\.\s*Make API request/g, (match, stepNum) => {
    const newStepNum = Math.max(1, parseInt(stepNum) - 1);
    return `// ${newStepNum}. Make API request`;
  });
  
  content = content.replace(/\/\/\s*(\d+)\.\s*Log sanitized request/g, (match, stepNum) => {
    const newStepNum = Math.max(1, parseInt(stepNum) - 1);
    return `// ${newStepNum}. Log sanitized request`;
  });
  
  // Clean up extra blank lines
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed ${filePath}`);
}

// Fix the ticketService
removeSecurityBlocks('src/services/ticketService.ts');

console.log('🎉 TicketService fixed!');