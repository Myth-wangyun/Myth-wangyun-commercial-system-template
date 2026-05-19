export class ExcelService {
  static async importExcel(file: File): Promise<any[]> {
    const XLSX = await import('xlsx')

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
          }) as any[][]

          resolve(this.processImportedData(jsonData))
        } catch (error) {
          reject(new Error(`Excel file parse failed: ${error}`))
        }
      }

      reader.onerror = () => {
        reject(new Error('File read failed'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  static async exportExcel(config: any): Promise<void> {
    const XLSX = await import('xlsx')

    try {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet([
        config.columns,
        ...config.data.map((row: any) => config.columns.map((col: string) => row[col] || '')),
      ])

      worksheet['!cols'] = config.columns.map(() => ({ wch: 15 }))
      XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName)
      XLSX.writeFile(workbook, `${config.fileName}.xlsx`)
    } catch (error) {
      throw new Error(`Excel export failed: ${error}`)
    }
  }

  private static processImportedData(data: any[][]): any[] {
    if (data.length < 2) {
      return []
    }

    const headers = data[0]
    const rows = data.slice(1)

    return rows.map((row, index) => {
      const item: any = { id: `imported_${Date.now()}_${index}` }

      headers.forEach((header, colIndex) => {
        if (header && row[colIndex] !== undefined) {
          const value = row[colIndex]

          if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
            item[header] = parseFloat(value)
          } else if (typeof value === 'string' && /^\d+$/.test(value)) {
            item[header] = parseInt(value, 10)
          } else {
            item[header] = value
          }
        }
      })

      return item
    })
  }
}
