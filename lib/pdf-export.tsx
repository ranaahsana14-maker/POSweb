export function generatePDF(htmlContent: string, filename: string) {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // A4 dimensions in pixels (at 96 DPI: 210mm = 794px, 297mm = 1123px)
  const A4_WIDTH = 794
  const A4_HEIGHT = 1123

  canvas.width = A4_WIDTH
  canvas.height = A4_HEIGHT
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT)

  // For production, you'd use a library like html2pdf or jsPDF
  // This is a simplified version
  const link = document.createElement("a")
  link.href = canvas.toDataURL("image/png")
  link.download = filename
  link.click()
}

export function exportTableToPDF(title: string, headers: string[], rows: (string | number)[][], filename: string) {
  // Create a simple table HTML structure
  const html = `
    <html>
      <head>
        <style>
          @page { margin: 20mm; }
          body { font-family: Arial, sans-serif; font-size: 11px; }
          h1 { text-align: center; font-size: 16px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background-color: #f0f0f0; padding: 8px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
          .total-row { background-color: #f9f9f9; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <div class="footer">End of Report</div>
      </body>
    </html>
  `

  const printWindow = window.open("", "", "width=850,height=600")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }
}
