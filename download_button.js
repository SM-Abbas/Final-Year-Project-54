// Download button and OCR text preview implementation

// Add this to your CSS
/*
.file-action-buttons {
    display: flex;
    align-items: center;
    gap: 8px;
}

.download-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background-color: #4c84ff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.download-button:hover {
    background-color: #3a70e0;
}

body.dark-mode .download-button {
    background-color: #3a70e0;
}

body.dark-mode .download-button:hover {
    background-color: #4c84ff;
}

.ocr-preview {
    margin-top: 10px;
    border-top: 1px solid #e0e0e0;
    padding-top: 10px;
}

.ocr-preview textarea {
    width: 100%;
    min-height: 100px;
    max-height: 200px;
    resize: vertical;
    background: transparent;
    color: #333;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 8px;
    font-family: monospace;
    font-size: 0.9rem;
}

body.dark-mode .ocr-preview textarea {
    color: #eee;
    border-color: #444;
}
*/

// Function to modify the previewFile function
document.addEventListener('DOMContentLoaded', function() {
    // Store original previewFile function
    if (window.previewFile) {
        const originalPreviewFile = window.previewFile;
        
        // Replace with our enhanced version
        window.previewFile = async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Call original function first
            originalPreviewFile(event);
            
            // Get the file item that was just created
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
            const fileHeader = targetFileItem.querySelector('.file-header');
            if (fileHeader) {
                const deleteBtn = fileHeader.querySelector('.delete-file');
                
                // Create action buttons container
                const actionBtns = document.createElement('div');
                actionBtns.className = 'file-action-buttons';
                
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
                
                // If there's a delete button, move it to action buttons
                if (deleteBtn) {
                    fileHeader.removeChild(deleteBtn);
                    actionBtns.appendChild(downloadBtn);
                    actionBtns.appendChild(deleteBtn);
                    fileHeader.appendChild(actionBtns);
                } else {
                    actionBtns.appendChild(downloadBtn);
                    fileHeader.appendChild(actionBtns);
                }
            }
            
            // Show processing indicator
            const processingIndicator = typeof showProcessingIndicator === 'function' ? 
                showProcessingIndicator(file.name) : null;
            
            try {
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
                
                // Create OCR text preview container
                const ocrPreviewContainer = document.createElement('div');
                ocrPreviewContainer.className = 'file-preview-container ocr-preview';
                ocrPreviewContainer.style.marginTop = '10px';
                ocrPreviewContainer.style.borderTop = '1px solid #e0e0e0';
                ocrPreviewContainer.style.paddingTop = '10px';
                
                // Add textarea with extracted content
                const textPreview = document.createElement('textarea');
                textPreview.readOnly = true;
                textPreview.value = extractedText || "No text could be extracted from this document.";
                textPreview.style.width = '100%';
                textPreview.style.minHeight = '100px';
                textPreview.style.maxHeight = '200px';
                textPreview.style.resize = 'vertical';
                textPreview.style.background = 'transparent';
                textPreview.style.border = '1px solid #e0e0e0';
                textPreview.style.borderRadius = '4px';
                textPreview.style.padding = '8px';
                textPreview.style.fontFamily = 'monospace';
                textPreview.style.fontSize = '0.9rem';
                
                // Add to container and file item
                ocrPreviewContainer.appendChild(textPreview);
                targetFileItem.appendChild(ocrPreviewContainer);
                
                // Show success message
                if (typeof showNotification === 'function') {
                    showNotification(`Text extracted from ${file.name}`, "success");
                }
                
            } catch (error) {
                console.error("Error processing document:", error);
                if (typeof showNotification === 'function') {
                    showNotification(`Error processing ${file.name}: ${error.message}`, "error");
                }
            } finally {
                // Hide processing indicator
                if (processingIndicator && typeof hideProcessingIndicator === 'function') {
                    hideProcessingIndicator();
                }
            }
        };
    }
    
    // Ensure downloadDocument function exists
    if (!window.downloadDocument) {
        window.downloadDocument = function(fileName) {
            if (!window.uploadedDocuments || !window.uploadedDocuments[fileName]) return;
            
            const content = window.uploadedDocuments[fileName].original || 
                          window.uploadedDocuments[fileName].content;
            
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
            element.download = fileName;
            
            // Trigger download
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        };
    }
});
