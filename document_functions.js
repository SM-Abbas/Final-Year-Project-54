// Document preview and download functions

// Add download button to file preview
function addDownloadButton(fileItem, fileName) {
    // Create action buttons container if it doesn't exist
    let actionBtns = fileItem.querySelector('.file-action-buttons');
    if (!actionBtns) {
        actionBtns = document.createElement('div');
        actionBtns.className = 'file-action-buttons';
        
        // Get the file header
        const fileHeader = fileItem.querySelector('.file-header');
        if (fileHeader) {
            // Add action buttons after the file name container
            const fileNameContainer = fileHeader.querySelector('.file-name-container');
            if (fileNameContainer) {
                fileHeader.insertBefore(actionBtns, fileNameContainer.nextSibling);
            } else {
                fileHeader.appendChild(actionBtns);
            }
        }
    }
    
    // Create download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-button';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
    downloadBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        downloadDocument(fileName);
    });
    
    // Add button to container
    actionBtns.prepend(downloadBtn);
}

// Add OCR text preview to file item
function addOcrTextPreview(fileItem, text) {
    // Create OCR text preview container
    const ocrPreviewContainer = document.createElement('div');
    ocrPreviewContainer.className = 'file-preview-container ocr-preview';
    
    // Add textarea with extracted content
    const textPreview = document.createElement('textarea');
    textPreview.readOnly = true;
    textPreview.value = text || "No text could be extracted from this document.";
    
    // Add to container and file item
    ocrPreviewContainer.appendChild(textPreview);
    fileItem.appendChild(ocrPreviewContainer);
}

// Enhanced file processing function
async function enhanceDocumentProcessing(file) {
    try {
        // Find the file item for this file
        const filePreview = document.getElementById('documentPreviews');
        if (!filePreview) return;
        
        const fileItems = filePreview.querySelectorAll('.file-item');
        let targetFileItem = null;
        
        for (const item of fileItems) {
            const nameElement = item.querySelector('.file-name-container span');
            if (nameElement && nameElement.textContent === file.name) {
                targetFileItem = item;
                break;
            }
        }
        
        if (!targetFileItem) return;
        
        // Add download button
        addDownloadButton(targetFileItem, file.name);
        
        // Extract text from document
        let extractedText = '';
        
        if (file.type.startsWith('image/')) {
            extractedText = await extractTextFromImage(file);
        } else if (file.name.endsWith('.pdf')) {
            extractedText = await extractTextFromPDF(file);
        } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            extractedText = await new Promise((resolve, reject) => {
                reader.onload = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read text file'));
                reader.readAsText(file);
            });
        } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            extractedText = "DOCX processing not implemented. Please convert to PDF or text.";
        } else {
            extractedText = "This file type is not supported for text extraction.";
        }
        
        // Store extracted text
        if (!window.uploadedDocuments) {
            window.uploadedDocuments = {};
        }
        
        window.uploadedDocuments[file.name] = {
            original: extractedText,
            modified: null
        };
        
        // Add OCR text preview
        addOcrTextPreview(targetFileItem, extractedText);
        
    } catch (error) {
        console.error("Error enhancing document:", error);
    }
}

// Hook into the existing previewFile function
document.addEventListener('DOMContentLoaded', function() {
    // Store reference to original previewFile function
    if (window.previewFile) {
        const originalPreviewFile = window.previewFile;
        
        // Override with enhanced version
        window.previewFile = async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Call original function first
            await originalPreviewFile(event);
            
            // Then enhance with our functionality
            enhanceDocumentProcessing(file);
        };
    }
}); 
