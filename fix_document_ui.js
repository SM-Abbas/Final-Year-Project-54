// Fix for document UI issues
document.addEventListener('DOMContentLoaded', function() {
    console.log("Applying document UI fixes...");
    
    // 1. Fix the addDownloadButton function to remove standalone download button
    if (typeof addDownloadButton === 'function') {
        const originalAddDownloadButton = addDownloadButton;
        
        window.addDownloadButton = function(fileName) {
            // Find the file item for this file
            const fileItems = document.querySelectorAll('.file-item');
            let fileItem = null;
            
            for (const item of fileItems) {
                const nameEl = item.querySelector('.file-name-container span');
                if (nameEl && nameEl.textContent === fileName) {
                    fileItem = item;
                    break;
                }
            }
            
            if (!fileItem) return;
            
            // Get the delete button from header if it exists
            const fileHeader = fileItem.querySelector('.file-header');
            const deleteBtn = fileHeader ? fileHeader.querySelector('.delete-file') : null;
            
            // Remove any existing action buttons (standalone download)
            const existingActionBtns = fileItem.querySelectorAll('.file-actions, .file-action-buttons');
            existingActionBtns.forEach(btn => btn.remove());
            
            // Create new action buttons container
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'file-actions';
            actionsDiv.style.cssText = 'display:flex; padding:8px; gap:8px; border-top:1px solid #eee; margin-top:10px;';
            
            // Original download button
            const origBtn = document.createElement('button');
            origBtn.innerHTML = '<i class="fas fa-download"></i> Original';
            origBtn.style.cssText = 'background:#f8f9fa; border:1px solid #dee2e6; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:4px';
            origBtn.onclick = () => downloadDocument(fileName);
            
            // Modified download button (hidden initially)
            const modBtn = document.createElement('button');
            modBtn.innerHTML = '<i class="fas fa-download"></i> Modified';
            modBtn.style.cssText = 'background:#007bff; color:white; border:1px solid #007bff; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.8rem; display:none; align-items:center; gap:4px';
            modBtn.onclick = () => downloadDocument(fileName, true);
            modBtn.id = `mod-btn-${fileName.replace(/[^a-zA-Z0-9]/g, '')}`;
            
            // Add all buttons to container
            actionsDiv.appendChild(origBtn);
            actionsDiv.appendChild(modBtn);
            
            // Add this at the end of all contents in the file item
            fileItem.appendChild(actionsDiv);
            
            // Make sure delete button is still in header
            if (deleteBtn && fileHeader && !fileHeader.querySelector('.delete-file')) {
                fileHeader.appendChild(deleteBtn);
            }
        };
        
        console.log("Modified addDownloadButton to show only Original/Modified buttons");
    }
    
    // 2. Fix the previewFile function to remove duplicate text extracts
    if (typeof previewFile === 'function') {
        const originalPreviewFile = window.previewFile;
        
        window.previewFile = async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Find and remove any existing file preview with the same name
            const existingPreviews = document.querySelectorAll('.file-item');
            existingPreviews.forEach(preview => {
                const fileName = preview.querySelector('.file-name-container span')?.textContent;
                if (fileName === file.name) {
                    preview.remove();
                }
            });
            
            // Now call the original function
            await originalPreviewFile(event);
            
            // For auto-fixes, wait a bit for everything to be ready
            setTimeout(() => {
                // Get the file item
                const fileItems = document.querySelectorAll('.file-item');
                let fileItem = null;
                
                for (const item of fileItems) {
                    const nameEl = item.querySelector('.file-name-container span');
                    if (nameEl && nameEl.textContent === file.name) {
                        fileItem = item;
                        break;
                    }
                }
                
                if (!fileItem) return;
                
                // Make sure delete button is present in header
                const fileHeader = fileItem.querySelector('.file-header');
                
                // Remove duplicate text extracts, but preserve document previews
                const ocrPreviews = fileItem.querySelectorAll('.ocr-preview');
                const documentPreviews = fileItem.querySelectorAll('.file-preview-container:not(.ocr-preview)');
                
                // Only keep the last OCR preview
                if (ocrPreviews.length > 1) {
                    // Keep only the last one
                    for (let i = 0; i < ocrPreviews.length - 1; i++) {
                        ocrPreviews[i].remove();
                    }
                }
                
                // Make sure document preview (PDF/image) is kept
                documentPreviews.forEach(preview => {
                    // Check if it contains an image or PDF object
                    const hasImage = preview.querySelector('img');
                    const hasPdf = preview.querySelector('object[type="application/pdf"]');
                    
                    // Only keep previews with actual content
                    if (!hasImage && !hasPdf) {
                        preview.remove();
                    }
                });
                
                // Make sure download button is modified
                addDownloadButton(file.name);
                
                // Remove any standalone download buttons but keep delete buttons
                const downloadBtns = fileItem.querySelectorAll('.download-button');
                downloadBtns.forEach(btn => {
                    // Only remove if it's a standalone download button (not in file-actions)
                    const parent = btn.parentElement;
                    if (parent && !parent.classList.contains('file-actions')) {
                        // If parent also contains a delete button, just remove the download button
                        const deleteBtn = parent.querySelector('.delete-file');
                        if (deleteBtn) {
                            btn.remove();
                        } else {
                            parent.remove();
                        }
                    }
                });
                
                // Clean up processing indicators
                const processingIndicators = document.querySelectorAll('.processing-indicator');
                processingIndicators.forEach(indicator => indicator.remove());
                
                // Remove auto-generated summary messages
                const botMessages = document.querySelectorAll('.message.bot');
                for (let i = botMessages.length - 1; i >= 0; i--) {
                    const message = botMessages[i];
                    if (message.textContent.includes(file.name) && 
                        message.textContent.includes('Summary')) {
                        message.remove();
                        break;
                    }
                }
            }, 500);
        };
        
        console.log("Modified previewFile to clean up duplicate text extracts");
    }
    
    // Fix any existing document previews
    setTimeout(() => {
        const fileItems = document.querySelectorAll('.file-item');
        fileItems.forEach(fileItem => {
            const fileName = fileItem.querySelector('.file-name-container span')?.textContent;
            if (!fileName) return;
            
            // Remove duplicate text extracts, but preserve document previews
            const ocrPreviews = fileItem.querySelectorAll('.ocr-preview');
            const documentPreviews = fileItem.querySelectorAll('.file-preview-container:not(.ocr-preview)');
            
            // Only keep the last OCR preview
            if (ocrPreviews.length > 1) {
                // Keep only the last one
                for (let i = 0; i < ocrPreviews.length - 1; i++) {
                    ocrPreviews[i].remove();
                }
            }
            
            // Make sure document preview (PDF/image) is kept
            documentPreviews.forEach(preview => {
                // Check if it contains an image or PDF object
                const hasImage = preview.querySelector('img');
                const hasPdf = preview.querySelector('object[type="application/pdf"]');
                
                // Only keep previews with actual content
                if (!hasImage && !hasPdf) {
                    preview.remove();
                }
            });
            
            // Make sure download button is modified
            addDownloadButton(fileName);
            
            // Remove any standalone download buttons but keep delete buttons
            const downloadBtns = fileItem.querySelectorAll('.download-button');
            downloadBtns.forEach(btn => {
                // Only remove if it's a standalone download button (not in file-actions)
                const parent = btn.parentElement;
                if (parent && !parent.classList.contains('file-actions')) {
                    // If parent also contains a delete button, just remove the download button
                    const deleteBtn = parent.querySelector('.delete-file');
                    if (deleteBtn) {
                        btn.remove();
                    } else {
                        parent.remove();
                    }
                }
            });
        });
    }, 1000);
    
    console.log("Document UI fixes applied successfully");
}); 