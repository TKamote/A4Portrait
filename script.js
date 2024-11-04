document.addEventListener('DOMContentLoaded', function() {
    // Image upload handling
    const imageCells = document.querySelectorAll('.image-cell');

    imageCells.forEach(cell => {
        const fileInput = cell.querySelector('.file-input');
        const preview = cell.querySelector('.image-preview');
        const previewText = preview.querySelector('.preview-text');

        preview.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.style.backgroundImage = `url(${e.target.result})`;
                    previewText.style.display = 'none';
                    // Store the image data for export
                    preview.dataset.imageData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    });
});

// Add this optimized compression function
function compressImage(imgData) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            // Calculate dimensions for A4 quarter page (with margins)
            const targetWidth = 520; // pixels (roughly 7.5cm at 96dpi)
            const targetHeight = 390; // pixels (roughly 5.5cm at 96dpi)

            // Calculate scaled dimensions
            let [width, height] = calculateAspectRatio(
                img.width,
                img.height,
                targetWidth,
                targetHeight
            );

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            // Use better quality settings
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, width, height);

            // More aggressive compression for smaller file size
            resolve(canvas.toDataURL("image/jpeg", 0.45));
        };
        img.src = imgData;
    });
}

// Helper function to maintain aspect ratio
function calculateAspectRatio(srcWidth, srcHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
    return [srcWidth * ratio, srcHeight * ratio];
}

// Export to Word function
async function exportToWord() {
    try {
        const locationValue = "Workshop"; // You can modify this if needed
        const content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word'>
            <head>
                <meta charset="utf-8">
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0.8cm;
                        mso-page-orientation: portrait;
                    }
                    body {
                        font-family: Arial, sans-serif;
                    }
                    table {
                        border-collapse: collapse;
                        width: auto;
                    }
                    td, th {
                        border: 1px solid black;
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
                    }
                    .col1 { width: 0.5in; }
                    .col2, .col3 { width: 1.5in; }
                    img {
                        width: 100%;
                        height: auto;
                    }
                </style>
            </head>
            <body>
                <table>`;

        // Process and compress all photos first
        const processedPhotos = await Promise.all(
            Array.from(document.querySelectorAll('.image-cell')).map(async (cell) => {
                const preview = cell.querySelector('.image-preview');
                const imageData = preview.dataset.imageData;
                return imageData ? await compressImage(imageData) : null;
            })
        );

        // Get header row
        content += `
            <tr>
                <th>Functional Zone</th>
                <th>Photo Before</th>
                <th>Observation</th>
            </tr>`;

        // Get data rows
        const rows = document.querySelectorAll('table tr:not(:first-child)');
        rows.forEach((row, index) => {
            const zone = row.cells[0].textContent;
            const observation = row.cells[2].querySelector('textarea').value || '';
            const processedImage = processedPhotos[index];

            content += `
                <tr>
                    <td class="col1">${zone}</td>
                    <td class="col2">${processedImage ? `<img src="${processedImage}">` : ''}</td>
                    <td class="col3">${observation.replace(/\n/g, '<br>')}</td>
                </tr>`;
        });

        content += `
                </table>
            </body>
        </html>`;

        // Create and download file
        const blob = new Blob([content], { type: 'application/msword' });
        const fileName = `Inspection_Report_${new Date().toISOString().split('T')[0]}.doc`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 100);

    } catch (error) {
        console.error('Export error:', error);
        alert('Error creating document. Please try again.');
    }
}