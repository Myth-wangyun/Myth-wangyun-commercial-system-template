import { appMessage } from '@/utils/antdStatic'

type ExportRow = Record<string, unknown>

const formatExportCell = (value: unknown): string | number => {
  if (typeof value === 'string') {
    return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (value == null) {
    return ''
  }

  return String(value)
}

// 导出Excel文件
export const exportToExcel = (data: ExportRow[], filename: string, headers?: string[]) => {
  try {
    // 这里可以使用 xlsx 库来实现Excel导出
    // 暂时使用简单的CSV格式
    exportToCSV(data, filename, headers)
  } catch (error) {
    appMessage().error('导出失败')
    console.error('导出Excel失败:', error)
  }
}

// 导出CSV文件
export const exportToCSV = (data: ExportRow[], filename: string, headers?: string[]) => {
  try {
    if (!data || data.length === 0) {
      appMessage().warning('没有数据可导出')
      return
    }

    // 获取所有字段名
    const fields = headers || Object.keys(data[0])

    // 创建CSV内容
    const csvContent = [
      // 表头
      fields.join(','),
      // 数据行
      ...data.map((row) =>
        fields
          .map((field) => formatExportCell(row[field]))
          .join(','),
      ),
    ].join('\n')

    // 创建Blob并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    appMessage().success('导出成功')
  } catch (error) {
    appMessage().error('导出失败')
    console.error('导出CSV失败:', error)
  }
}

// 导出JSON文件
export const exportToJSON = (data: ExportRow[], filename: string) => {
  try {
    if (!data || data.length === 0) {
      appMessage().warning('没有数据可导出')
      return
    }

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    appMessage().success('导出成功')
  } catch (error) {
    appMessage().error('导出失败')
    console.error('导出JSON失败:', error)
  }
}

// 打印数据
export const printData = (data: ExportRow[], title: string) => {
  try {
    if (!data || data.length === 0) {
      appMessage().warning('没有数据可打印')
      return
    }

    // 创建打印内容
    const printContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                ${Object.keys(data[0])
                  .map((key) => `<th>${key}</th>`)
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) =>
                    `<tr>${Object.values(row)
                      .map((value) => `<td>${value || ''}</td>`)
                      .join('')}</tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    // 打开新窗口打印
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.open()
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  } catch (error) {
    appMessage().error('打印失败')
    console.error('打印失败:', error)
  }
}
