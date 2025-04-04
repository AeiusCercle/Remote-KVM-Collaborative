/**
 * Improved Conversation Logger
 * 
 * This version allows selecting the output directory
 * and handles external drive permissions better
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get input file path from command line arguments
const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Please provide an input file path');
  process.exit(1);
}

// Function to process the file
function processFile(inputFile, outputPath) {
  try {
    // Ensure the input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`Input file not found: ${inputFile}`);
      process.exit(1);
    }

    // Read the conversation text
    const conversationText = fs.readFileSync(inputFile, 'utf8');

    // Split the conversation into human and assistant parts
    // This pattern looks for lines starting with "Human:" or "Claude:"
    const messagePattern = /^(Human|Claude):\s*([\s\S]*?)(?=\n(?:Human|Claude):|$)/gm;
    const messages = [];
    let match;

    while ((match = messagePattern.exec(conversationText)) !== null) {
      const [, role, content] = match;
      messages.push({
        role: role.toLowerCase(),
        content: content.trim()
      });
    }

    // If no messages were found, try an alternative pattern
    if (messages.length === 0) {
      console.log("No standard format messages found. Trying alternative parsing...");
      
      // Split by double newlines to separate messages
      const paragraphs = conversationText.split(/\n\n+/);
      let isHuman = true; // Assume alternating messages starting with human
      
      paragraphs.forEach(para => {
        if (para.trim()) {
          messages.push({
            role: isHuman ? 'human' : 'assistant',
            content: para.trim()
          });
          isHuman = !isHuman; // Toggle between human and assistant
        }
      });
    }

    if (messages.length === 0) {
      console.log("Could not parse any messages from the file. Please check format.");
      process.exit(1);
    }

    // Generate HTML
    const title = `Conversation Log - ${path.basename(inputFile, path.extname(inputFile))}`;
    let html = `<!DOCTYPE html>
<html data-theme="light">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        :root {
            --primary-color: #3a86ff;
            --secondary-color: #8338ec;
            --light-bg: #f8f9fa;
            --dark-bg: #212529;
            --text-dark: #343a40;
            --text-light: #f8f9fa;
            --border-color: #dee2e6;
        }
        
        [data-theme="dark"] {
            --light-bg: #212529;
            --dark-bg: #111418;
            --text-dark: #f8f9fa;
            --text-light: #343a40;
            --border-color: #495057;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text-dark);
            background-color: var(--light-bg);
            padding: 20px;
            transition: all 0.3s ease;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .human, .assistant {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        
        .human {
            background-color: #e9f5ff;
        }
        
        [data-theme="dark"] .human {
            background-color: #1a2837;
        }
        
        .assistant {
            background-color: #f0f0f0;
        }
        
        [data-theme="dark"] .assistant {
            background-color: #2a2a2a;
        }
        
        pre {
            background-color: #f7f7f7;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 10px 0;
        }
        
        [data-theme="dark"] pre {
            background-color: #333;
        }
        
        code {
            font-family: 'Courier New', Courier, monospace;
        }
        
        .theme-switch-wrapper {
            display: flex;
            align-items: center;
            position: absolute;
            top: 20px;
            right: 20px;
        }
        
        .theme-switch {
            display: inline-block;
            height: 24px;
            position: relative;
            width: 44px;
        }
        
        .theme-switch input {
            display: none;
        }
        
        .slider {
            background-color: #ccc;
            bottom: 0;
            cursor: pointer;
            left: 0;
            position: absolute;
            right: 0;
            top: 0;
            transition: .4s;
            border-radius: 24px;
        }
        
        .slider:before {
            background-color: #fff;
            bottom: 4px;
            content: "";
            height: 16px;
            left: 4px;
            position: absolute;
            transition: .4s;
            width: 16px;
            border-radius: 50%;
        }
        
        input:checked + .slider {
            background-color: var(--primary-color);
        }
        
        input:checked + .slider:before {
            transform: translateX(20px);
        }
        
        .theme-icon {
            margin-left: 10px;
            font-size: 1.2rem;
        }

        .file-info {
            font-size: 0.8rem;
            color: #666;
            margin-top: 5px;
        }

        .continuation-point {
            background-color: #ffe6cc;
            padding: 10px;
            margin: 10px 0;
            border-left: 4px solid #ff9800;
            font-weight: bold;
        }

        [data-theme="dark"] .continuation-point {
            background-color: #3d2e15;
            border-left: 4px solid #ff9800;
        }
    </style>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Theme toggle functionality
            const toggleSwitch = document.querySelector('#theme-toggle');
            const themeIcon = document.querySelector('#theme-icon');
            
            function switchTheme(e) {
                if (e.target.checked) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    themeIcon.textContent = '🌙';
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    themeIcon.textContent = '☀️';
                    localStorage.setItem('theme', 'light');
                }    
            }
            
            toggleSwitch.addEventListener('change', switchTheme, false);
            
            // Check for saved theme preference
            const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
            if (currentTheme) {
                document.documentElement.setAttribute('data-theme', currentTheme);
                if (currentTheme === 'dark') {
                    toggleSwitch.checked = true;
                    themeIcon.textContent = '🌙';
                }
            }

            // Make code blocks collapsible
            document.querySelectorAll('.code-header').forEach(header => {
                header.addEventListener('click', function() {
                    const codeBlock = this.nextElementSibling;
                    if (codeBlock.style.display === 'none' || !codeBlock.style.display) {
                        codeBlock.style.display = 'block';
                        this.textContent = this.textContent.replace('▶', '▼');
                    } else {
                        codeBlock.style.display = 'none';
                        this.textContent = this.textContent.replace('▼', '▶');
                    }
                });
            });
        });
    </script>
</head>
<body>
    <div class="theme-switch-wrapper">
        <label class="theme-switch" for="theme-toggle">
            <input type="checkbox" id="theme-toggle" />
            <span class="slider"></span>
        </label>
        <span id="theme-icon" class="theme-icon">☀️</span>
    </div>
    
    <div class="container">
        <div class="header">
            <h1>${title}</h1>
            <div class="file-info">Generated from: ${inputFile} on ${new Date().toLocaleString()}</div>
        </div>
`;

    // Add each message
    messages.forEach(message => {
      // Find continuation points
      let formattedContent = message.content;
      const continuationPattern = /CONTINUATION_POINT:\s*\[([^\]]+)\]/g;
      const continuationPoints = [];
      
      let contMatch;
      while ((contMatch = continuationPattern.exec(message.content)) !== null) {
        continuationPoints.push(contMatch[1]);
      }
      
      // Convert code blocks (text between triple backticks)
      formattedContent = formattedContent.replace(/```([\w]*)\n([\s\S]*?)```/g, 
        (match, language, code) => {
          const langDisplay = language ? language : 'code';
          return `<div class="code-header" style="cursor:pointer;color:#3a86ff;margin-top:15px;">▶ ${langDisplay}</div><pre style="display:none;"><code class="language-${language}">${code}</code></pre>`;
        }
      );
      
      // Convert line breaks to <br>
      formattedContent = formattedContent.replace(/\n/g, '<br>');
      
      // Add div for the message
      html += `
        <div class="${message.role}">
            <strong>${message.role === 'human' ? 'You' : 'Claude'}:</strong>
            <div>${formattedContent}</div>
        </div>
      `;
      
      // Add continuation points if any were found
      if (continuationPoints.length > 0) {
        continuationPoints.forEach(point => {
          html += `
            <div class="continuation-point">
                Continuation Point: [${point}]
            </div>
          `;
        });
      }
    });

    // Close HTML
    html += `
    </div>
</body>
</html>`;

    // Construct output file path
    const outputFile = path.join(outputPath, path.basename(inputFile, path.extname(inputFile)) + '.html');

    // Try to write the file
    try {
      fs.writeFileSync(outputFile, html);
      console.log(`Conversation has been saved to ${outputFile}`);
      return true;
    } catch (error) {
      console.error(`Error writing to ${outputFile}: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing file: ${error.message}`);
    return false;
  }
}

// Ask for output directory
console.log(`Input file: ${inputFile}`);
rl.question('Enter output directory (leave blank for same as input): ', (outputDir) => {
  // If no output directory is specified, use the same directory as the input file
  const inputDirectory = path.dirname(inputFile);
  const outputPath = outputDir.trim() ? outputDir.trim() : inputDirectory;
  
  // Check if the output directory exists
  if (!fs.existsSync(outputPath)) {
    console.log(`Output directory doesn't exist. Attempting to create it...`);
    try {
      fs.mkdirSync(outputPath, { recursive: true });
    } catch (error) {
      console.error(`Could not create output directory: ${error.message}`);
      rl.close();
      process.exit(1);
    }
  }
  
  // Process the file
  const success = processFile(inputFile, outputPath);
  
  // Close the readline interface
  rl.close();
  
  if (success) {
    console.log('Conversion complete!');
  } else {
    console.log('Conversion failed. Please check the error messages above.');
  }
});
