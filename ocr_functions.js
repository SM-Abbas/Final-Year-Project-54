"// OCR and document analysis functions" 

// When document is uploaded, enhance the previewFile function to show thinking animation
document.addEventListener('DOMContentLoaded', function() {
    // Store reference to the original previewFile function
    if (window.previewFile) {
        window.originalPreviewFile = window.previewFile;
        
        // Replace with our enhanced version
        window.previewFile = function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // First, call the original function to handle the preview UI
            if (window.originalPreviewFile) {
                window.originalPreviewFile(event);
            }
            
            // Then start our enhanced OCR and document analysis
            const thinkingContainer = window.showThinkingAnimation();
            
            // Process document with OCR and analysis
            processDocumentWithOCR(file, thinkingContainer);
        };
    }
    
    // Add the necessary styles for suggested changes UI
    addChangesStyles();
});

// Process document with OCR and analysis
async function processDocumentWithOCR(file, thinkingContainer) {
    try {
        let documentText = '';
        let documentBinary = null;
        
        // Extract text based on file type
        if (file.type.startsWith('image/')) {
            documentText = await extractTextFromImage(file);
        } else if (file.name.endsWith('.pdf')) {
            // For PDFs, store both text and binary data
            const arrayBuffer = await file.arrayBuffer();
            documentText = await extractTextFromPDF(file);
            documentBinary = arrayBuffer;
        } else if (file.name.endsWith('.txt')) {
            const reader = new FileReader();
            documentText = await new Promise((resolve, reject) => {
                reader.onload = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read text file'));
                reader.readAsText(file);
            });
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            documentText = "DOCX processing not implemented. Please convert to PDF or text.";
        } else {
            documentText = "This file type is not supported for text extraction.";
        }
        
        // Store both original and modified versions
        if (!window.uploadedDocuments) {
            window.uploadedDocuments = {};
        }
        
        window.uploadedDocuments[file.name] = {
            original: documentText,
            modified: null,
            originalBinary: documentBinary,
            modifiedBinary: null,
            isPdf: file.name.endsWith('.pdf')
        };
        
        // Generate document summary and suggested changes
        const summary = generateDocumentSummary(documentText, file.name);
        const suggestedChanges = generateSuggestedChanges(documentText);
        
        // Remove thinking animation
        if (thinkingContainer) {
            thinkingContainer.remove();
        }
        
        // Display document summary
        window.appendMessage("bot", summary);
        
        // Add suggested changes UI if there are changes
        if (suggestedChanges.length > 0) {
            createSuggestedChangesUI(file.name, suggestedChanges);
        }
        
    } catch (error) {
        console.error("Error processing document:", error);
        
        // Remove thinking animation
        if (thinkingContainer) {
            thinkingContainer.remove();
        }
        
        // Show error message
        window.appendMessage("bot", `Error processing document: ${error.message}`);
    }
}

// Extract text from PDF using PDF.js
async function extractTextFromPDF(file) {
    try {
        // Ensure PDF.js is properly initialized
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF.js library not loaded');
        }

        // Get array buffer from file
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the PDF document
        const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
        
        let fullText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }
        
        return fullText;
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        throw error;
    }
}

// Function to create PDF from modified text
async function createModifiedPDF(text) {
    try {
        // Check if PDF-lib is available
        if (typeof PDFLib === 'undefined') {
            throw new Error('PDF-lib not loaded');
        }

        const { PDFDocument, StandardFonts, rgb } = PDFLib;

        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        
        // Add a page to the document
        const page = pdfDoc.addPage([612, 792]); // US Letter size
        
        // Embed the font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Set some basic text parameters
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const margin = 50;
        const maxWidth = page.getWidth() - 2 * margin;
        
        // Split text into lines that fit the page width
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const width = font.widthOfTextAtSize(testLine, fontSize);
            
            if (width > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        
        // Draw text on the page
        let y = page.getHeight() - margin;
        
        for (const line of lines) {
            if (y < margin) {
                // Add a new page if we run out of space
                const newPage = pdfDoc.addPage([612, 792]);
                y = newPage.getHeight() - margin;
                page = newPage;
            }
            
            page.drawText(line, {
                x: margin,
                y: y,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
            });
            
            y -= lineHeight;
        }
        
        // Save the PDF as bytes
        const pdfBytes = await pdfDoc.save();
        
        return pdfBytes;
    } catch (error) {
        console.error('Error creating modified PDF:', error);
        throw error;
    }
}

// Generate document summary
function generateDocumentSummary(text, fileName) {
    // Basic document analysis
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const charCount = text.length;
    const sentences = text.split(/[.!?]+\s+/).filter(s => s.trim().length > 0).length;
    const averageWordLength = text.split(/\s+/).filter(word => word.length > 0).reduce((sum, word) => sum + word.length, 0) / wordCount || 0;
    
    // Get file extension
    const fileExt = fileName.split('.').pop().toLowerCase();
    const fileType = getFileTypeName(fileExt);
    
    // Find keywords (improved implementation)
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 
        'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 
        'without', 'before', 'under', 'around', 'among', 'this', 'that', 'these', 'those', 'they',
        'them', 'their', 'from', 'have', 'has', 'had', 'not', 'been', 'being', 'was', 'were', 'will'
    ]);
    
    // Better word tokenization with cleanup
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word) && isNaN(word));
    
    // Count word frequencies with better handling
    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Get top keywords with improved relevance
    const keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(entry => entry[0]);
    
    // Create summary
    let summary = `## Document Analysis: ${fileName}\n\n`;
    summary += `📄 **Document Type**: ${fileType}\n`;
    summary += `📊 **Document Statistics**\n`;
    summary += `- Words: ${wordCount.toLocaleString()}\n`;
    summary += `- Sentences: ${sentences.toLocaleString()}\n`;
    summary += `- Paragraphs: ${paragraphs.toLocaleString()}\n`;
    summary += `- Characters: ${charCount.toLocaleString()}\n`;
    summary += `- Average Word Length: ${averageWordLength.toFixed(1)} characters\n\n`;
    
    if (keywords.length > 0) {
        summary += `🔑 **Key Terms**: ${keywords.join(', ')}\n\n`;
    }
    
    // Try to detect document type/category based on content
    const documentCategory = detectDocumentCategory(text);
    if (documentCategory) {
        summary += `📋 **Document Category**: ${documentCategory}\n\n`;
    }
    
    // Add content preview with better formatting
    summary += `📝 **Content Preview**:\n`;
    // Get first substantial paragraph
    const firstParagraph = text.split(/\n\s*\n/).find(p => p.trim().length > 50) || text;
    const preview = firstParagraph.substring(0, 250).trim();
    summary += `\`\`\`\n${preview}${firstParagraph.length > 250 ? '...' : ''}\n\`\`\`\n\n`;
    
    // Add document recommendations
    summary += `💡 **Use LegalMind to**:\n`;
    summary += `- Extract key information from this document\n`;
    summary += `- Summarize the full content\n`;
    summary += `- Answer questions about specific details\n`;
    
    return summary;
}

// Helper function to get friendly file type name
function getFileTypeName(extension) {
    const typeMap = {
        'pdf': 'PDF Document',
        'doc': 'Microsoft Word Document',
        'docx': 'Microsoft Word Document',
        'txt': 'Text Document',
        'rtf': 'Rich Text Format Document',
        'xlsx': 'Microsoft Excel Spreadsheet',
        'xls': 'Microsoft Excel Spreadsheet',
        'ppt': 'Microsoft PowerPoint Presentation',
        'pptx': 'Microsoft PowerPoint Presentation',
        'jpg': 'JPEG Image',
        'jpeg': 'JPEG Image',
        'png': 'PNG Image',
        'csv': 'CSV Spreadsheet'
    };
    
    return typeMap[extension] || 'Document';
}

// Helper function to detect document category based on content
function detectDocumentCategory(text) {
    const lowerText = text.toLowerCase();
    
    // Define patterns for different document types
    const patterns = [
        { category: 'Legal Contract', patterns: ['agreement', 'contract', 'parties', 'hereby', 'shall', 'terms and conditions', 'obligations', 'clause'] },
        { category: 'Financial Document', patterns: ['balance', 'income', 'expense', 'revenue', 'financial statement', 'profit', 'loss', 'assets', 'liabilities'] },
        { category: 'Academic Paper', patterns: ['abstract', 'introduction', 'methodology', 'conclusion', 'references', 'hypothesis', 'study', 'research'] },
        { category: 'Business Letter', patterns: ['dear', 'sincerely', 'regards', 'letter', 'request', 'inquiry', 'response', 'letterhead'] },
        { category: 'Resume/CV', patterns: ['experience', 'education', 'skills', 'references', 'employment', 'qualifications', 'objective', 'resume', 'curriculum vitae'] },
        { category: 'Legal Brief', patterns: ['court', 'plaintiff', 'defendant', 'jurisdiction', 'ruling', 'appeal', 'motion', 'petitioner', 'respondent'] },
        { category: 'Technical Manual', patterns: ['instructions', 'guide', 'steps', 'procedure', 'manual', 'installation', 'configuration', 'troubleshooting'] }
    ];
    
    // Find matching patterns
    const matches = patterns.map(type => {
        const matchCount = type.patterns.filter(pattern => lowerText.includes(pattern)).length;
        return { category: type.category, matches: matchCount, percentage: matchCount / type.patterns.length };
    });
    
    // Get best match if it meets threshold
    const bestMatch = matches.sort((a, b) => b.percentage - a.percentage)[0];
    return bestMatch.percentage > 0.3 ? bestMatch.category : null;
}

// Generate suggested changes
function generateSuggestedChanges(text) {
    const changes = [];
    
    // 1. Fix date formatting (MM/DD/YYYY)
    const dateFixedText = text.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g, (match, month, day, year) => {
        return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year.length === 2 ? '20' + year : year}`;
    });
    
    if (dateFixedText !== text) {
        changes.push({
            type: "formatting",
            description: "Standardize date formats to MM/DD/YYYY",
            original: text,
            modified: dateFixedText
        });
    }
    
    // 2. Fix capitalization at beginning of sentences
    const capitalizationFixedText = dateFixedText.replace(/(?:^|[.!?]\s+)([a-z])/g, (match, letter) => {
        return match.replace(letter, letter.toUpperCase());
    });
    
    if (capitalizationFixedText !== dateFixedText) {
        changes.push({
            type: "capitalization",
            description: "Capitalize first letter of sentences",
            original: dateFixedText,
            modified: capitalizationFixedText
        });
    }
    
    // 3. Fix spacing issues
    const spacingFixedText = capitalizationFixedText
        .replace(/([.,!?;:])(?=[a-zA-Z])/g, '$1 ')  // Add space after punctuation
        .replace(/\s+/g, ' ')  // Normalize multiple spaces
        .replace(/\s*\n\s*/g, '\n');  // Fix spaces around newlines
        
    if (spacingFixedText !== capitalizationFixedText) {
        changes.push({
            type: "spacing",
            description: "Fix spacing and punctuation issues",
            original: capitalizationFixedText,
            modified: spacingFixedText
        });
    }
    
    // 4. Fix common grammar issues
    const grammarFixedText = spacingFixedText
        .replace(/(?:^|\s)i(?=\s|$)/g, ' I')
        .replace(/(?:^|\s)im(?=\s|$)/g, ' I\'m')
        .replace(/(?:^|\s)dont(?=\s|$)/g, ' don\'t')
        .replace(/(?:^|\s)cant(?=\s|$)/g, ' can\'t')
        .replace(/(?:^|\s)wont(?=\s|$)/g, ' won\'t');
        
    if (grammarFixedText !== spacingFixedText) {
        changes.push({
            type: "grammar",
            description: "Fix common grammatical issues",
            original: spacingFixedText, 
            modified: grammarFixedText
        });
    }
    
    return changes;
}

// Create UI for suggested changes
function createSuggestedChangesUI(fileName, suggestedChanges) {
    // Create container for suggested changes
    const changesContainer = document.createElement('div');
    changesContainer.className = 'suggested-changes-container';
    
    changesContainer.innerHTML = `
        <h3>📝 Suggested Changes for "${fileName}"</h3>
        <p class="changes-description">The following improvements are recommended:</p>
        <div class="changes-list"></div>
        <div class="changes-actions">
            <button class="accept-all-btn"><i class="fas fa-check-circle"></i> Accept All</button>
            <button class="reject-all-btn"><i class="fas fa-times-circle"></i> Reject All</button>
        </div>
    `;
    
    // Add each suggested change to the list
    const changesList = changesContainer.querySelector('.changes-list');
    suggestedChanges.forEach((change, index) => {
        const changeItem = document.createElement('div');
        changeItem.className = 'change-item';
        changeItem.innerHTML = `
            <div class="change-header">
                <span class="change-type"><i class="fas fa-edit"></i> ${change.type}</span>
                <span class="change-description">${change.description}</span>
            </div>
            <div class="change-actions">
                <button class="accept-btn" data-index="${index}"><i class="fas fa-check"></i> Accept</button>
                <button class="reject-btn" data-index="${index}"><i class="fas fa-times"></i> Reject</button>
            </div>
        `;
        changesList.appendChild(changeItem);
    });
    
    // Add message to chat
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.appendChild(changesContainer);
    
    const chatBox = document.getElementById('chatBox');
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    // Add event listeners
    const acceptAllBtn = changesContainer.querySelector('.accept-all-btn');
    const rejectAllBtn = changesContainer.querySelector('.reject-all-btn');
    
    acceptAllBtn.addEventListener('click', () => {
        // Apply all changes
        applyAllChanges(fileName, suggestedChanges);
        messageDiv.remove();
        
        // Show success message
        window.appendMessage("bot", `✅ All changes applied to "${fileName}". You can now download the updated document.`);
        
        // Enable modified download button
        enableModifiedDownload(fileName);
    });
    
    rejectAllBtn.addEventListener('click', () => {
        messageDiv.remove();
        window.appendMessage("bot", `❌ Changes rejected for "${fileName}".`);
    });
    
    // Add individual accept/reject listeners
    const acceptBtns = changesContainer.querySelectorAll('.accept-btn');
    const rejectBtns = changesContainer.querySelectorAll('.reject-btn');
    
    acceptBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            applySingleChange(fileName, suggestedChanges[index]);
            
            // Update UI
            const changeItem = btn.closest('.change-item');
            changeItem.classList.add('accepted');
            changeItem.innerHTML = `
                <div class="change-status">
                    <i class="fas fa-check-circle"></i> 
                    <span>${suggestedChanges[index].description} (Accepted)</span>
                </div>
            `;
            
            // Check if all changes have been handled
            checkAllChangesHandled(changesList, messageDiv, fileName);
        });
    });
    
    rejectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            
            // Update UI
            const changeItem = btn.closest('.change-item');
            changeItem.classList.add('rejected');
            changeItem.innerHTML = `
                <div class="change-status">
                    <i class="fas fa-times-circle"></i>
                    <span>${suggestedChanges[index].description} (Rejected)</span>
                </div>
            `;
            
            // Check if all changes have been handled
            checkAllChangesHandled(changesList, messageDiv, fileName);
        });
    });
}

// Apply a single change
function applySingleChange(fileName, change) {
    if (!window.uploadedDocuments || !window.uploadedDocuments[fileName]) return;
    
    // If no modified version exists yet, start with the original
    if (!window.uploadedDocuments[fileName].modified) {
        window.uploadedDocuments[fileName].modified = window.uploadedDocuments[fileName].original;
    }
    
    // Apply this specific change
    window.uploadedDocuments[fileName].modified = change.modified;
}

// Apply all changes
async function applyAllChanges(fileName, changes) {
    if (!window.uploadedDocuments || !window.uploadedDocuments[fileName]) return;
    
    // Apply changes in sequence
    let modifiedText = window.uploadedDocuments[fileName].original;
    
    for (const change of changes) {
        modifiedText = change.modified;
    }
    
    // Store modified version
    window.uploadedDocuments[fileName].modified = modifiedText;
    
    // For PDF files, we need to handle binary data
    if (fileName.toLowerCase().endsWith('.pdf') && window.uploadedDocuments[fileName].isOriginalBinary) {
        try {
            // Convert modified text to PDF binary data
            const pdfModified = await convertTextToPdfBinary(modifiedText);
            window.uploadedDocuments[fileName].modifiedBinary = pdfModified;
            
            console.log("Successfully generated modified PDF binary data");
        } catch (error) {
            console.error("Error generating modified PDF:", error);
        }
    }
    
    // Add "Modified" download button if not already present
    enableModifiedDownload(fileName);
}

// Check if all changes have been handled
function checkAllChangesHandled(changesList, messageDiv, fileName) {
    const allItems = changesList.querySelectorAll('.change-item');
    const handledItems = changesList.querySelectorAll('.change-item.accepted, .change-item.rejected');
    
    if (allItems.length === handledItems.length) {
        // All changes have been handled
        setTimeout(() => {
            messageDiv.remove();
            
            // Check if any changes were accepted
            const acceptedItems = changesList.querySelectorAll('.change-item.accepted');
            if (acceptedItems.length > 0) {
                window.appendMessage("bot", `✅ Changes applied to "${fileName}". You can now download the updated document.`);
                enableModifiedDownload(fileName);
            } else {
                window.appendMessage("bot", `All suggested changes for "${fileName}" were rejected.`);
            }
        }, 1000);
    }
}

// Enable modified download button
function enableModifiedDownload(fileName) {
    const modBtnId = `mod-btn-${fileName.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Find file item and add buttons
    const fileItems = document.querySelectorAll('.file-item');
    fileItems.forEach(item => {
        const nameSpan = item.querySelector('.file-name-container span');
        if (nameSpan && nameSpan.textContent === fileName) {
            // Create actions container if it doesn't exist
            let actionsDiv = item.querySelector('.file-actions');
            if (!actionsDiv) {
                actionsDiv = document.createElement('div');
                actionsDiv.className = 'file-actions';
                actionsDiv.style.cssText = 'display:flex; gap:8px; padding:8px; justify-content:space-between; border-top:1px solid #eee;';
                item.appendChild(actionsDiv);
            }
            
            // Create original download button
            const origBtn = document.createElement('button');
            origBtn.innerHTML = '<i class="fas fa-download"></i> Original';
            origBtn.style.cssText = 'background:#f8f9fa; border:1px solid #dee2e6; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:4px';
            origBtn.onclick = () => downloadDocument(fileName, false);
            
            // Create modified download button
            const modBtn = document.createElement('button');
            modBtn.id = modBtnId;
            modBtn.innerHTML = '<i class="fas fa-download"></i> Modified';
            modBtn.style.cssText = 'background:#007bff; color:white; border:1px solid #007bff; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:4px';
            modBtn.onclick = () => downloadDocument(fileName, true);
            
            // Add buttons to actions div
            actionsDiv.innerHTML = ''; // Clear any existing buttons
            actionsDiv.appendChild(origBtn);
            actionsDiv.appendChild(modBtn);
            
            // Add view buttons for PDFs
            if (fileName.toLowerCase().endsWith('.pdf')) {
                // Original view button
                const origViewBtn = document.createElement('button');
                origViewBtn.innerHTML = '<i class="fas fa-eye"></i> View Original';
                origViewBtn.style.cssText = 'background:#e9ecef; border:1px solid #dee2e6; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:4px';
                origViewBtn.onclick = () => viewPdfDocument(fileName, false);
                
                // Modified view button
                const modViewBtn = document.createElement('button');
                modViewBtn.innerHTML = '<i class="fas fa-eye"></i> View Modified';
                modViewBtn.style.cssText = 'background:#17a2b8; color:white; border:1px solid #17a2b8; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:4px';
                modViewBtn.onclick = () => viewPdfDocument(fileName, true);
                
                actionsDiv.appendChild(origViewBtn);
                actionsDiv.appendChild(modViewBtn);
            }
        }
    });
}

// View PDF document in a modal
function viewPdfDocument(fileName, modified = false) {
    if (!window.uploadedDocuments || !window.uploadedDocuments[fileName]) return;
    
    try {
        // Get content based on modified flag
        let content;
        
        if (modified) {
            // Use modifiedBinary for PDFs if available
            if (window.uploadedDocuments[fileName].modifiedBinary) {
                content = window.uploadedDocuments[fileName].modifiedBinary;
            } else {
                content = window.uploadedDocuments[fileName].modified || window.uploadedDocuments[fileName].original;
            }
        } else {
            // Use originalBinary for PDFs if available
            if (window.uploadedDocuments[fileName].originalBinary) {
                content = window.uploadedDocuments[fileName].originalBinary;
            } else {
                content = window.uploadedDocuments[fileName].original;
            }
        }
        
        if (!content) {
            console.error("No content available to view");
            return;
        }
        
        // Create a modal to view the PDF
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:1000; display:flex; flex-direction:column; align-items:center; justify-content:center;';
        
        // Modal header with filename and close button
        const modalHeader = document.createElement('div');
        modalHeader.style.cssText = 'width:90%; max-width:1000px; display:flex; justify-content:space-between; align-items:center; background:#fff; padding:10px; border-radius:5px 5px 0 0;';
        
        const modalTitle = document.createElement('h3');
        modalTitle.textContent = `${modified ? 'Modified' : 'Original'}: ${fileName}`;
        modalTitle.style.margin = '0';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'background:none; border:none; font-size:24px; cursor:pointer;';
        closeBtn.onclick = () => modal.remove();
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeBtn);
        
        // PDF viewer container
        const viewerContainer = document.createElement('div');
        viewerContainer.style.cssText = 'width:90%; max-width:1000px; height:80%; background:#fff; padding:10px; border-radius:0 0 5px 5px; overflow:hidden;';
        
        // Create PDF viewer
        const viewer = document.createElement('iframe');
        viewer.style.cssText = 'width:100%; height:100%; border:none;';
        
        // Convert content to a URL
        let blobUrl;
        if (content instanceof ArrayBuffer) {
            const blob = new Blob([content], { type: 'application/pdf' });
            blobUrl = URL.createObjectURL(blob);
        } else if (typeof content === 'string' && content.startsWith('data:')) {
            blobUrl = content;
        } else {
            const blob = new Blob([content], { type: 'application/pdf' });
            blobUrl = URL.createObjectURL(blob);
        }
        
        // Set iframe source to the PDF
        viewer.src = blobUrl;
        
        // Append elements to modal
        viewerContainer.appendChild(viewer);
        modal.appendChild(modalHeader);
        modal.appendChild(viewerContainer);
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Clean up when modal is closed
        closeBtn.addEventListener('click', () => {
            if (blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
            }
        });
    } catch (error) {
        console.error("Error viewing PDF:", error);
        alert(`Error viewing PDF: ${error.message}`);
    }
}

// Helper function to convert text to PDF binary
async function convertTextToPdfBinary(text) {
    try {
        // Check if pdf-lib is available
        if (typeof PDFLib !== 'undefined') {
            // Add PDF-lib script dynamically if not already there
            await loadPdfLibIfNeeded();
            return await createPdfWithPdfLib(text);
        } else {
            console.warn("PDF-lib not available, using fallback PDF generator");
            return createBasicPdf(text);
        }
    } catch (error) {
        console.error("Error creating PDF:", error);
        return createBasicPdf(text);
    }
}

// Load PDF-lib if needed
async function loadPdfLibIfNeeded() {
    if (typeof PDFLib !== 'undefined') return;
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load PDF-lib'));
        document.head.appendChild(script);
    });
}

// Create PDF using pdf-lib if available
async function createPdfWithPdfLib(text) {
    try {
        // Use pdf-lib to create a proper PDF
        const { PDFDocument, StandardFonts, rgb } = PDFLib;
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        
        // Add a blank page to the document
        const page = pdfDoc.addPage([612, 792]); // US Letter size
        
        // Get the font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Draw text on the page
        const fontSize = 12;
        const lineHeight = fontSize * 1.2;
        const margin = 50;
        
        // Split text into lines
        const textWidth = page.getWidth() - 2 * margin;
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);
            
            if (testLineWidth > textWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        
        // Draw each line of text
        let y = page.getHeight() - margin;
        for (const line of lines) {
            if (y < margin) {
                // Add a new page if we run out of space
                const newPage = pdfDoc.addPage([612, 792]);
                y = newPage.getHeight() - margin;
                page = newPage;
            }
            
            page.drawText(line, {
                x: margin,
                y: y,
                size: fontSize,
                font: font,
                color: rgb(0, 0, 0)
            });
            
            y -= lineHeight;
        }
        
        // Serialize the PDFDocument to bytes
        const pdfBytes = await pdfDoc.save();
        
        // Convert to ArrayBuffer
        return pdfBytes.buffer;
    } catch (error) {
        console.error("Error creating PDF with pdf-lib:", error);
        return createBasicPdf(text);
    }
}

// Fallback basic PDF creator
function createBasicPdf(text) {
    // Simple PDF structure (this is a very basic representation, not for production use)
    const pdfHeader = '%PDF-1.7\n';
    const pdfObject = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const pagesObject = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const pageObject = '3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
    const fontObject = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
    
    // Encode the text for PDF
    const escapedText = text.replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\\/g, '\\\\');
    const encodedText = `BT /F1 12 Tf 36 700 Td (${escapedText}) Tj ET`;
    
    const contentObject = `5 0 obj\n<< /Length ${encodedText.length} >>\nstream\n${encodedText}\nendstream\nendobj\n`;
    const xref = 'xref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000120 00000 n\n0000000220 00000 n\n0000000290 00000 n\n';
    const trailer = 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF';
    
    const pdfContent = pdfHeader + pdfObject + pagesObject + pageObject + fontObject + contentObject + xref + trailer;
    
    // Convert string to ArrayBuffer
    const buffer = new ArrayBuffer(pdfContent.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < pdfContent.length; i++) {
        view[i] = pdfContent.charCodeAt(i);
    }
    
    return buffer;
}

// Helper function to determine MIME type from filename
function getMimeTypeFromFileName(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif'
    };
    
    return mimeTypes[extension] || 'text/plain';
}

// Download document function
function downloadDocument(fileName, modified = false, view = false) {
    if (!window.uploadedDocuments || !window.uploadedDocuments[fileName]) return;
    
    const docInfo = window.uploadedDocuments[fileName];
    let content;
    let contentType;
    
    if (docInfo.isPdf) {
        if (modified && docInfo.modifiedBinary) {
            content = docInfo.modifiedBinary;
        } else if (docInfo.originalBinary) {
            content = docInfo.originalBinary;
        } else {
            content = modified ? docInfo.modified : docInfo.original;
        }
        contentType = 'application/pdf';
        
        // If view is true and it's a PDF, show in viewer instead of downloading
        if (view) {
            viewPdfDocument(content, fileName);
            return;
        }
    } else {
        content = modified ? docInfo.modified : docInfo.original;
        contentType = 'text/plain';
    }
    
    if (!content) return;
    
    const element = document.createElement('a');
    
    if (typeof content === 'string' && content.startsWith('data:')) {
        element.href = content;
    } else {
        const blob = new Blob([content], { type: contentType });
        element.href = URL.createObjectURL(blob);
    }
    
    if (modified) {
        const parts = fileName.split('.');
        const ext = parts.pop();
        element.download = `${parts.join('.')}-modified.${ext}`;
    } else {
        element.download = fileName;
    }
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    // Clean up the URL object
    if (element.href.startsWith('blob:')) {
        URL.revokeObjectURL(element.href);
    }
}

// Add styles for changes UI
function addChangesStyles() {
    // Check if styles already exist
    if (document.getElementById('changes-styles')) return;
    
    const stylesElement = document.createElement('style');
    stylesElement.id = 'changes-styles';
    stylesElement.textContent = `
        .suggested-changes-container {
            background: var(--light-surface, #ffffff);
            border-radius: var(--border-radius-md, 12px);
            padding: 16px;
            box-shadow: var(--box-shadow, 0 2px 8px rgba(0,0,0,0.08));
            margin: 10px 0;
        }
        
        body.dark-mode .suggested-changes-container {
            background: var(--dark-surface, #1e1e1e);
            box-shadow: var(--dark-box-shadow, 0 2px 8px rgba(0,0,0,0.2));
        }
        
        .suggested-changes-container h3 {
            font-size: 16px;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 8px;
            color: var(--primary-color, #007bff);
        }
        
        .changes-description {
            font-size: 14px;
            margin-bottom: 16px;
            opacity: 0.8;
        }
        
        .changes-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 16px;
        }
        
        .change-item {
            background: rgba(0,0,0,0.03);
            border-radius: 8px;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        body.dark-mode .change-item {
            background: rgba(255,255,255,0.05);
        }
        
        .change-header {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .change-type {
            font-weight: 600;
            color: var(--primary-color, #007bff);
            text-transform: capitalize;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .change-description {
            font-size: 13px;
            opacity: 0.9;
        }
        
        .change-actions {
            display: flex;
            gap: 8px;
        }
        
        .change-status {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
            font-weight: 500;
        }
        
        .accept-btn, .accept-all-btn {
            background: var(--success-color, #28a745);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        
        .accept-btn:hover, .accept-all-btn:hover {
            background: var(--success-hover, #218838);
            transform: translateY(-1px);
        }
        
        .reject-btn, .reject-all-btn {
            background: var(--danger-color, #dc3545);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
        }
        
        .reject-btn:hover, .reject-all-btn:hover {
            background: #c82333;
            transform: translateY(-1px);
        }
        
        .changes-actions {
            display: flex;
            justify-content: center;
            gap: 16px;
        }
        
        .changes-actions button {
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .change-item.accepted {
            background: rgba(40, 167, 69, 0.1);
            border: 1px solid rgba(40, 167, 69, 0.2);
        }
        
        .change-item.rejected {
            background: rgba(220, 53, 69, 0.1);
            border: 1px solid rgba(220, 53, 69, 0.2);
        }
        
        .change-item.accepted .change-status i {
            color: var(--success-color, #28a745);
        }
        
        .change-item.rejected .change-status i {
            color: var(--danger-color, #dc3545);
        }
        
        .file-actions {
            margin-top: 8px;
        }
    `;
    
    document.head.appendChild(stylesElement);
} 
