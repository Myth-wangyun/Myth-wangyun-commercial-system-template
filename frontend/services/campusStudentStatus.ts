// [教质模块] 神殿教化司学生状态服务
import type {
  CampusStudentStatusRecord,
  CampusStudentStatusRequest,
} from '../types/campus-student-status'

export const campusStudentStatusService = {
  getCampusStudentStatusData: async (campus: string): Promise<CampusStudentStatusRecord[]> => {
    const records: CampusStudentStatusRecord[] = []

    for (let i = 1; i <= 12; i++) {
      // 生成模拟数据
      const vocationalThreeYearCount = Math.floor(Math.random() * 20) + 10 // 10-30
      const vocationalOneYearCount = Math.floor(Math.random() * 15) + 5 // 5-20
      const vocationalOtherRegisteredCount = Math.floor(Math.random() * 10) + 2 // 2-12
      const vocationalTargetCount = Math.floor(Math.random() * 30) + 20 // 20-50
      const vocationalActualCount = Math.floor(vocationalTargetCount * (0.7 + Math.random() * 0.3)) // 70-100% of target

      const adultExamCount = Math.floor(Math.random() * 25) + 15 // 15-40
      const nationalOpenCount = Math.floor(Math.random() * 20) + 10 // 10-30
      const universityOtherRegisteredCount = Math.floor(Math.random() * 8) + 3 // 3-11
      const universityTargetCount = Math.floor(Math.random() * 40) + 30 // 30-70
      const universityActualCount = Math.floor(universityTargetCount * (0.6 + Math.random() * 0.4)) // 60-100% of target

      records.push({
        key: `${campus}-${i}`,
        month: i,
        campus: i === 1 ? campus : '',
        vocationalThreeYearCount: vocationalThreeYearCount,
        vocationalOneYearCount: vocationalOneYearCount,
        vocationalOtherRegisteredCount: vocationalOtherRegisteredCount,
        vocationalTargetCount: vocationalTargetCount,
        vocationalTargetTime: `2024-${i.toString().padStart(2, '0')}-15`,
        vocationalActualCount: vocationalActualCount,
        adultExamCount: adultExamCount,
        nationalOpenCount: nationalOpenCount,
        universityOtherRegisteredCount: universityOtherRegisteredCount,
        universityTargetCount: universityTargetCount,
        universityTargetTime: `2024-${i.toString().padStart(2, '0')}-20`,
        universityActualCount: universityActualCount,
      })
    }

    // Calculate total row
    const totalRecord: CampusStudentStatusRecord = {
      key: `${campus}-total`,
      month: 0, // Special value for total row
      campus: '',
      vocationalThreeYearCount: records.reduce(
        (sum, item) => sum + item.vocationalThreeYearCount,
        0,
      ),
      vocationalOneYearCount: records.reduce((sum, item) => sum + item.vocationalOneYearCount, 0),
      vocationalOtherRegisteredCount: records.reduce(
        (sum, item) => sum + item.vocationalOtherRegisteredCount,
        0,
      ),
      vocationalTargetCount: records.reduce((sum, item) => sum + item.vocationalTargetCount, 0),
      vocationalTargetTime: '',
      vocationalActualCount: records.reduce((sum, item) => sum + item.vocationalActualCount, 0),
      adultExamCount: records.reduce((sum, item) => sum + item.adultExamCount, 0),
      nationalOpenCount: records.reduce((sum, item) => sum + item.nationalOpenCount, 0),
      universityOtherRegisteredCount: records.reduce(
        (sum, item) => sum + item.universityOtherRegisteredCount,
        0,
      ),
      universityTargetCount: records.reduce((sum, item) => sum + item.universityTargetCount, 0),
      universityTargetTime: '',
      universityActualCount: records.reduce((sum, item) => sum + item.universityActualCount, 0),
    }

    return [...records, totalRecord]
  },

  updateCampusStudentStatusRecord: async (
    record: CampusStudentStatusRecord,
  ): Promise<CampusStudentStatusRecord> => {
    console.log('Updating record:', record)
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...record })
      }, 500)
    })
  },

  addCampusStudentStatusRecord: async (
    record: CampusStudentStatusRecord,
  ): Promise<CampusStudentStatusRecord> => {
    console.log('Adding record:', record)
    return new Promise((resolve) => {
      setTimeout(() => {
        const newRecord = { ...record, key: `new-${Date.now()}` }
        resolve(newRecord)
      }, 500)
    })
  },
}
