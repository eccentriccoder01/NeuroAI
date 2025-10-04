export function exportAsText(messages, title = "NeuroAI Chat") {
  if (!messages || messages.length === 0) {
    alert('No messages to export!');
    return;
  }

  const timestamp = new Date().toLocaleString();
  let textContent = `${title}\nExported on: ${timestamp}\n\n`;
  
  messages.forEach((message, index) => {
    const role = message.role === 'user' ? 'You' : 
                 message.role === 'assistant' ? 'NeuroAI' : 'System';
    textContent += `${role}: ${message.content}\n\n`;
  });

  // Create and download the text file
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^\w\s]/gi, '')}_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAsPDF(messages, title = "NeuroAI Chat") {
  if (!messages || messages.length === 0) {
    alert('No messages to export!');
    return false;
  }

  try {
    // Simple PDF export using browser's print functionality
    const timestamp = new Date().toLocaleString();
    
    // Create a new window with the chat content
    const printWindow = window.open('', '_blank');
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              line-height: 1.6;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #007acc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .message {
              margin-bottom: 20px;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #007acc;
            }
            .user {
              background-color: #f0f8ff;
              border-left-color: #007acc;
            }
            .assistant {
              background-color: #f8f9fa;
              border-left-color: #28a745;
            }
            .system {
              background-color: #fff3cd;
              border-left-color: #ffc107;
            }
            .role {
              font-weight: bold;
              margin-bottom: 8px;
              color: #495057;
            }
            .content {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            @media print {
              body { margin: 0; }
              .message { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>Exported on: ${timestamp}</p>
          </div>
    `;

    messages.forEach((message) => {
      const roleClass = message.role || 'system';
      const roleName = message.role === 'user' ? 'You' : 
                      message.role === 'assistant' ? 'NeuroAI' : 'System';
      
      htmlContent += `
        <div class="message ${roleClass}">
          <div class="role">${roleName}:</div>
          <div class="content">${message.content.replace(/\n/g, '<br>')}</div>
        </div>
      `;
    });

    htmlContent += `
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };

    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('Failed to export as PDF. Please try again.');
    return false;
  }
}