// [通用模块] 数据服务 - 公共模块，供所有模块使用
import type { DataRecord, ApiResponse, DashboardStats } from '../types'

// 模拟数据
const mockData: DataRecord[] = [
  {
    id: '1',
    name: '项目A',
    category: '开发',
    value: 100000,
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:20:00Z',
    description: '主要开发项目',
  },
  {
    id: '2',
    name: '项目B',
    category: '测试',
    value: 75000,
    status: 'pending',
    createdAt: '2024-01-18T09:15:00Z',
    updatedAt: '2024-01-22T16:45:00Z',
    description: '测试阶段项目',
  },
  {
    id: '3',
    name: '项目C',
    category: '维护',
    value: 50000,
    status: 'inactive',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-25T11:30:00Z',
    description: '维护项目',
  },
  {
    id: '4',
    name: '项目D',
    category: '开发',
    value: 120000,
    status: 'active',
    createdAt: '2024-01-20T13:45:00Z',
    updatedAt: '2024-01-23T09:15:00Z',
    description: '新开发项目',
  },
  {
    id: '5',
    name: '项目E',
    category: '设计',
    value: 30000,
    status: 'pending',
    createdAt: '2024-01-22T15:20:00Z',
    updatedAt: '2024-01-24T12:00:00Z',
    description: '设计项目',
  },
]

// 模拟API延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class DataService {
  private data: DataRecord[] = [...mockData]

  // 获取所有数据
  async getAllData(): Promise<ApiResponse<DataRecord[]>> {
    await delay(500)
    return {
      success: true,
      data: [...this.data],
      total: this.data.length,
    }
  }

  // 根据ID获取数据
  async getDataById(id: string): Promise<ApiResponse<DataRecord | null>> {
    await delay(300)
    const record = this.data.find((item) => item.id === id)
    return {
      success: true,
      data: record || null,
    }
  }

  // 创建新数据
  async createData(
    data: Omit<DataRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ApiResponse<DataRecord>> {
    await delay(400)
    const newRecord: DataRecord = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.data.push(newRecord)
    return {
      success: true,
      data: newRecord,
      message: '数据创建成功',
    }
  }

  // 更新数据
  async updateData(
    id: string,
    data: Partial<Omit<DataRecord, 'id' | 'createdAt'>>,
  ): Promise<ApiResponse<DataRecord>> {
    await delay(400)
    const index = this.data.findIndex((item) => item.id === id)
    if (index === -1) {
      return {
        success: false,
        data: null as any,
        message: '数据不存在',
      }
    }

    this.data[index] = {
      ...this.data[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    return {
      success: true,
      data: this.data[index],
      message: '数据更新成功',
    }
  }

  // 删除数据
  async deleteData(id: string): Promise<ApiResponse<boolean>> {
    await delay(300)
    const index = this.data.findIndex((item) => item.id === id)
    if (index === -1) {
      return {
        success: false,
        data: false,
        message: '数据不存在',
      }
    }

    this.data.splice(index, 1)
    return {
      success: true,
      data: true,
      message: '数据删除成功',
    }
  }

  // 获取统计数据
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    await delay(200)
    const totalRecords = this.data.length
    const activeRecords = this.data.filter((item) => item.status === 'active').length
    const inactiveRecords = this.data.filter((item) => item.status === 'inactive').length
    const pendingRecords = this.data.filter((item) => item.status === 'pending').length
    const totalValue = this.data.reduce((sum, item) => sum + item.value, 0)
    const averageValue = totalRecords > 0 ? totalValue / totalRecords : 0

    return {
      success: true,
      data: {
        totalRecords,
        activeRecords,
        inactiveRecords,
        pendingRecords,
        totalValue,
        averageValue,
      },
    }
  }

  // 搜索数据
  async searchData(query: string): Promise<ApiResponse<DataRecord[]>> {
    await delay(300)
    const filteredData = this.data.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()),
    )

    return {
      success: true,
      data: filteredData,
      total: filteredData.length,
    }
  }
}

export const dataService = new DataService()
