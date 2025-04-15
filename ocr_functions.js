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
        
        // Extract text based on file type
        if (file.type.startsWith('image/')) {
            documentText = await extractTextFromImage(file);
        } else if (file.name.endsWith('.pdf')) {
            documentText = await extractTextFromPDF(file);
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
            modified: null
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

// Generate document summary
function generateDocumentSummary(text, fileName) {
    // Basic document analysis
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    const charCount = text.length;
    
    // Find keywords (simple implementation)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during', 'without', 'before', 'under', 'around', 'among']);
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(word => 
        word.length > 3 && !commonWords.has(word)
    );
    
    // Count word frequencies
    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Get top keywords
    const keywords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
        
    // Create summary
    let summary = `## Document Analysis: ${fileName}\n\n`;
    summary += `📊 **Document Statistics**\n`;
    summary += `- Words: ${wordCount}\n`;
    summary += `- Paragraphs: ${paragraphs}\n`;
    summary += `- Characters: ${charCount}\n\n`;
    
    if (keywords.length > 0) {
        summary += `🔑 **Key Terms**: ${keywords.join(', ')}\n\n`;
    }
    
    // Add content preview
    summary += `📄 **Content Preview**:\n`;
    const preview = text.substring(0, 250);
    summary += `\`\`\`\n${preview}${text.length > 250 ? '...' : ''}\n\`\`\`\n\n`;
    
    return summary;
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
function applyAllChanges(fileName, changes) {
    if (!window.uploadedDocuments || !window.uploadedDocuments[fileName]) return;
    
    // Apply changes in sequence
    let modifiedText = window.uploadedDocuments[fileName].original;
    
    for (const change of changes) {
        modifiedText = change.modified;
    }
    
    // Store modified version
    window.uploadedDocuments[fileName].modified = modifiedText;
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
        }
    });
}

// Download document function
function downloadDocument(fileName, modified = false) {
    if (!window.uploadedDocuments || !window.uploadedDocuments[fileName]) return;
    
    const content = modified ? 
        window.uploadedDocuments[fileName].modified || window.uploadedDocuments[fileName].original : 
        window.uploadedDocuments[fileName].original;
    
    if (!content) return;
    
    const element = document.createElement('a');
    
    // Handle base64 data URLs vs text content
    if (typeof content === 'string' && content.startsWith('data:')) {
        element.href = content;
    } else {
        const blob = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(blob);
    }
    
    // Set download filename
    if (modified) {
        const parts = fileName.split('.');
        const ext = parts.pop();
        element.download = `${parts.join('.')}-modified.${ext}`;
    } else {
        element.download = fileName;
    }
    
    // Trigger download
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
