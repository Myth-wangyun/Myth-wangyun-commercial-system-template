import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { App,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Space,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import { STORAGE_KEYS, PROGRAM_LENGTHS, MAJOR_LIST } from '@/pages/academic/teaching-content/constants';
import { loadCampusData, saveCampusData, shortCampusName } from '@/pages/academic/teaching-content/shared/campusStorage';
import CampusSelector from '@/components/common/CampusSelector';
import { fetchCampusClassList, autoCalculateClassSummary } from '@/services/academic/campusClassEmploymentInfo';
import {
  fetchClassEmploymentSummaries,
  createClassEmploymentSummary,
  updateClassEmploymentSummary,
  classEmploymentSummaryService,
  type ClassEmploymentSummary,
} from '@/services/classEmploymentSummary';
import { getTeacherEmploymentSummaries } from '@/services/teacherEmploymentSummary';

const { Title } = Typography;
const { Option } = Select;

interface EmploymentClassRecord {
  id: string;
  serialNumber: number;
  campus: string;
  // 对应后端班级就业总结表的主键（如果已保存）
  summaryId?: number;
  major: string;
  programLength: string;
  className: string;
  instructor: string;
  headTeacher: string;
  graduationDate: string;
  targetAverageSalary: number;
  actualAverageSalary: number;
  archiveCount: number;
  targetEmploymentCount: number;
  actualEmploymentCount: number;
  highSalaryCount: number;
}

interface EmploymentClassFormData {
  major: string;
  programLength: string;
  className: string;
  instructor: string;
  headTeacher: string;
  graduationDate: dayjs.Dayjs | null;
  targetAverageSalary: number;
  actualAverageSalary: number;
  archiveCount: number;
  targetEmploymentCount: number;
  actualEmploymentCount: number;
  highSalaryCount: number;
}

const DEFAULT_ROWS = 8;

const createDefaultRecords = (campusShort: string): EmploymentClassRecord[] =>
  Array.from({ length: DEFAULT_ROWS }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    serialNumber: index + 1,
    campus: campusShort,
    major: '',
    programLength: '',
    className: '',
    instructor: '',
    headTeacher: '',
    graduationDate: '',
    targetAverageSalary: 0,
    actualAverageSalary: 0,
    archiveCount: 0,
    targetEmploymentCount: 0,
    actualEmploymentCount: 0,
    highSalaryCount: 0,
  }));

const formatCurrency = (value: number): string =>
  value ? `¥${value.toLocaleString()}` : '';

const formatPercent = (value: number): string =>
  `${value.toFixed(1)}%`;

const calcAchievementRate = (record: EmploymentClassRecord): number =>
  record.targetAverageSalary > 0
    ? (record.actualAverageSalary / record.targetAverageSalary) * 100
    : 0;

const calcEmploymentRate = (record: EmploymentClassRecord): number =>
  record.targetEmploymentCount > 0
    ? (record.actualEmploymentCount / record.targetEmploymentCount) * 100
    : 0;

const CampusEmploymentClassSummary: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿';
  const campusShort = shortCampusName(activeCampus);

  // 年份筛选相关状态
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const isHistoricalMode = selectedYear === 'all';
  const [historicalStats, setHistoricalStats] = useState<any>(null);

  const [dataSource, setDataSource] = useState<EmploymentClassRecord[]>(() =>
    createDefaultRecords(campusShort),
  );
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EmploymentClassRecord | null>(null);
  const [form] = Form.useForm<EmploymentClassFormData>();

  // 加载可用年份列表
  const loadAvailableYears = useCallback(async () => {
    try {
      const years = await classEmploymentSummaryService.getAvailableYears(activeCampus);
      setAvailableYears(years);
    } catch (error) {
      console.error('获取年份列表失败:', error);
    }
  }, [activeCampus]);

  // 加载历史汇总数据
  const loadHistoricalData = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await classEmploymentSummaryService.getHistoricalSummary(activeCampus);
      setHistoricalStats(stats);
      setDataSource([]); // 历史合计模式下不显示明细列表
    } catch (error) {
      console.error('获取历史汇总数据失败:', error);
      message.error('获取历史汇总数据失败');
    } finally {
      setLoading(false);
    }
  }, [activeCampus]);

  // 加载数据：优先使用本地缓存；否则根据后端班级就业总结 + 配置中心的班级列表自动生成基础行，并尝试从就业明细重新计算实际数据
  const loadData = async (showMessage = false) => {
    // 如果是历史合计模式，加载汇总数据
    if (isHistoricalMode) {
      await loadHistoricalData();
      return;
    }

    const fallback = createDefaultRecords(campusShort);
    setLoading(true);
    try {
      const loaded = loadCampusData<EmploymentClassRecord[]>(
        STORAGE_KEYS.CAMPUS_EMPLOYMENT_CLASS_SUMMARY,
        activeCampus,
        [],
      );
      if (loaded && loaded.length > 0) {
        // 按年份筛选本地数据
        const yearFilter = typeof selectedYear === 'number' ? selectedYear : undefined;
        const filteredData = yearFilter
          ? loaded.filter(item => {
              if (!item.graduationDate) return false;
              const itemYear = parseInt(item.graduationDate.substring(0, 4), 10);
              return itemYear === yearFilter;
            })
          : loaded;
        setDataSource(filteredData);
        return;
      }

      const backendSummaries: ClassEmploymentSummary[] =
        await fetchClassEmploymentSummaries(activeCampus, { 年份: typeof selectedYear === 'number' ? selectedYear : undefined });
      const campusClassLists = await fetchCampusClassList();
      const campusItem = campusClassLists.find(item => item.campus === activeCampus);
      const classMetaMap =
        campusItem && campusItem.classes.length > 0
          ? new Map(
              campusItem.classes.map((cls) => [
                cls.name,
                {
                  major: cls.major || '',
                  instructor: cls.instructor || '',
                  headTeacher: cls.classAdvisor || '',
                  graduationDate: cls.graduationTime || '',
                  programLength: cls.programLength || '',  // 学制
                },
              ]),
            )
          : new Map<string, { major: string; instructor: string; headTeacher: string; graduationDate: string; programLength: string }>();

      if (backendSummaries && backendSummaries.length > 0) {
        // 按班级名称去重，只保留最新的记录（按年份和月份降序排序）
        const uniqueSummaries = backendSummaries
          .sort((a, b) => {
            // 先按年份降序
            if (b.年份 !== a.年份) {
              return b.年份 - a.年份;
            }
            // 再按月份降序
            return (b.月份 || 0) - (a.月份 || 0);
          })
          .filter((s, index, arr) => {
            // 只保留每个班级的第一条记录（即最新的记录）
            return arr.findIndex(item => item.班级名称 === s.班级名称) === index;
          });

        const baseTime = Date.now();
        const mappedFromBackend: EmploymentClassRecord[] = [];
        for (let index = 0; index < uniqueSummaries.length; index += 1) {
          const s = uniqueSummaries[index];
          const meta = classMetaMap.get(s.班级名称) || {
            major: '',
            instructor: '',
            headTeacher: '',
            graduationDate:
              s.年份 && s.月份 ? `${s.年份}-${String(s.月份).padStart(2, '0')}` : '',
            programLength: '',
          };

          // 尝试从就业明细自动计算最新的实际数据
          let actualAvgSalary = s.实际平均薪资;
          let archiveCount = s.档案人数;
          let targetEmploymentCount = s.目标就业人数;
          let actualEmploymentCount = s.实际就业人数;
          let highSalaryCount = 0;
          try {
            const auto = await autoCalculateClassSummary(activeCampus, s.班级名称);
            archiveCount = auto.档案人数;
            targetEmploymentCount = auto.目标就业人数;
            actualEmploymentCount = auto.实际就业人数;
            actualAvgSalary = auto.实际平均就业薪资;
            highSalaryCount = auto.薪资过万人数;
          } catch {
            // 自动计算失败时，沿用总结表的值
          }

          mappedFromBackend.push({
            id: `${baseTime}-${index}`,
            summaryId: s.总结ID,
            serialNumber: index + 1,
            campus: campusShort,
            major: meta.major,
            programLength: meta.programLength,  // 从班级配置获取学制
            className: s.班级名称,
            instructor: meta.instructor,
            headTeacher: meta.headTeacher,
            graduationDate: meta.graduationDate,
            targetAverageSalary: s.目标平均薪资,
            actualAverageSalary: actualAvgSalary,
            archiveCount,
            targetEmploymentCount,
            actualEmploymentCount,
            highSalaryCount,
          });
        }
        setDataSource(mappedFromBackend);
        saveCampusData(STORAGE_KEYS.CAMPUS_EMPLOYMENT_CLASS_SUMMARY, activeCampus, mappedFromBackend);
        if (showMessage) {
          message.success(`已从后端加载 ${mappedFromBackend.length} 条班级就业汇总数据`);
        }
      } else if (campusItem && campusItem.classes.length > 0) {
        const baseTime = Date.now();
        const mapped: EmploymentClassRecord[] = [];
        for (let index = 0; index < campusItem.classes.length; index += 1) {
          const cls = campusItem.classes[index];
          let archiveCount = 0;
          let targetEmploymentCount = 0;
          let actualEmploymentCount = 0;
          let targetAverageSalary = 0;
          let actualAverageSalary = 0;
          let highSalaryCount = 0;
          try {
            const auto = await autoCalculateClassSummary(activeCampus, cls.name);
            archiveCount = auto.档案人数;
            targetEmploymentCount = auto.目标就业人数;
            actualEmploymentCount = auto.实际就业人数;
            targetAverageSalary = auto.目标平均就业薪资;
            actualAverageSalary = auto.实际平均就业薪资;
            highSalaryCount = auto.薪资过万人数;
          } catch {
            // 自动计算失败则保持默认 0
          }

          mapped.push({
            id: cls.id || `${baseTime}-${index}`,
            serialNumber: index + 1,
            campus: campusShort,
            major: cls.major || '',
            programLength: '', // 学制暂时留空，由用户在页面中补充
            className: cls.name,
            instructor: cls.instructor || '',
            headTeacher: cls.classAdvisor || '',
            graduationDate: cls.graduationTime || '',
            targetAverageSalary,
            actualAverageSalary,
            archiveCount,
            targetEmploymentCount,
            actualEmploymentCount,
            highSalaryCount,
          });
        }
        setDataSource(mapped);
        saveCampusData(STORAGE_KEYS.CAMPUS_EMPLOYMENT_CLASS_SUMMARY, activeCampus, mapped);
        if (showMessage) {
          message.success(`配置中心为该神殿提供了 ${mapped.length} 个班级，已生成空白行`);
        }
      } else {
        setDataSource(fallback);
        saveCampusData(STORAGE_KEYS.CAMPUS_EMPLOYMENT_CLASS_SUMMARY, activeCampus, fallback);
        if (showMessage) {
          message.info('后端和配置中心暂无数据，已生成默认空白行');
        }
      }
    } catch (error) {
      console.error('[就业班级汇总] 加载数据失败:', error);
      setDataSource(createDefaultRecords(campusShort));
      message.error('自动抓取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 加载年份列表
  useEffect(() => {
    loadAvailableYears();
  }, [loadAvailableYears]);

  // 监听神殿和年份变化
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampus, campusShort, selectedYear, isHistoricalMode]);

  // 保存数据（非历史合计模式）
  useEffect(() => {
    if (!isHistoricalMode && dataSource.length > 0) {
      saveCampusData(STORAGE_KEYS.CAMPUS_EMPLOYMENT_CLASS_SUMMARY, activeCampus, dataSource);
    }
  }, [dataSource, activeCampus, isHistoricalMode]);

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      programLength: PROGRAM_LENGTHS[0],
      major: MAJOR_LIST[0],
      graduationDate: null,
      targetAverageSalary: 0,
      actualAverageSalary: 0,
      archiveCount: 0,
      targetEmploymentCount: 0,
      actualEmploymentCount: 0,
      highSalaryCount: 0,
    });
    setModalVisible(true);
  };

  const handleEdit = (record: EmploymentClassRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      graduationDate: record.graduationDate ? dayjs(record.graduationDate) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setDataSource(prev =>
      prev
        .filter(item => item.id !== id)
        .map((item, index) => ({ ...item, serialNumber: index + 1 })),
    );
    message.success('删除成功');
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const normalized: EmploymentClassRecord = {
        id: editingRecord?.id || `${Date.now()}`,
        serialNumber: editingRecord?.serialNumber || dataSource.length + 1,
        campus: campusShort,
        major: values.major,
        programLength: values.programLength,
        className: values.className.trim(),
        instructor: values.instructor.trim(),
        headTeacher: values.headTeacher.trim(),
        graduationDate: values.graduationDate ? values.graduationDate.format('YYYY-MM') : '',
        targetAverageSalary: Number(values.targetAverageSalary) || 0,
        actualAverageSalary: Number(values.actualAverageSalary) || 0,
        archiveCount: Number(values.archiveCount) || 0,
        targetEmploymentCount: Number(values.targetEmploymentCount) || 0,
        actualEmploymentCount: Number(values.actualEmploymentCount) || 0,
        highSalaryCount: Number(values.highSalaryCount) || 0,
      };

      setDataSource(prev => {
        if (editingRecord) {
          return prev.map(item =>
            item.id === editingRecord.id ? normalized : item,
          );
        }
        return [...prev, normalized].map((item, index) => ({
          ...item,
          serialNumber: index + 1,
        }));
      });

      setModalVisible(false);
      form.resetFields();
      message.success(editingRecord ? '更新成功' : '添加成功');
    } catch {
      // ignore validation failure
    }
  };

  const statistics = useMemo(() => {
    const count = dataSource.length;
    const totalTargetSalary = dataSource.reduce((sum, item) => sum + item.targetAverageSalary, 0);
    const totalActualSalary = dataSource.reduce((sum, item) => sum + item.actualAverageSalary, 0);
    const totalArchive = dataSource.reduce((sum, item) => sum + item.archiveCount, 0);
    const totalTargetEmployment = dataSource.reduce((sum, item) => sum + item.targetEmploymentCount, 0);
    const totalActualEmployment = dataSource.reduce((sum, item) => sum + item.actualEmploymentCount, 0);
    const totalHighSalary = dataSource.reduce((sum, item) => sum + item.highSalaryCount, 0);

    const achievementRate = totalTargetSalary > 0
      ? (totalActualSalary / totalTargetSalary) * 100
      : 0;
    const employmentRate = totalTargetEmployment > 0
      ? (totalActualEmployment / totalTargetEmployment) * 100
      : 0;

    return {
      classCount: count,
      avgTargetSalary: count > 0 ? totalTargetSalary / count : 0,
      avgActualSalary: count > 0 ? totalActualSalary / count : 0,
      achievementRate,
      totalArchive,
      totalTargetEmployment,
      totalActualEmployment,
      employmentRate,
      totalHighSalary,
    };
  }, [dataSource]);

  const columns: ColumnsType<EmploymentClassRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 70,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 90,
      align: 'center',
      fixed: 'left',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 110,
      align: 'center',
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 90,
      align: 'center',
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      align: 'center',
    },
    {
      title: '授课教员',
      dataIndex: 'instructor',
      key: 'instructor',
      width: 120,
      align: 'center',
    },
    {
      title: '班主任',
      dataIndex: 'headTeacher',
      key: 'headTeacher',
      width: 120,
      align: 'center',
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationDate',
      key: 'graduationDate',
      width: 120,
      align: 'center',
      render: (value: string) => (value ? dayjs(value).format('YYYY-MM') : ''),
    },
    {
      title: '就业薪资',
      key: 'salaryGroup',
      align: 'center',
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAverageSalary',
          key: 'targetAverageSalary',
          width: 160,
          align: 'center',
          render: (value: number) => formatCurrency(value),
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAverageSalary',
          key: 'actualAverageSalary',
          width: 160,
          align: 'center',
          render: (value: number) => formatCurrency(value),
        },
        {
          title: '达标率',
          key: 'achievementRate',
          width: 120,
          align: 'center',
          render: (_, record) => formatPercent(calcAchievementRate(record)),
        },
      ],
    },
    {
      title: '就业率',
      key: 'employmentGroup',
      align: 'center',
      children: [
        {
          title: '档案人数',
          dataIndex: 'archiveCount',
          key: 'archiveCount',
          width: 120,
          align: 'center',
        },
        {
          title: '目标就业人数',
          dataIndex: 'targetEmploymentCount',
          key: 'targetEmploymentCount',
          width: 140,
          align: 'center',
        },
        {
          title: '实际就业人数',
          dataIndex: 'actualEmploymentCount',
          key: 'actualEmploymentCount',
          width: 140,
          align: 'center',
        },
        {
          title: '就业率',
          key: 'employmentRate',
          width: 120,
          align: 'center',
          render: (_, record) => formatPercent(calcEmploymentRate(record)),
        },
      ],
    },
    {
      title: '薪资过万人数',
      dataIndex: 'highSalaryCount',
      key: 'highSalaryCount',
      width: 140,
      align: 'center',
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" icon={<DeleteOutlined />} danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 历史合计模式下使用 historicalStats
  const displayStats = isHistoricalMode && historicalStats
    ? {
        classCount: historicalStats.totalClasses || 0,
        avgTargetSalary: historicalStats.avgTargetSalary || 0,
        avgActualSalary: historicalStats.avgActualSalary || 0,
        achievementRate: historicalStats.avgAchievementRate || 0,
        totalArchive: historicalStats.totalArchiveCount || 0,
        totalTargetEmployment: historicalStats.totalTargetEmployment || 0,
        totalActualEmployment: historicalStats.totalActualEmployment || 0,
        employmentRate: historicalStats.avgEmploymentRate || 0,
        totalHighSalary: 0, // 历史汇总暂无此字段
      }
    : statistics;

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            {activeCampus}后端就业班级汇总表{isHistoricalMode ? ' - 历史合计' : ''}
          </Title>
          <Space>
            <Select
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              style={{ width: 120 }}
            >
              <Option value="all">历史合计</Option>
              {availableYears.map((year) => (
                <Option key={year} value={year}>{year}年</Option>
              ))}
            </Select>
            <CampusSelector useGlobalState allowClear={false} />
          </Space>
        </div>

        {/* 历史合计模式提示 */}
        {isHistoricalMode && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
            <span style={{ color: '#52c41a' }}>📊 当前显示的是历史合计数据（汇总所有年份），仅供查看统计信息，不支持编辑操作。</span>
          </div>
        )}

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="班级数量" value={displayStats.classCount} />
          </Col>
          <Col span={6}>
            <Statistic title="平均目标薪资" value={formatCurrency(displayStats.avgTargetSalary)} />
          </Col>
          <Col span={6}>
            <Statistic title="平均实际薪资" value={formatCurrency(displayStats.avgActualSalary)} />
          </Col>
          <Col span={6}>
            <Statistic title="薪资过万人数" value={displayStats.totalHighSalary} />
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="档案人数合计" value={displayStats.totalArchive} />
          </Col>
          <Col span={6}>
            <Statistic title="目标就业人数合计" value={displayStats.totalTargetEmployment} />
          </Col>
          <Col span={6}>
            <Statistic title="实际就业人数合计" value={displayStats.totalActualEmployment} />
          </Col>
          <Col span={6}>
            <Statistic title="就业率" value={formatPercent(displayStats.employmentRate)} />
          </Col>
        </Row>

        {/* 操作按钮 - 历史合计模式下隐藏 */}
        {!isHistoricalMode && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加班级数据
            </Button>
            <Button
              onClick={async () => {
                try {
                  const campusClassLists = await fetchCampusClassList();
                  const campusItem = campusClassLists.find(item => item.campus === activeCampus);
                  if (!campusItem || campusItem.classes.length === 0) {
                    message.info('配置中心暂未维护该神殿的班级列表');
                    return;
                  }
                  const baseTime = Date.now();
                  const mapped: EmploymentClassRecord[] = campusItem.classes.map((cls, index) => ({
                    id: cls.id || `${baseTime}-${index}`,
                    serialNumber: index + 1,
                    campus: campusShort,
                    major: cls.major || '',
                    programLength: '',
                    className: cls.name,
                    instructor: cls.instructor || '',
                    headTeacher: cls.classAdvisor || '',
                    graduationDate: cls.graduationTime || '',
                    targetAverageSalary: 0,
                    actualAverageSalary: 0,
                    archiveCount: 0,
                    targetEmploymentCount: 0,
                    actualEmploymentCount: 0,
                    highSalaryCount: 0,
                  }));
                  setDataSource(mapped);
                  message.success('已根据配置中心班级列表自动生成班级汇总行');
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error('[就业班级汇总] 重新从配置中心获取班级列表失败:', error);
                  message.error('从配置中心获取班级列表失败，请稍后重试');
                }
              }}
            >
              从配置中心班级列表自动生成
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!activeCampus) {
                  message.warning('请先选择神殿');
                  return;
                }
                try {
                  const summaries = await fetchClassEmploymentSummaries(activeCampus);
                  const campusClassLists = await fetchCampusClassList();
                  const campusItem = campusClassLists.find(item => item.campus === activeCampus);
                  
                  // 从教员就业汇总表获取学制和教员信息
                  const teacherSummaries = await getTeacherEmploymentSummaries(activeCampus);
                  // 构建 班级名称 -> { 学制, 教员姓名 } 的映射
                  const teacherSummaryMap = new Map<string, { programLength: string; teacherName: string }>();
                  for (const ts of teacherSummaries) {
                    if (ts.班级名称 && !teacherSummaryMap.has(ts.班级名称)) {
                      teacherSummaryMap.set(ts.班级名称, {
                        programLength: ts.学制 || '',
                        teacherName: ts.教员姓名 || '',
                      });
                    }
                  }
                  
                  const classMeta =
                    campusItem && campusItem.classes.length > 0
                      ? new Map(
                          campusItem.classes.map((cls) => [
                            cls.name,
                            {
                              major: cls.major || '',
                              programLength: teacherSummaryMap.get(cls.name)?.programLength || cls.programLength || '',
                              instructor: teacherSummaryMap.get(cls.name)?.teacherName || cls.instructor || '',
                              headTeacher: cls.classAdvisor || '',
                              graduationDate: cls.graduationTime || '',
                            },
                          ]),
                        )
                      : new Map<
                          string,
                          { major: string; programLength: string; instructor: string; headTeacher: string; graduationDate: string }
                        >();

                  const baseTime = Date.now();
                  const mapped: EmploymentClassRecord[] = [];
                  if (summaries && summaries.length > 0) {
                    // 按班级名称去重，只保留最新的记录（按年份和月份降序排序）
                    const uniqueSummaries = summaries
                      .sort((a, b) => {
                        // 先按年份降序
                        if (b.年份 !== a.年份) {
                          return b.年份 - a.年份;
                        }
                        // 再按月份降序
                        return (b.月份 || 0) - (a.月份 || 0);
                      })
                      .filter((s, index, arr) => {
                        // 只保留每个班级的第一条记录（即最新的记录）
                        return arr.findIndex(item => item.班级名称 === s.班级名称) === index;
                      });
                    
                    for (let index = 0; index < uniqueSummaries.length; index += 1) {
                      const s = uniqueSummaries[index];
                      // 优先从教员就业汇总表获取学制和教员
                      const teacherInfo = teacherSummaryMap.get(s.班级名称);
                      const meta = classMeta.get(s.班级名称) || {
                        major: '',
                        programLength: teacherInfo?.programLength || '',
                        instructor: teacherInfo?.teacherName || '',
                        headTeacher: '',
                        graduationDate:
                          s.年份 && s.月份 ? `${s.年份}-${String(s.月份).padStart(2, '0')}` : '',
                      };

                      let archiveCount = s.档案人数;
                      let targetEmploymentCount = s.目标就业人数;
                      let actualEmploymentCount = s.实际就业人数;
                      let actualAverageSalary = s.实际平均薪资;
                      let highSalaryCount = 0;
                      try {
                        const auto = await autoCalculateClassSummary(activeCampus, s.班级名称);
                        archiveCount = auto.档案人数;
                        targetEmploymentCount = auto.目标就业人数;
                        actualEmploymentCount = auto.实际就业人数;
                        actualAverageSalary = auto.实际平均就业薪资;
                        highSalaryCount = auto.薪资过万人数;
                      } catch {
                        // 自动计算失败则使用后端总结表的基础数据
                      }

                      mapped.push({
                        id: `${baseTime}-${index}`,
                        summaryId: s.总结ID,
                        serialNumber: index + 1,
                        campus: campusShort,
                        major: meta.major,
                        programLength: meta.programLength,
                        className: s.班级名称,
                        instructor: meta.instructor,
                        headTeacher: meta.headTeacher,
                        graduationDate: meta.graduationDate,
                        targetAverageSalary: s.目标平均薪资,
                        actualAverageSalary,
                        archiveCount,
                        targetEmploymentCount,
                        actualEmploymentCount,
                        highSalaryCount,
                      });
                    }
                  } else if (campusItem && campusItem.classes.length > 0) {
                    // 后端总结为空，改为按班级列表逐班自动计算
                    for (let index = 0; index < campusItem.classes.length; index += 1) {
                      const cls = campusItem.classes[index];
                      // 优先从教员就业汇总表获取学制和教员
                      const teacherInfo = teacherSummaryMap.get(cls.name);
                      const meta = {
                        major: cls.major || '',
                        programLength: teacherInfo?.programLength || cls.programLength || '',
                        instructor: teacherInfo?.teacherName || cls.instructor || '',
                        headTeacher: cls.classAdvisor || '',
                        graduationDate: cls.graduationTime || '',
                      };
                      let archiveCount = 0;
                      let targetEmploymentCount = 0;
                      let actualEmploymentCount = 0;
                      let targetAverageSalary = 0;
                      let actualAverageSalary = 0;
                      let highSalaryCount = 0;
                      try {
                        const auto = await autoCalculateClassSummary(activeCampus, cls.name);
                        archiveCount = auto.档案人数;
                        targetEmploymentCount = auto.目标就业人数;
                        actualEmploymentCount = auto.实际就业人数;
                        targetAverageSalary = auto.目标平均就业薪资;
                        actualAverageSalary = auto.实际平均就业薪资;
                        highSalaryCount = auto.薪资过万人数;
                      } catch {
                        // 自动计算失败则保持默认 0
                      }

                      mapped.push({
                        id: `${baseTime}-${index}`,
                        serialNumber: index + 1,
                        campus: campusShort,
                        major: meta.major,
                        programLength: meta.programLength,
                        className: cls.name,
                        instructor: meta.instructor,
                        headTeacher: meta.headTeacher,
                        graduationDate: meta.graduationDate,
                        targetAverageSalary,
                        actualAverageSalary,
                        archiveCount,
                        targetEmploymentCount,
                        actualEmploymentCount,
                        highSalaryCount,
                      });
                    }
                    message.info('后端暂未维护班级就业总结，已按班级就业明细自动计算生成');
                  } else {
                    message.info('未找到班级列表，无法自动生成');
                  }
                  setDataSource(mapped);
                  if (mapped.length > 0) {
                    message.success('已根据后端数据/班级明细自动生成班级汇总行');
                  }
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error('[就业班级汇总] 从后端自动生成失败:', error);
                  message.error('从后端自动生成失败，请稍后重试');
                }
              }}
            >
              从后端班级就业总结自动生成
            </Button>
            <Button
              type="primary"
              onClick={async () => {
                if (!activeCampus) {
                  message.warning('请先选择神殿');
                  return;
                }
                const campusName = activeCampus;
                try {
                  for (const record of dataSource) {
                    if (!record.className) continue;

                    const grad = record.graduationDate || '';
                    const year = grad ? Number(grad.slice(0, 4)) : new Date().getFullYear();
                    const month = grad ? Number(grad.slice(5, 7)) || 1 : new Date().getMonth() + 1;

                    const payload = {
                      神殿: campusName,
                      班级名称: record.className,
                      年份: year,
                      月份: month,
                      档案人数: record.archiveCount,
                      需就业人数: record.archiveCount,
                      目标就业人数: record.targetEmploymentCount,
                      实际就业人数: record.actualEmploymentCount,
                      目标就业率:
                        record.archiveCount > 0
                          ? (record.targetEmploymentCount / record.archiveCount) * 100
                          : 0,
                      实际就业率:
                        record.archiveCount > 0
                          ? (record.actualEmploymentCount / record.archiveCount) * 100
                          : 0,
                      目标需就业率:
                        record.archiveCount > 0
                          ? (record.targetEmploymentCount / record.archiveCount) * 100
                          : 0,
                      实际需就业率:
                        record.archiveCount > 0
                          ? (record.actualEmploymentCount / record.archiveCount) * 100
                          : 0,
                      目标平均薪资: record.targetAverageSalary,
                      实际平均薪资: record.actualAverageSalary,
                      备注: undefined,
                    };

                    if (record.summaryId) {
                      await updateClassEmploymentSummary(record.summaryId, payload);
                    } else {
                      const created = await createClassEmploymentSummary(payload, campusName);
                      record.summaryId = created.总结ID;
                    }
                  }
                  // 刷新状态，确保 summaryId 与最新数据同步到页面和本地缓存
                  setDataSource([...dataSource]);
                  message.success('已保存到后端班级就业总结表');
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error('[就业班级汇总] 保存到后端失败:', error);
                  message.error('保存到后端失败，请稍后重试');
                }
              }}
            >
              保存到后端
            </Button>
          </Space>
        </div>
        )}

        {/* 数据表格 - 历史合计模式下隐藏 */}
        {!isHistoricalMode && (
        <Table<EmploymentClassRecord>
          columns={columns}
          dataSource={dataSource}
          rowKey="id"
          bordered
          pagination={false}
          loading={loading}
          scroll={{ x: 1500, y: 600 }}
          sticky
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} align="center">合计/平均</Table.Summary.Cell>
                {/* 神殿 */}
                <Table.Summary.Cell index={1} align="center" />
                {/* 专业 */}
                <Table.Summary.Cell index={2} align="center" />
                {/* 学制 */}
                <Table.Summary.Cell index={3} align="center" />
                {/* 班级名称 */}
                <Table.Summary.Cell index={4} align="center" />
                {/* 授课教员 */}
                <Table.Summary.Cell index={5} align="center" />
                {/* 班主任 */}
                <Table.Summary.Cell index={6} align="center" />
                {/* 毕业时间 */}
                <Table.Summary.Cell index={7} align="center" />
                <Table.Summary.Cell index={8} align="center">
                  {formatCurrency(statistics.avgTargetSalary)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="center">
                  {formatCurrency(statistics.avgActualSalary)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="center">
                  {formatPercent(statistics.achievementRate)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="center">
                  {statistics.totalArchive}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="center">
                  {statistics.totalTargetEmployment}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="center">
                  {statistics.totalActualEmployment}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="center">
                  {formatPercent(statistics.employmentRate)}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="center">
                  {statistics.totalHighSalary}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={16} align="center" />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
        )}
      </Card>

      <Modal
        title={editingRecord ? '编辑班级数据' : '添加班级数据'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSave}
        destroyOnHidden
        width={720}
      >
        <Form<EmploymentClassFormData>
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="专业"
                name="major"
                rules={[{ required: true, message: '请选择专业' }]}
              >
                <Select placeholder="请选择专业">
                  {MAJOR_LIST.map(item => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="学制"
                name="programLength"
                rules={[{ required: true, message: '请选择学制' }]}
              >
                <Select placeholder="请选择学制">
                  {PROGRAM_LENGTHS.map(item => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="班级名称"
                name="className"
                rules={[{ required: true, message: '请输入班级名称' }]}
              >
                <Input placeholder="如 Y32" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="毕业时间"
                name="graduationDate"
              >
                <DatePicker picker="month" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="授课教员"
                name="instructor"
                rules={[{ required: true, message: '请输入授课教员' }]}
              >
                <Input placeholder="请输入授课教员" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="班主任"
                name="headTeacher"
                rules={[{ required: true, message: '请输入班主任' }]}
              >
                <Input placeholder="请输入班主任" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标平均就业薪资"
                name="targetAverageSalary"
                rules={[{ required: true, message: '请输入目标平均就业薪资' }]}
              >
                <InputNumber
                  min={0}
                  formatter={value => (value ? `${value}` : '')}
                  style={{ width: '100%' }}
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际平均就业薪资"
                name="actualAverageSalary"
                rules={[{ required: true, message: '请输入实际平均就业薪资' }]}
              >
                <InputNumber
                  min={0}
                  formatter={value => (value ? `${value}` : '')}
                  style={{ width: '100%' }}
                  addonBefore="¥"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="档案人数"
                name="archiveCount"
                rules={[{ required: true, message: '请输入档案人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="薪资过万人数"
                name="highSalaryCount"
                rules={[{ required: true, message: '请输入薪资过万人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="目标就业人数"
                name="targetEmploymentCount"
                rules={[{ required: true, message: '请输入目标就业人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="实际就业人数"
                name="actualEmploymentCount"
                rules={[{ required: true, message: '请输入实际就业人数' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CampusEmploymentClassSummary;
