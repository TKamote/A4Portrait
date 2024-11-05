document.addEventListener('DOMContentLoaded', function() {
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
                    preview.style.backgroundSize = 'cover';
                    preview.style.backgroundPosition = 'center';
                    previewText.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    });
});

function exportToWord() {
    try {
        const header = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
            <head>
                <meta charset="utf-8">
                <style>
                    table { border-collapse: collapse; width: 3.5in; }
                    td, th { 
                        border: 0.5px solid #333; 
                        padding: 5px; 
                        font-size: 11px; 
                    }
                    th { 
                        background-color: #f2f2f2; 
                        height: 0.3in; 
                    }
                    td { height: 1.215in; }
                    .col1 { width: 0.5in; }
                    .col2, .col3 { width: 1.5in; }
                </style>
            </head>
            <body>`;

        // Get table content
        const table = document.querySelector('table');
        const tableHtml = table.outerHTML;

        // Combine content
        const htmlContent = header + tableHtml + '</body></html>';

        // Create download
        const blob = new Blob([htmlContent], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'inspection_report.doc';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Export error:', error);
        alert('Error creating document. Please try again.');
    }
}