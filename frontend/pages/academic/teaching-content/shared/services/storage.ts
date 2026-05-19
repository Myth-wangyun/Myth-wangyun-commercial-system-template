// 统一数据存储服务
import { STORAGE_KEYS } from '../../constants'

// LocalStorage 操作
export class LocalStorageService {
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error getting item from localStorage: ${key}`, error)
      return null
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting item to localStorage: ${key}`, error)
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing item from localStorage: ${key}`, error)
    }
  }

  static clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage', error)
    }
  }
}

// IndexedDB 操作
export class IndexedDBService {
  private dbName: string = 'AcademicDataDB'
  private version: number = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        const storeNames = Object.values(STORAGE_KEYS)
        storeNames.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' })
            store.createIndex('campus', 'campus', { unique: false })
            store.createIndex('createdAt', 'createdAt', { unique: false })
          }
        })
      }
    })
  }

  async save<T extends { id: string }>(storeName: string, data: T): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put({ ...data, updatedAt: new Date().toISOString() })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`Failed to save data to ${storeName}`))
    })
  }

  async saveAll<T extends { id: string }>(storeName: string, data: T[]): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)

      let completed = 0
      const total = data.length

      if (total === 0) {
        resolve()
        return
      }

      data.forEach((item) => {
        const request = store.put({ ...item, updatedAt: new Date().toISOString() })

        request.onsuccess = () => {
          completed++
          if (completed === total) {
            resolve()
          }
        }

        request.onerror = () => {
          reject(new Error(`Failed to save data to ${storeName}`))
        }
      })
    })
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }
      request.onerror = () => {
        reject(new Error(`Failed to get data from ${storeName}`))
      }
    })
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }
      request.onerror = () => {
        reject(new Error(`Failed to get all data from ${storeName}`))
      }
    })
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`Failed to delete data from ${storeName}`))
    })
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error(`Failed to clear data from ${storeName}`))
    })
  }
}

// 统一存储服务实例
export const storageService = new IndexedDBService()
export const localStorageService = LocalStorageService
