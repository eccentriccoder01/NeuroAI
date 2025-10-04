import jsPDF from 'jspdf';

// Export conversation as text file
export function exportAsText(messages, sessionTitle = "NeuroAI Chat") {
  try {
    let content = `${sessionTitle}\n`;
    content += `Export Date: ${new Date().toLocaleString()}\n`;
    content += `${'='.repeat(50)}\n\n`;

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'You' : 
                   message.role === 'assistant' ? 'NeuroAI' : 'System';
      
      content += `[${role}]\n`;
      content += `${message.content}\n\n`;
      
      if (index < messages.length - 1) {
        content += `${'-'.repeat(30)}\n\n`;
      }
    });

    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sessionTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Text file exported successfully');
  } catch (error) {
    console.error('Error exporting text file:', error);
    alert('Failed to export text file. Please try again.');
  }
}

// Export conversation as PDF
export function exportAsPDF(messages, sessionTitle = "NeuroAI Chat") {
  try {
    console.log('Starting PDF export...', { messages: messages.length, title: sessionTitle });
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    // Add title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(sessionTitle, margin, y);
    y += 20;

    // Add export date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, y);
    y += 20;

    // Add messages
    messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'You' : 
                   message.role === 'assistant' ? 'NeuroAI' : 'System';
      
      // Check if we need a new page
      if (y > pageHeight - 40) {
        doc.addPage();
        y = margin;
      }

      // Add role header
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`[${role}]`, margin, y);
      y += 15;

      // Add message content - split long text into multiple lines
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const content = message.content || '';
      const maxWidth = pageWidth - 2 * margin;
      const lines = doc.splitTextToSize(content, maxWidth);
      
      // Add each line, checking for page breaks
      lines.forEach(line => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 6;
      });
      
      y += 10; // Space between messages

      // Add separator line (except for last message)
      if (index < messages.length - 1) {
        if (y > pageHeight - 15) {
          doc.addPage();
          y = margin;
        }
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 15;
      }
    });

    // Save the PDF
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${sessionTitle.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.pdf`;
    
    console.log('Saving PDF as:', fileName);
    doc.save(fileName);
    
    console.log('PDF exported successfully');
    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert(`Failed to export PDF: ${error.message}`);
    return false;
  }
}