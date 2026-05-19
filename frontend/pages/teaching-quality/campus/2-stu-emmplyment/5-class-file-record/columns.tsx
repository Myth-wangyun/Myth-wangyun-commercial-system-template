// 班级档案表 - 表格列定义

import React from 'react'
import { Input, Select, DatePicker, AutoComplete, Button, Space, Tag, Tooltip, Popconfirm } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DeleteOutlined } from '@ant-design/icons'
import { validateIdCard, validatePhone } from '@/utils/validation'
import { getCampusNamesWithFallback } from '@/stores/campusStore'
import dayjs from 'dayjs'
import type { ClassFileRecordRow, FormerHeadTeacher } from './types'
import { GENDER_OPTIONS, YES_NO_OPTIONS, STUDENT_STATUS_OPTIONS, EMPLOYMENT_APPROVAL_STATUS_OPTIONS, REGISTRATION_STATUS_OPTIONS } from './constants'
import { getCampusSourceOptions } from './utils'

const { Option } = Select

interface ColumnsParams {
  handleChange: (key: string, field: keyof ClassFileRecordRow, value: string) => void
  handleDelete: (key: string) => void
  getMajorOptionsForRow: (record: ClassFileRecordRow) => string[]
  majorsByCampus: Record<string, string[]>
  getMajorsForCampus: (campusName: string) => Promise<string[]>
  handleOpenFormerTeacherModal: (record: ClassFileRecordRow) => void
  registerCellRef: (rowIndex: number, columnKey: string, element: HTMLElement | null) => void
  handleKeyDown: (e: React.KeyboardEvent, rowIndex: number, columnKey: string) => void
}

export const createColumns = ({
  handleChange,
  handleDelete,
  getMajorOptionsForRow,
  majorsByCampus,
  getMajorsForCampus,
  handleOpenFormerTeacherModal,
  registerCellRef,
  handleKeyDown,
}: ColumnsParams): ColumnsType<ClassFileRecordRow> => [
  {
    title: '序号',
    dataIndex: 'serialNumber',
    key: 'serialNumber',
    width: 70,
    fixed: 'left',
    align: 'center',
  },
  {
    title: '姓名',
    dataIndex: 'name',
    key: 'name',
    width: 100,
    fixed: 'left',
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'name', el)}>
        <Input 
          value={text} 
          onChange={(e) => handleChange(record.key, 'name', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'name')}
        />
      </div>
    ),
  },
  {
    title: '性别',
    dataIndex: 'gender',
    key: 'gender',
    width: 80,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'gender', el)}>
        <Select
          allowClear
          value={text || undefined}
          style={{ width: '100%' }}
          onChange={(v) => handleChange(record.key, 'gender', v === undefined ? '' : v)}
          onKeyDown={(e) => handleKeyDown(e, index, 'gender')}
        >
          {GENDER_OPTIONS.map((g) => (
            <Option key={g} value={g}>
              {g}
            </Option>
          ))}
        </Select>
      </div>
    ),
  },
  {
    title: '身份证号',
    dataIndex: 'idCard',
    key: 'idCard',
    width: 180,
    align: 'center',
    render: (text, record, index) => {
      const error = text ? validateIdCard(text) : null
      return (
        <div ref={(el) => registerCellRef(index, 'idCard', el)}>
          <Input 
            value={text} 
            onChange={(e) => handleChange(record.key, 'idCard', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index, 'idCard')}
            status={error ? 'error' : ''}
            title={error || ''}
            placeholder="请输入18位身份证号"
          />
        </div>
      )
    },
  },
  {
    title: '入学时间',
    dataIndex: 'enrollmentDate',
    key: 'enrollmentDate',
    width: 120,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'enrollmentDate', el)}>
        <DatePicker
          value={text ? dayjs(text) : null}
          onChange={(date) =>
            handleChange(record.key, 'enrollmentDate', date ? date.format('YYYY-MM-DD') : '')
          }
          onKeyDown={(e) => handleKeyDown(e, index, 'enrollmentDate')}
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
          placeholder="选择日期"
        />
      </div>
    ),
  },
  {
    title: '开班时间',
    dataIndex: 'openingDate',
    key: 'openingDate',
    width: 120,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'openingDate', el)}>
        <DatePicker
          value={text ? dayjs(text) : null}
          onChange={(date) =>
            handleChange(record.key, 'openingDate', date ? date.format('YYYY-MM-DD') : '')
          }
          onKeyDown={(e) => handleKeyDown(e, index, 'openingDate')}
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
          placeholder="选择日期"
        />
      </div>
    ),
  },
  {
    title: '入学年龄',
    dataIndex: 'enrollmentAge',
    key: 'enrollmentAge',
    width: 90,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'enrollmentAge', el)}>
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'enrollmentAge', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'enrollmentAge')}
        />
      </div>
    ),
  },
  {
    title: '学历',
    dataIndex: 'education',
    key: 'education',
    width: 90,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'education', el)}>
        <AutoComplete
          value={text}
          options={[
            { value: '初中' },
            { value: '高中' },
            { value: '中专' },
            { value: '大专' },
            { value: '本科' },
            { value: '研究生' },
            { value: '其他' },
          ]}
          onChange={(value) => handleChange(record.key, 'education', value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'education')}
          placeholder="请选择或输入"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ width: '100%' }}
        />
      </div>
    ),
  },
  {
    title: '毕业时间',
    dataIndex: 'graduationDate',
    key: 'graduationDate',
    width: 120,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'graduationDate', el)}>
        <DatePicker
          value={text ? dayjs(text) : null}
          onChange={(date) =>
            handleChange(record.key, 'graduationDate', date ? date.format('YYYY-MM-DD') : '')
          }
          onKeyDown={(e) => handleKeyDown(e, index, 'graduationDate')}
          format="YYYY-MM-DD"
          style={{ width: '100%' }}
          placeholder="选择日期"
        />
      </div>
    ),
  },
  {
    title: '毕业年龄',
    dataIndex: 'graduationAge',
    key: 'graduationAge',
    width: 90,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'graduationAge', el)}>
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'graduationAge', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'graduationAge')}
        />
      </div>
    ),
  },
  {
    title: '毕业所获最高学历证书及性质',
    dataIndex: 'highestEducationAndType',
    key: 'highestEducationAndType',
    width: 260,
    align: 'left',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'highestEducationAndType', el)}>
        <AutoComplete
          value={text}
          options={[
            { value: '初中' },
            { value: '高中' },
            { value: '中专' },
            { value: '大专' },
            { value: '本科' },
            { value: '研究生' },
            { value: '其他' },
          ]}
          onChange={(value) => handleChange(record.key, 'highestEducationAndType', value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'highestEducationAndType')}
          placeholder="请选择或输入"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ width: '100%' }}
        />
      </div>
    ),
  },
  {
    title: '神殿来源',
    dataIndex: 'campusSource',
    key: 'campusSource',
    width: 140,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'campusSource', el)}>
        <AutoComplete
          value={text}
          options={getCampusSourceOptions()}
          onChange={(value) => handleChange(record.key, 'campusSource', value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'campusSource')}
          placeholder="请选择或输入"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ width: '100%' }}
        />
      </div>
    ),
  },
  {
    title: '招生神殿',
    dataIndex: 'enrollmentCampus',
    key: 'enrollmentCampus',
    width: 140,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'enrollmentCampus', el)}>
        <AutoComplete
          value={text}
          options={getCampusNamesWithFallback().map(value => ({ value }))}
          onChange={(value) => handleChange(record.key, 'enrollmentCampus', value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'enrollmentCampus')}
          placeholder="请选择或输入"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ width: '100%' }}
        />
      </div>
    ),
  },
  {
    title: '咨询师',
    dataIndex: 'consultant',
    key: 'consultant',
    width: 120,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'consultant', el)}>
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'consultant', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'consultant')}
        />
      </div>
    ),
  },
  {
    title: '所报专业',
    dataIndex: 'reportedMajor',
    key: 'reportedMajor',
    width: 140,
    align: 'center',
    render: (text, record, index) => {
      const majorOptions = getMajorOptionsForRow(record).map(value => ({ value }))
      return (
        <div ref={(el) => registerCellRef(index, 'reportedMajor', el)}>
          <AutoComplete
            value={text}
            options={majorOptions}
            onChange={(value) => handleChange(record.key, 'reportedMajor', value)}
            onKeyDown={(e) => handleKeyDown(e, index, 'reportedMajor')}
            placeholder="请选择或输入"
            filterOption={(inputValue, option) =>
              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
            style={{ width: '100%' }}
            onFocus={async () => {
              // 焦点进入时，如果还没加载神殿的专业，立即加载
              const campusesToLoad: string[] = []
              if (record.enrollmentCampus && !majorsByCampus[record.enrollmentCampus]) {
                campusesToLoad.push(record.enrollmentCampus)
              }
              if (record.campusSource && !majorsByCampus[record.campusSource]) {
                campusesToLoad.push(record.campusSource)
              }
              for (const campus of campusesToLoad) {
                await getMajorsForCampus(campus)
              }
            }}
          />
        </div>
      )
    },
  },
  {
    title: '学制',
    dataIndex: 'schoolingLength',
    key: 'schoolingLength',
    width: 90,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'schoolingLength', el)}>
        <AutoComplete
          value={text}
          options={[
            { value: '6个月' },
            { value: '20个月' },
            { value: '两年制' },
            { value: '三年制' },
            { value: '其他' },
          ]}
          onChange={(value) => handleChange(record.key, 'schoolingLength', value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'schoolingLength')}
          placeholder="请选择或输入"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ width: '100%' }}
        />
      </div>
    ),
  },
  {
    title: '应收学费金额',
    dataIndex: 'tuitionAmount',
    key: 'tuitionAmount',
    width: 140,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'tuitionAmount', el)}>
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'tuitionAmount', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'tuitionAmount')}
        />
      </div>
    ),
  },
  {
    title: '班主任姓名',
    dataIndex: 'headTeacher',
    key: 'headTeacher',
    width: 130,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'headTeacher', el)}>
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'headTeacher', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'headTeacher')}
        />
      </div>
    ),
  },
  {
    title: '往任班主任',
    dataIndex: 'formerHeadTeachers',
    key: 'formerHeadTeachers',
    width: 250,
    align: 'center',
    render: (value: FormerHeadTeacher[], record) => {
      // 按结束时间倒序排序（最近的在前）
      const sortedList = [...(value || [])].sort((a, b) => {
        if (!a.endDate) return -1
        if (!b.endDate) return 1
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      })
      
      return (
        <Space size={4} wrap>
          {sortedList.map((item, idx) => (
            <Tooltip 
              key={idx}
              title={
                <div>
                  <div>姓名：{item.name}</div>
                  <div>任期：{item.startDate || '未设置'} 至 {item.endDate || '未设置'}</div>
                </div>
              }
            >
              <Tag color="blue">{item.name}</Tag>
            </Tooltip>
          ))}
          <Button 
            size="small" 
            type="link" 
            onClick={() => handleOpenFormerTeacherModal(record)}
          >
            {sortedList.length > 0 ? '编辑' : '添加'}
          </Button>
        </Space>
      )
    },
  },
  {
    title: '学员状态',
    dataIndex: 'studentStatus',
    key: 'studentStatus',
    width: 120,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'studentStatus', el)}>
        <AutoComplete
          value={text}
          options={STUDENT_STATUS_OPTIONS.map(value => ({ value }))}
          onChange={(value) => handleChange(record.key, 'studentStatus', value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'studentStatus')}
          placeholder="请选择学员状态"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ width: '100%' }}
        />
      </div>
    ),
  },
  {
    title: '过往专业',
    dataIndex: 'previousMajor',
    key: 'previousMajor',
    width: 140,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'previousMajor', el)}>
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'previousMajor', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'previousMajor')}
        />
      </div>
    ),
  },
  {
    title: '毕业学校',
    dataIndex: 'graduateSchool',
    key: 'graduateSchool',
    width: 160,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'graduateSchool', el)}>
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'graduateSchool', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'graduateSchool')}
        />
      </div>
    ),
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    key: 'phone',
    width: 140,
    align: 'center',
    render: (text, record, index) => {
      const error = text ? validatePhone(text) : null
      return (
        <div ref={(el) => registerCellRef(index, 'phone', el)}>
          <Input 
            value={text} 
            onChange={(e) => handleChange(record.key, 'phone', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index, 'phone')}
            status={error ? 'error' : ''}
            title={error || ''}
            placeholder="请输入11位手机号"
          />
        </div>
      )
    },
  },
  {
    title: '家长电话',
    dataIndex: 'parentPhone',
    key: 'parentPhone',
    width: 140,
    align: 'center',
    render: (text, record, index) => {
      const error = text ? validatePhone(text) : null
      return (
        <div ref={(el) => registerCellRef(index, 'parentPhone', el)}>
          <Input
            value={text}
            onChange={(e) => handleChange(record.key, 'parentPhone', e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index, 'parentPhone')}
            status={error ? 'error' : ''}
            title={error || ''}
            placeholder="请输入11位手机号"
          />
        </div>
      )
    },
  },
  {
    title: '通信地址',
    dataIndex: 'address',
    key: 'address',
    width: 260,
    align: 'left',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'address', el)}>
        <Input 
          value={text} 
          onChange={(e) => handleChange(record.key, 'address', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'address')}
        />
      </div>
    ),
  },
  {
    title: '户口性质',
    dataIndex: 'householdType',
    key: 'householdType',
    width: 120,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'householdType', el)}>
        <AutoComplete
          value={text}
          options={[
            { value: '农村' },
            { value: '城镇' },
            { value: '居民' },
          ]}
          onChange={(value) => handleChange(record.key, 'householdType', value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'householdType')}
          placeholder="请选择或输入"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ width: '100%' }}
        />
      </div>
    ),
  },
  {
    title: '就读方式',
    dataIndex: 'studyMode',
    key: 'studyMode',
    width: 120,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'studyMode', el)}>
        <AutoComplete
          value={text}
          options={[
            { value: '住宿' },
            { value: '走读' },
          ]}
          onChange={(value) => handleChange(record.key, 'studyMode', value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'studyMode')}
          placeholder="请选择或输入"
          filterOption={(inputValue, option) =>
            option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          }
          style={{ width: '100%' }}
        />
      </div>
    ),
  },
  {
    title: '现住址',
    dataIndex: 'currentAddress',
    key: 'currentAddress',
    width: 220,
    align: 'left',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'currentAddress', el)}>
        <Input
          value={text}
          onChange={(e) => handleChange(record.key, 'currentAddress', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'currentAddress')}
        />
      </div>
    ),
  },
  {
    title: '是否承诺注册学历',
    dataIndex: 'promisedRegisterEducation',
    key: 'promisedRegisterEducation',
    width: 160,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'promisedRegisterEducation', el)}>
        <Select
          allowClear
          value={text || undefined}
          style={{ width: '100%' }}
          onChange={(v) =>
            handleChange(record.key, 'promisedRegisterEducation', v === undefined ? '' : v)
          }
          onKeyDown={(e) => handleKeyDown(e, index, 'promisedRegisterEducation')}
        >
          {YES_NO_OPTIONS.map((v) => (
            <Option key={v} value={v}>
              {v}
            </Option>
          ))}
        </Select>
      </div>
    ),
  },
  {
    title: '承诺注册学历性质',
    dataIndex: 'promisedEducationNature',
    key: 'promisedEducationNature',
    width: 150,
    align: 'left',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'promisedEducationNature', el)}>
        <Input
          value={text}
          placeholder="如：全日制"
          onChange={(e) => handleChange(record.key, 'promisedEducationNature', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'promisedEducationNature')}
        />
      </div>
    ),
  },
  {
    title: '承诺注册学历级别',
    dataIndex: 'promisedEducationLevel',
    key: 'promisedEducationLevel',
    width: 150,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'promisedEducationLevel', el)}>
        <Select
          allowClear
          value={text || undefined}
          style={{ width: '100%' }}
          onChange={(v) =>
            handleChange(record.key, 'promisedEducationLevel', v === undefined ? '' : v)
          }
          onKeyDown={(e) => handleKeyDown(e, index, 'promisedEducationLevel')}
          placeholder="请选择"
        >
          <Option value="中专1年">中专1年</Option>
          <Option value="中专3年">中专3年</Option>
          <Option value="其他中等教育">其他中等教育</Option>
          <Option value="成考">成考</Option>
          <Option value="国开">国开</Option>
          <Option value="其他高等教育">其他高等教育</Option>
        </Select>
      </div>
    ),
  },
  {
    title: '学历学校名称',
    dataIndex: 'educationSchoolName',
    key: 'educationSchoolName',
    width: 220,
    align: 'left',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'educationSchoolName', el)}>
        <Input
          value={text}
          placeholder="如：清美动漫学校"
          onChange={(e) => handleChange(record.key, 'educationSchoolName', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'educationSchoolName')}
        />
      </div>
    ),
  },
  {
    title: '是否已注册中专/大专',
    dataIndex: 'registeredSecondaryOrCollege',
    key: 'registeredSecondaryOrCollege',
    width: 180,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'registeredSecondaryOrCollege', el)}>
        <Select
          allowClear
          value={text || undefined}
          style={{ width: '100%' }}
          onChange={(v) =>
            handleChange(record.key, 'registeredSecondaryOrCollege', v === undefined ? '' : v)
          }
          onKeyDown={(e) => handleKeyDown(e, index, 'registeredSecondaryOrCollege')}
          placeholder="请选择"
        >
          {REGISTRATION_STATUS_OPTIONS.map((v) => (
            <Option key={v} value={v}>
              {v}
            </Option>
          ))}
        </Select>
      </div>
    ),
  },
  {
    title: '所注册学校',
    dataIndex: 'registeredSchool',
    key: 'registeredSchool',
    width: 220,
    align: 'left',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'registeredSchool', el)}>
        <Input
          value={text}
          placeholder="如：石家庄清美动漫软件职业技术学校"
          onChange={(e) => handleChange(record.key, 'registeredSchool', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'registeredSchool')}
        />
      </div>
    ),
  },
  {
    title: '备注',
    dataIndex: 'remark',
    key: 'remark',
    width: 260,
    align: 'left',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'remark', el)}>
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 3 }}
          value={text}
          placeholder="休学/退学/复学等说明，按备注规范填写"
          onChange={(e) => handleChange(record.key, 'remark', e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, index, 'remark')}
        />
      </div>
    ),
  },
  {
    title: '审批无需就业',
    dataIndex: 'employmentApprovalStatus',
    key: 'employmentApprovalStatus',
    width: 140,
    align: 'center',
    render: (text, record, index) => (
      <div ref={(el) => registerCellRef(index, 'employmentApprovalStatus', el)}>
        <Select
          allowClear
          value={text || undefined}
          style={{ width: '100%' }}
          onChange={(v) =>
            handleChange(record.key, 'employmentApprovalStatus', v === undefined ? '' : v)
          }
          onKeyDown={(e) => handleKeyDown(e, index, 'employmentApprovalStatus')}
          placeholder="请选择"
        >
          {EMPLOYMENT_APPROVAL_STATUS_OPTIONS.map((v) => (
            <Option key={v} value={v}>
              {v}
            </Option>
          ))}
        </Select>
      </div>
    ),
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    fixed: 'right',
    align: 'center',
    render: (_, record) => (
      <Popconfirm
        title="确定要删除这条记录吗？"
        onConfirm={() => handleDelete(record.key)}
        okText="确定"
        cancelText="取消"
      >
        <Button type="link" danger icon={<DeleteOutlined />} size="small">
          删除
        </Button>
      </Popconfirm>
    ),
  },
]
