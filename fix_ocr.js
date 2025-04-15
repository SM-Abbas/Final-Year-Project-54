// Fix OCR Integration
document.addEventListener('DOMContentLoaded', function() {
    console.log("Fixing OCR integration...");
    
    // Add OCR extraction capabilities to the existing document handling
    setTimeout(() => {
        // Store reference to the current previewFile function
        if (window.previewFile) {
            const currentPreviewFile = window.previewFile;
            
            // Replace with our enhanced version
            window.previewFile = async function(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                // Call current function first
                await currentPreviewFile(event);
                console.log("Original previewFile completed");
                
                try {
                    console.log("Starting OCR document processing for", file.name);
                    
                    // Get the file item that was just created
                    const filePreview = document.getElementById('documentPreviews');
                    if (!filePreview) {
                        console.log("Document preview container not found");
                        return;
                    }
                    
                    const fileItems = filePreview.querySelectorAll('.file-item');
                    let targetFileItem = null;
                    
                    for (const item of fileItems) {
                        const nameElement = item.querySelector('.file-name-container span');
                        if (nameElement && nameElement.textContent === file.name) {
                            targetFileItem = item;
                            break;
                        }
                    }
                    
                    if (!targetFileItem) {
                        console.log("File item not found in document previews");
                        return;
                    }
                    
                    // Remove any existing processing indicators
                    const processingIndicators = document.querySelectorAll('.processing-indicator');
                    processingIndicators.forEach(indicator => indicator.remove());
                    
                    // Extract text from document
                    let extractedText = '';
                        
                    if (file.type.startsWith('image/')) {
                        console.log("Extracting text from image...");
                        if (typeof extractTextFromImage === 'function') {
                            extractedText = await extractTextFromImage(file);
                        }
                    } else if (file.name.endsWith('.pdf')) {
                        console.log("Extracting text from PDF...");
                        if (typeof extractTextFromPDF === 'function') {
                            extractedText = await extractTextFromPDF(file);
                        }
                    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                        console.log("Extracting text from text file...");
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
                    
                    console.log("Text extraction complete, length:", extractedText ? extractedText.length : 0);
                    
                    // Store extracted text
                    if (!window.uploadedDocuments) {
                        window.uploadedDocuments = {};
                    }
                    
                    window.uploadedDocuments[file.name] = window.uploadedDocuments[file.name] || {};
                    window.uploadedDocuments[file.name].original = extractedText;
                    
                    // Remove any existing OCR preview
                    const existingPreview = targetFileItem.querySelector('.ocr-preview');
                    if (existingPreview) {
                        existingPreview.remove();
                    }
                    
                    // Create OCR text preview container
                    const ocrPreviewContainer = document.createElement('div');
                    ocrPreviewContainer.className = 'file-preview-container ocr-preview';
                    
                    // Add textarea with extracted content
                    const textPreview = document.createElement('textarea');
                    textPreview.readOnly = true;
                    textPreview.value = extractedText || "No text could be extracted from this document.";
                    
                    // Add to container and file item
                    ocrPreviewContainer.appendChild(textPreview);
                    
                    // Add download button below the preview
                    const actionBtns = document.createElement('div');
                    actionBtns.className = 'file-action-buttons';
                    actionBtns.style.marginTop = '10px';
                    actionBtns.style.justifyContent = 'center';
                    
                    // Create download button
                    const downloadBtn = document.createElement('button');
                    downloadBtn.className = 'download-button';
                    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
                    downloadBtn.style.display = 'flex';
                    downloadBtn.style.alignItems = 'center';
                    downloadBtn.style.justifyContent = 'center';
                    downloadBtn.style.gap = '6px';
                    downloadBtn.style.backgroundColor = '#4c84ff';
                    downloadBtn.style.color = 'white';
                    downloadBtn.style.border = 'none';
                    downloadBtn.style.borderRadius = '4px';
                    downloadBtn.style.padding = '6px 12px';
                    downloadBtn.style.fontSize = '0.85rem';
                    downloadBtn.style.cursor = 'pointer';
                    
                    downloadBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (typeof downloadDocument === 'function') {
                            downloadDocument(file.name);
                        } else {
                            alert('Download function not available');
                        }
                    });
                    
                    // Add download button to action container
                    actionBtns.appendChild(downloadBtn);
                    
                    // First add the OCR preview then the download button below it
                    targetFileItem.appendChild(ocrPreviewContainer);
                    targetFileItem.appendChild(actionBtns);
                    
                    // Remove the download button from header if it exists
                    const headerActionBtns = targetFileItem.querySelector('.file-header .file-action-buttons');
                    if (headerActionBtns) {
                        headerActionBtns.remove();
                    }
                    
                    // Clear any automatic messages that might be generated
                    setTimeout(() => {
                        // Find the last bot message that contains a summary of the document
                        const botMessages = document.querySelectorAll('.message.bot');
                        for (let i = botMessages.length - 1; i >= 0; i--) {
                            const message = botMessages[i];
                            if (message.textContent.includes(file.name) && 
                                message.textContent.includes('summary') &&
                                message.textContent.includes('Document type')) {
                                message.remove();
                                break;
                            }
                        }
                    }, 500);
                    
                } catch (error) {
                    console.error("Error in OCR document processing:", error);
                }
            };
            
            console.log("OCR integration fixed successfully");
        } else {
            console.warn("previewFile function not found, OCR integration not applied");
        }
    }, 1000); // Wait for everything to load
}); 