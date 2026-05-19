/**
 * 神殿教化司班主任标准化检查表页面（已接入后端 API）
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { App,
  Card,
  Table,
  Button,
  Space,
  Checkbox,
  DatePicker,
  ConfigProvider,
  AutoComplete,
  Modal,
  Input,
} from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import dayjs, { Dayjs } from 'dayjs';

import { buildApiUrl } from '@/utils/apiBase';
import { fetchHomeroomTeachers } from '@/services/configMaster';

// 项目列表（顺序即序号）
const projectItems = [
  '日工单',
  '检查出勤',
  '课前五分钟',
  '检查卫生',
  '检查违规',
  '千分制',
  '巡班',
  '检查职业装',
  '搜集宣传素材',
  '学员访谈',
  '家长访谈',
  '催费',
  '日提升',
  '了解作业情况',
  '监督上自习(晚自习)',
  '送住宿',
  '查宿舍',
  '班会',
  '班委会',
  '常规听课',
  '素质训练课',
  '组织小班辅导',
  '监督学习小组',
  '(口碑)班级活动',
  '主题班会',
  '考试',
  '开新班',
  '做月总结计划',
  '提交预算',
  '帮助其他班主任盯班',
  '硬件设施保管(笔记本,椅子)',
  '收手机',
  '特殊学员书面申请',
  '放假前后通知',
  '开学第一课',
  '毕业典礼',
  '班级情况交接',
];

// 班主任标准化检查记录接口
interface StandardizationRecord {
  key: string;
  serialNumber: number; // 序号
  project: string; // 项目
  days: { [day: number]: boolean }; // 1..31
}

interface RowOutput {
  记录ID: number;
  序号: number;
  项目: string;
  班主任?: string | null;
  日期?: string | null;
  天数: Record<string, boolean>;
}

interface ListOutput {
  神殿名称: string;
  年份: number;
  月份: number;
  班主任?: string | null;
  日期?: string | null;
  行列表: RowOutput[];
}

interface HomeroomTeacherListOutput {
  神殿名称: string;
  年份: number;
  月份: number;
  班主任列表: string[];
}

const createInitialDataSource = (): StandardizationRecord[] => {
  return projectItems.map((project, index) => {
    const days: { [day: number]: boolean } = {};
    for (let day = 1; day <= 31; day++) days[day] = false;
    return { key: `${index + 1}`, serialNumber: index + 1, project, days };
  });
};

// Memoized 日期单元格组件
interface DayCellProps {
  day: number;
  isChecked: boolean;
  recordKey: string;
  onChange: (day: number, recordKey: string, checked: boolean) => void;
}

const DayCell = React.memo<DayCellProps>(({ day, isChecked, recordKey, onChange }) => (
  <Checkbox
    checked={isChecked}
    onChange={(e) => onChange(day, recordKey, e.target.checked)}
  />
), (prevProps, nextProps) => {
  return (
    prevProps.day === nextProps.day &&
    prevProps.isChecked === nextProps.isChecked &&
    prevProps.recordKey === nextProps.recordKey &&
    prevProps.onChange === nextProps.onChange
  );
});

const CampusHomeroomTeacherStandardizationPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const selectedCampus = currentCampus || '';
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherOptions, setTeacherOptions] = useState<string[]>([]);
  const [teacherOptionsLoading, setTeacherOptionsLoading] = useState(false);
  // 项目列表（独立于班主任数据）
  const [projectList, setProjectList] = useState<string[]>([...projectItems]);
  const [dataSource, setDataSource] = useState<StandardizationRecord[]>(createInitialDataSource());
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  // 编辑项目相关状态
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number>(-1);
  const [editingProjectName, setEditingProjectName] = useState('');

  const year = selectedMonth.year();
  const month = selectedMonth.month() + 1; // 1..12
  const normalizedTeacherName = teacherName.trim();

  // 月份变化处理
  const handleMonthChange = useCallback((d: Dayjs | null) => {
    if (d) setSelectedMonth(d);
  }, []);

  // 班主任名称变化处理
  const handleTeacherNameChange = useCallback((value: string) => {
    setTeacherName(value);
  }, []);

  // 根据项目列表创建数据源（保留已有的勾选数据）
  const createDataSourceFromProjects = useCallback((projects: string[], existingData?: StandardizationRecord[]): StandardizationRecord[] => {
    return projects.map((project, index) => {
      const days: { [day: number]: boolean } = {};
      // 尝试从已有数据中找到对应项目的勾选状态
      const existingRecord = existingData?.find(r => r.project === project);
      for (let day = 1; day <= 31; day++) {
        days[day] = existingRecord?.days[day] || false;
      }
      return { key: `${index + 1}`, serialNumber: index + 1, project, days };
    });
  }, []);

  // 处理单个日期复选框变化
  const handleDayCheckboxChange = useCallback((day: number, recordKey: string, checked: boolean) => {
    setDataSource((prevDataSource) => {
      const index = prevDataSource.findIndex(item => item.key === recordKey);
      if (index === -1) return prevDataSource;
      const row = prevDataSource[index];
      if (row.days[day] === checked) return prevDataSource; // 无变化则不更新，避免无效渲染
      const newDays = { ...row.days, [day]: checked };
      const newRow: StandardizationRecord = { ...row, days: newDays };
      const newDataSource = [...prevDataSource];
      newDataSource[index] = newRow;
      return newDataSource;
    });
  }, []);

  // 生成日期列（仅渲染当月的天数）
  const dateColumns = useMemo(() => {
    const daysInMonth = selectedMonth.daysInMonth();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return days.map(day => ({
      title: day.toString(),
      key: `day-${day}`,
      width: 60,
      align: 'center' as const,
      shouldCellUpdate: (record: StandardizationRecord, prevRecord: StandardizationRecord) =>
        (record.days[day] || false) !== (prevRecord.days[day] || false),
      render: (_: any, record: StandardizationRecord) => {
        const isChecked = record.days[day] || false;
        return (
          <DayCell
            day={day}
            isChecked={isChecked}
            recordKey={record.key}
            onChange={handleDayCheckboxChange}
          />
        );
      },
    }));
  }, [handleDayCheckboxChange, selectedMonth]);

  // 定义表格列
  const columns: ColumnsType<StandardizationRecord> = useMemo(() => {
    const baseColumns: ColumnsType<StandardizationRecord> = [
      {
        title: '序号',
        dataIndex: 'serialNumber',
        key: 'serialNumber',
        width: 80,
        align: 'center',
        fixed: 'left',
        render: (value) => value,
      },
      {
        title: '项目',
        dataIndex: 'project',
        key: 'project',
        width: 200,
        align: 'left',
        fixed: 'left',
        render: (value: string, record: StandardizationRecord) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{value}</span>
            <EditOutlined
              style={{ cursor: 'pointer', color: '#1890ff', marginLeft: 8 }}
              onClick={() => {
                const index = projectList.findIndex(p => p === value);
                if (index !== -1) {
                  setEditingProjectIndex(index);
                  setEditingProjectName(value);
                  setIsEditModalVisible(true);
                }
              }}
            />
          </div>
        ),
      },
      {
        title: '日期',
        key: 'date',
        align: 'center' as const,
        children: dateColumns,
      },
    ];
    return baseColumns;
  }, [dateColumns, projectList]);

  const loadTeacherOptions = useCallback(async () => {
    if (!selectedCampus) {
      setTeacherOptions([]);
      return;
    }
    setTeacherOptionsLoading(true);
    try {
      // 从配置中心获取班主任列表
      const teachers = await fetchHomeroomTeachers({
        campus_name: selectedCampus,
        active: true
      });
      // 提取班主任姓名并去重
      const teacherNames = [...new Set(teachers.map(t => t.name))];
      setTeacherOptions(teacherNames);
    } catch (e: any) {
      console.error('获取班主任列表失败:', e);
      message.error('获取班主任列表失败: ' + (e?.message || '未知错误'));
      setTeacherOptions([]);
    } finally {
      setTeacherOptionsLoading(false);
    }
  }, [selectedCampus]);

  // 加载
  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (!selectedCampus) {
      if (!options?.silent) message.warning('请先选择神殿');
      return;
    }
    if (!normalizedTeacherName) {
      if (!options?.silent) message.warning('请先选择班主任');
      // 切换班主任时，保留项目列表，只清空勾选数据
      setDataSource(createDataSourceFromProjects(projectList));
      return;
    }
    try {
      const url = `${buildApiUrl('/teaching-quality/homeroom-standardization')}?campus=${encodeURIComponent(selectedCampus)}&year=${year}&month=${month}&homeroom_teacher=${encodeURIComponent(normalizedTeacherName)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data: ListOutput = await res.json();
      if (!data.行列表 || data.行列表.length === 0) {
        // 没有数据时，使用当前项目列表创建空数据
        setDataSource(createDataSourceFromProjects(projectList));
      } else {
        // 合并后端返回的项目和本地项目列表
        const serverProjects = data.行列表.map(r => r.项目);
        const mergedProjects = [...projectList];
        // 添加后端返回但本地没有的项目
        serverProjects.forEach(p => {
          if (!mergedProjects.includes(p)) {
            mergedProjects.push(p);
          }
        });
        // 更新项目列表
        if (mergedProjects.length > projectList.length) {
          setProjectList(mergedProjects);
        }
        
        // 创建数据源
        const rows: StandardizationRecord[] = mergedProjects.map((project, index) => {
          const serverRow = data.行列表.find(r => r.项目 === project);
          const days: { [k: number]: boolean } = {};
          for (let d = 1; d <= 31; d++) {
            days[d] = serverRow ? Boolean(serverRow.天数?.[String(d)]) : false;
          }
          return { key: String(index + 1), serialNumber: index + 1, project, days };
        });
        setDataSource(rows);
      }
      message.success('已加载');
    } catch (e: any) {
      console.error(e);
      message.error('加载失败：' + (e?.message || '未知错误'));
    }
  }, [selectedCampus, year, month, normalizedTeacherName, projectList, createDataSourceFromProjects]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!selectedCampus) {
      message.warning('请先选择神殿');
      return;
    }
    if (!normalizedTeacherName) {
      message.warning('请先选择班主任');
      return;
    }
    try {
      const payload = {
        神殿名称: selectedCampus,
        年份: year,
        月份: month,
        班主任: normalizedTeacherName,
        日期: `${year}-${String(month).padStart(2,'0')}-01`,
        行列表: dataSource.map((r) => {
          const 天数: Record<string, boolean> = {};
          for (let d = 1; d <= 31; d++) 天数[String(d)] = Boolean(r.days[d]);
          return { 序号: r.serialNumber, 项目: r.project, 天数 };
        }),
      };
      const res = await fetch(buildApiUrl('/teaching-quality/homeroom-standardization'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      message.success('保存成功');
      await loadTeacherOptions();
      await loadData({ silent: true });
    } catch (e: any) {
      console.error(e);
      message.error('保存失败：' + (e?.message || '未知错误'));
    }
  }, [selectedCampus, year, month, normalizedTeacherName, dataSource, loadData, loadTeacherOptions]);

  // 刷新数据
  const handleRefresh = useCallback(() => { loadData(); }, [loadData]);

  // 导出数据（占位）
  const handleExport = useCallback(() => { message.info('导出功能开发中...'); }, []);

  // 显示新增项目弹窗
  const showAddModal = useCallback(() => {
    setNewProjectName('');
    setIsAddModalVisible(true);
  }, []);

  // 取消新增项目
  const handleAddCancel = useCallback(() => {
    setIsAddModalVisible(false);
    setNewProjectName('');
  }, []);

  // 确认新增项目
  const handleAddConfirm = useCallback(() => {
    const trimmedName = newProjectName.trim();
    if (!trimmedName) {
      message.warning('请输入项目名称');
      return;
    }
    
    // 检查是否已存在
    const exists = projectList.includes(trimmedName);
    if (exists) {
      message.warning('该项目已存在');
      return;
    }

    // 添加新项目到项目列表
    const newProjectList = [...projectList, trimmedName];
    setProjectList(newProjectList);

    // 添加新项目到数据源
    const newSerialNumber = dataSource.length + 1;
    const days: { [day: number]: boolean } = {};
    for (let day = 1; day <= 31; day++) days[day] = false;
    
    const newRecord: StandardizationRecord = {
      key: `${newSerialNumber}`,
      serialNumber: newSerialNumber,
      project: trimmedName,
      days,
    };

    setDataSource([...dataSource, newRecord]);
    message.success('项目添加成功');
    setIsAddModalVisible(false);
    setNewProjectName('');
  }, [newProjectName, dataSource, projectList]);

  // 显示编辑项目弹窗
  const showEditModal = useCallback((index: number, name: string) => {
    setEditingProjectIndex(index);
    setEditingProjectName(name);
    setIsEditModalVisible(true);
  }, []);

  // 取消编辑项目
  const handleEditCancel = useCallback(() => {
    setIsEditModalVisible(false);
    setEditingProjectIndex(-1);
    setEditingProjectName('');
  }, []);

  // 确认编辑项目
  const handleEditConfirm = useCallback(() => {
    const trimmedName = editingProjectName.trim();
    if (!trimmedName) {
      message.warning('请输入项目名称');
      return;
    }
    
    const oldName = projectList[editingProjectIndex];
    if (trimmedName === oldName) {
      setIsEditModalVisible(false);
      return;
    }

    // 检查是否已存在（排除当前编辑的项目）
    const exists = projectList.some((p, i) => p === trimmedName && i !== editingProjectIndex);
    if (exists) {
      message.warning('该项目名称已存在');
      return;
    }

    // 更新项目列表
    const newProjectList = [...projectList];
    newProjectList[editingProjectIndex] = trimmedName;
    setProjectList(newProjectList);

    // 更新数据源中的项目名称
    setDataSource(prevDataSource => 
      prevDataSource.map(record => 
        record.project === oldName 
          ? { ...record, project: trimmedName }
          : record
      )
    );

    message.success('项目修改成功');
    setIsEditModalVisible(false);
    setEditingProjectIndex(-1);
    setEditingProjectName('');
  }, [editingProjectName, editingProjectIndex, projectList]);

  // 已使用顶部神殿选择器，页面内不再维护神殿状态

  // 首次、切换神殿或月份时加载班主任列表（配置中心不依赖年月）
  useEffect(() => { if (selectedCampus) loadTeacherOptions(); }, [selectedCampus, loadTeacherOptions]);

  // 切换班主任或年月后加载对应数据
  useEffect(() => {
    if (selectedCampus && normalizedTeacherName) {
      loadData({ silent: true });
    } else {
      // 切换班主任时，保留项目列表，只清空勾选数据
      setDataSource(createDataSourceFromProjects(projectList));
    }
  }, [selectedCampus, year, month, normalizedTeacherName, loadData, projectList, createDataSourceFromProjects]);

  // 表头样式（浅绿色背景）
  const headerCellStyle: React.CSSProperties = useMemo(() => ({
    backgroundColor: '#d4edda',
    fontWeight: 'bold',
    textAlign: 'center',
  }), []);

  // 表格自定义组件（避免每次渲染重新创建）
  const tableComponents = useMemo(() => ({
    header: {
      cell: (props: any) => {
        const { children, ...restProps } = props;
        const mergedProps = {
          ...restProps,
          style: {
            ...props.style,
            ...headerCellStyle,
          },
        };
        return <th {...mergedProps}>{children}</th>;
      },
    },
  }), [headerCellStyle]);

  return (
    <ConfigProvider wave={{ disabled: true }} theme={{ token: { motion: false } }}>
      <div style={{ padding: 24 }}>
        <div style={{ 
          marginBottom: 24, 
          textAlign: 'center', 
          fontSize: '20px', 
          fontWeight: 'bold',
          padding: '16px',
          backgroundColor: '#fff1f0',
          borderRadius: 4,
          border: '1px solid #ffccc7',
        }}>
          <CheckCircleOutlined style={{ marginRight: 8 }} />
          班主任标准化检查表
        </div>

        <Card>
          {/* 操作栏 */}
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <span>月份：</span>
              <DatePicker
                picker="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                style={{ width: 200 }}
                placeholder="请选择月份"
              />
              <span>班主任：</span>
              <AutoComplete
                value={teacherName}
                onChange={handleTeacherNameChange}
                options={teacherOptions.map((name) => ({ value: name }))}
                style={{ width: 200 }}
                placeholder="请选择/输入班主任"
                allowClear
                notFoundContent={teacherOptionsLoading ? '加载中...' : '暂无数据'}
                filterOption={(inputValue, option) =>
                  (option?.value || '').toLowerCase().includes(inputValue.toLowerCase())
                }
              />
            </Space>
            <Space>
              <Button icon={<PlusOutlined />} onClick={showAddModal}>
                新增项目
              </Button>
              <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
                保存
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                加载
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
            </Space>
          </div>

          {/* 表格 */}
          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            // 取消纵向滚动，避免上下内容被裁切，保证上下部分完全显示
            scroll={{ x: 'max-content' }}
            bordered
            size="small"
            rowKey="key"
            components={tableComponents}
          />
          <style>{`
            .ant-table-thead > tr > th {
              background-color: #d4edda !important;
              font-weight: bold;
              text-align: center;
            }
            .ant-table-thead > tr:first-child > th {
              background-color: #d4edda !important;
            }
            .ant-table-thead > tr:last-child > th {
              background-color: #d4edda !important;
            }
          `}</style>
        </Card>

        {/* 新增项目弹窗 */}
        <Modal
          title="新增项目"
          open={isAddModalVisible}
          onOk={handleAddConfirm}
          onCancel={handleAddCancel}
          okText="确定"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>项目名称：</label>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="请输入项目名称"
              onPressEnter={handleAddConfirm}
              autoFocus
            />
          </div>
        </Modal>

        {/* 编辑项目弹窗 */}
        <Modal
          title="编辑项目"
          open={isEditModalVisible}
          onOk={handleEditConfirm}
          onCancel={handleEditCancel}
          okText="确定"
          cancelText="取消"
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8 }}>项目名称：</label>
            <Input
              value={editingProjectName}
              onChange={(e) => setEditingProjectName(e.target.value)}
              placeholder="请输入项目名称"
              onPressEnter={handleEditConfirm}
              autoFocus
            />
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default CampusHomeroomTeacherStandardizationPage;
