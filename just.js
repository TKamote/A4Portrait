// Image handling
document.addEventListener('DOMContentLoaded', function() {
    const imageCells = document.querySelectorAll('.image-cell');

    imageCells.forEach(cell => {
        const fileInput = cell.querySelector('.file-input');
        const preview = cell.querySelector('.image-preview');
        const previewText = preview.querySelector('.preview-text');

        preview.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    return;
                }

                const reader = new FileReader();
                reader.onload = async function(e) {
                    // Preview styling with full coverage
                    preview.style.backgroundImage = `url(${e.target.result})`;
                    preview.style.backgroundSize = 'cover';
                    preview.style.backgroundPosition = 'center';
                    preview.style.width = '100%';
                    preview.style.height = '100%';
                    previewText.style.display = 'none';
                    
                    // Compress and store for export
                    const compressedImage = await compressImage(e.target.result);
                    preview.dataset.compressedImage = compressedImage;
                };
                reader.readAsDataURL(file);
            }
        });
    });
});

function compressImage(imgData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            
            // Set exact dimensions in pixels (at 96 DPI)
            const targetWidth = Math.round(1.62 * 96);  // 155 pixels
            const targetHeight = Math.round(1.215 * 96); // 116 pixels
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            const ctx = canvas.getContext('2d');
            
            // Fill background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            
            // Calculate dimensions to cover the entire space
            const imgRatio = img.width / img.height;
            const targetRatio = targetWidth / targetHeight;
            
            let drawWidth = targetWidth;
            let drawHeight = targetHeight;
            let offsetX = 0;
            let offsetY = 0;
            
            if (imgRatio > targetRatio) {
                // Image is wider than target area
                drawHeight = targetWidth / imgRatio;
                offsetY = (targetHeight - drawHeight) / 2;
            } else {
                // Image is taller than target area
                drawWidth = targetHeight * imgRatio;
                offsetX = (targetWidth - drawWidth) / 2;
            }
            
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            
            // Convert to JPEG with low quality for smaller file size
            resolve(canvas.toDataURL('image/jpeg', 0.3));
        };
        img.src = imgData;
    });
}

function exportToWord() {
    try {
        let content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word'>
            <head>
                <meta charset="utf-8">
                <style>
                    @page { size: A4 portrait; margin: 1cm; }
                    table { border-collapse: collapse; width: auto; }
                    td, th { 
                        border: 0.5px solid #333;
                        padding: 5px;
                        font-size: 11px;
                        vertical-align: middle;
                    }
                    th { 
                        background-color: #f2f2f2;
                        height: 0.3in;
                    }
                    td { 
                        height: 1.215in;
                        padding: 0;
                    }
                    .col1 { width: 0.5in; }
                    .col2, .col3 { width: 1.5in; }
                    img {
                        width: 1.62in !important;
                        height: 1.215in !important;
                        display: block;
                        object-fit: cover;
                    }
                </style>
            </head>
            <body>
                <table>`;

        // Add header
        content += `
            <tr>
                <th>Functional Zone</th>
                <th>Photo Before</th>
                <th>Observation</th>
            </tr>`;

        // Process rows
        const rows = document.querySelectorAll('table tr:not(:first-child)');
        rows.forEach(row => {
            const zone = row.cells[0].textContent;
            const imagePreview = row.cells[1].querySelector('.image-preview');
            const observation = row.cells[2].querySelector('textarea').value || '';
            
            const imageData = imagePreview.dataset.compressedImage || '';
            
            content += `
                <tr>
                    <td class="col1">${zone}</td>
                    <td class="col2">${imageData ? `<img src="${imageData}" style="width:1.62in;height:1.215in;object-fit:cover;">` : ''}</td>
                    <td class="col3">${observation.replace(/\n/g, '<br>')}</td>
                </tr>`;
        });

        content += `
                </table>
            </body>
        </html>`;

        const blob = new Blob([content], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `inspection_report_${new Date().toISOString().split('T')[0]}.doc`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(link.href), 100);

    } catch (error) {
        console.error('Export error:', error);
        alert('Error creating document. Please try again.');
    }
}