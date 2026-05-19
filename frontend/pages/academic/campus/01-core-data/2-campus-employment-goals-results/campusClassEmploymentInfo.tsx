// 二级-校长表格02QMJY-XS-003 XX神殿智慧司就业目标与结果汇总表
// 清美教育（主神殿）Y32班就业信息表
// 只读页面 - 数据来源：教化司班级就业信息表
import React, { useState, useEffect } from 'react';
import { App,
  Card, 
  Table, 
  Select, 
  Space, 
  Row,
  Col,
  Statistic,
  Alert,
  Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  TeamOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { type CampusClassEmploymentInfo, type ClassInfo } from '@/types/campusClassEmploymentInfo';
import { 
  getCampusClassList,
  fetchClassListByCampus,
  getClassInfo,
  getEmploymentInfoFromTeachingQuality,
  fetchClassNamesFromTeachingQuality
} from '@/services/academic/campusClassEmploymentInfo';
import { getAllCampusNames } from '@/config/campusConfig';
import { useCampusStore } from '@/stores/campusStore';

const { Title } = Typography;
const { Option } = Select;

const CampusClassEmploymentInfoPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, setCampus } = useCampusStore();
  const [classData, setClassData] = useState<Record<string, CampusClassEmploymentInfo[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState(currentCampus || '主神殿');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [classList, setClassList] = useState<ClassInfo[]>([]);

  useEffect(() => {
    if (currentCampus && currentCampus !== selectedCampus) {
      setSelectedCampus(currentCampus);
    }
  }, [currentCampus]);

  const loadClassList = async () => {
    try {
      console.log(`[班级列表] 开始加载 ${selectedCampus} 的班级列表...`);
      
      // 1. 从配置中心获取班级列表
      let configClasses: ClassInfo[] = [];
      try {
        configClasses = await fetchClassListByCampus(selectedCampus);
        console.log(`[班级列表] 从配置中心获取到 ${configClasses.length} 个班级:`, configClasses.map(c => c.name));
      } catch (configError: any) {
        console.warn('[班级列表] 从配置中心获取班级列表失败:', configError?.message);
        // 如果配置中心失败，尝试使用本地配置
        try {
          const campusClassList = getCampusClassList();
          const campusData = campusClassList.find(item => item.campus === selectedCampus);
          configClasses = campusData?.classes || [];
          console.log(`[班级列表] 使用本地配置的班级列表（${configClasses.length}个）`);
        } catch (localConfigError) {
          console.warn('[班级列表] 本地配置也失败:', localConfigError);
        }
      }

      // 2. 从教化司班级列表获取班级（主要数据来源）
      let tqClassNames: string[] = [];
      try {
        tqClassNames = await fetchClassNamesFromTeachingQuality(selectedCampus);
        console.log(`[班级列表] 从教化司获取到 ${tqClassNames.length} 个班级:`, tqClassNames);
      } catch (tqError: any) {
        console.warn('[班级列表] 从教化司获取班级列表失败:', tqError?.message);
      }

      // 3. 合并两个来源的班级列表（取并集）
      const classMap = new Map<string, ClassInfo>();
      
      // 先添加配置中心的班级
      configClasses.forEach(cls => {
        classMap.set(cls.name, cls);
      });
      
      // 再添加教化司的班级（如果配置中心没有，则创建一个基本的ClassInfo）
      tqClassNames.forEach(className => {
        if (!classMap.has(className)) {
          classMap.set(className, {
            id: className,
            name: className,
            campus: selectedCampus,
            major: '',
            instructor: '',
            classAdvisor: '',
            graduationTime: '',
            programLength: '',
          });
        }
      });

      const mergedClasses = Array.from(classMap.values());
      console.log(`[班级列表] 合并后的班级列表（共 ${mergedClasses.length} 个）:`, mergedClasses.map(c => c.name));
      
      setClassList(mergedClasses);
      
      if (mergedClasses.length > 0) {
        const validClasses = selectedClasses.filter(cls => mergedClasses.some(c => c.name === cls));
        if (validClasses.length === 0) {
          setSelectedClasses([mergedClasses[0].name]);
        } else {
          setSelectedClasses(validClasses);
        }
      } else {
        console.warn(`[班级列表] ⚠️ ${selectedCampus}的班级列表为空`);
        setSelectedClasses([]);
        message.warning(`${selectedCampus}暂无班级数据，请先在"系统管理 > 配置中心 > 主数据管理"中添加班级，或在教化司班级就业信息表中添加数据`);
      }
    } catch (error: any) {
      console.error('[班级列表] ❌ 加载班级列表失败:', {
        error,
        errorMessage: error?.message,
        errorResponse: error?.response,
        errorStatus: error?.response?.status,
      });
      message.error('加载班级列表失败，请检查网络连接或联系管理员');
      setClassList([]);
      setSelectedClasses([]);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('[就业信息] 开始从教化司加载数据:', { selectedCampus, selectedClasses });
      const newData: Record<string, CampusClassEmploymentInfo[]> = {};
      for (const className of selectedClasses) {
        console.log('[就业信息] 正在从教化司加载:', { campus: selectedCampus, className });
        // 从教化司的班级就业信息表获取数据
        const data = await getEmploymentInfoFromTeachingQuality(selectedCampus, className);
        console.log('[就业信息] 教化司数据加载结果:', { className, dataCount: data.length, data });
        newData[className] = data.map(d => ({ ...d, className }));
      }
      console.log('[就业信息] 所有教化司数据加载完成:', newData);
      setClassData(newData);
    } catch (error) {
      console.error('[就业信息] 加载教化司数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassList();
  }, [selectedCampus]);

  useEffect(() => {
    if (selectedCampus && selectedClasses.length > 0) {
      loadData();
    } else {
      setClassData({});
    }
  }, [selectedCampus, selectedClasses]);

  const handleCampusChange = (campus: string) => {
    setSelectedCampus(campus);
    setCampus(campus);
  };

  const handleClassChange = (classNames: string[]) => {
    if (classNames.includes('select-all')) {
      if (selectedClasses.length === classList.length) {
        setSelectedClasses([]);
      } else {
        setSelectedClasses(classList.map(c => c.name));
      }
      return;
    }
    setSelectedClasses(classNames);
  };

  const currentClassInfos = selectedClasses.map(className => getClassInfo(selectedCampus, className)).filter((info): info is ClassInfo => info !== null);

  const allStudents = Object.values(classData).flat();
  // 有回访转正金额的学生（大于0）
  const followUpStudents = allStudents.filter(item => item.followUpAssessmentSalary && item.followUpAssessmentSalary > 0);
  // 入职总数：回访情况不为空的人数
  const employedStudents = allStudents.filter(item => item.followUpCompany && String(item.followUpCompany).trim() !== '' && String(item.followUpCompany).trim() !== '0');

  const stats = {
    totalStudents: allStudents.length,
    averageProbationarySalary: allStudents.length > 0 ? allStudents.reduce((sum, item) => sum + (item.probationarySalary || 0), 0) / allStudents.length : 0,
    averageRegularSalary: allStudents.length > 0 ? allStudents.reduce((sum, item) => sum + (item.regularSalary || 0), 0) / allStudents.length : 0,

    // 回访平均薪资：使用"回访转正金额"字段计算平均值
    averageFollowUpSalary: followUpStudents.length > 0
      ? followUpStudents.reduce((sum, item) => sum + (item.followUpAssessmentSalary || 0), 0) / followUpStudents.length
      : 0,

    // 入职总数：回访情况不为空的人数
    employedCount: employedStudents.length,

    // 就业率：回访情况不为空的人数 / 学生总数
    employmentRate: allStudents.length > 0 ? employedStudents.length / allStudents.length : 0,
  };
  const columns: ColumnsType<CampusClassEmploymentInfo> = [
    { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber', width: 80 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 80 },
    { title: '年龄', dataIndex: 'age', key: 'age', width: 80 },
    { title: '所报专业', dataIndex: 'majorApplied', key: 'majorApplied', width: 120 },
    { title: '学历', dataIndex: 'educationLevel', key: 'educationLevel', width: 100 },
    { title: '专业', dataIndex: 'major', key: 'major', width: 150 },
    { title: '毕业学校', dataIndex: 'graduatedSchool', key: 'graduatedSchool', width: 150 },
    { title: '目前所获最高学历证书及性质', dataIndex: 'highestDegreeCertificate', key: 'highestDegreeCertificate', width: 200 },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 120 },
    { title: '通信地址', dataIndex: 'mailingAddress', key: 'mailingAddress', width: 150 },
    { title: '入职时间', dataIndex: 'startDate', key: 'startDate', width: 120 },
    { title: '就业地区', dataIndex: 'employmentRegion', key: 'employmentRegion', width: 100 },
    { title: '就业单位', dataIndex: 'employer', key: 'employer', width: 150 },
    { title: '就业岗位', dataIndex: 'jobPosition', key: 'jobPosition', width: 150 },
    { title: '试用期薪资', dataIndex: 'probationarySalary', key: 'probationarySalary', width: 120, render: (value: number) => value !== undefined && value !== null ? `¥${value}` : '-' },
    { title: '转正薪资', dataIndex: 'regularSalaryText', key: 'regularSalaryText', width: 140, render: (value?: string) => value || '-' },
    { title: '回访情况', dataIndex: 'followUpCompany', key: 'followUpCompany', width: 150 },
    { 
      title: '回访转正金额', 
      dataIndex: 'followUpAssessmentSalary', 
      key: 'followUpAssessmentSalary', 
      width: 120, 
      render: (value: number) => {
        // 如果值为undefined、null或0，显示"-"；否则显示金额
        if (value === undefined || value === null || value === 0) {
          return '-';
        }
        return `¥${value}`;
      }
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {selectedCampus} 就业信息总览
        </Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        {selectedClasses.length > 1 && (
          <Alert
            message={`当前已选择 ${selectedClasses.length} 个班级，表格将同时展示所有选中班级的数据`}
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Space>
              <span>神殿：</span>
              <Select value={selectedCampus} onChange={handleCampusChange} style={{ width: 120 }}>
                {getAllCampusNames().map(campus => (
                  <Option key={campus} value={campus}>{campus}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={18}>
            <Space>
              <span>班级：</span>
              <Select
                mode="multiple"
                value={selectedClasses}
                onChange={handleClassChange}
                style={{ minWidth: 200, maxWidth: 400 }}
                placeholder="请选择班级（可多选）"
                maxTagCount="responsive"
              >
                <Option key="select-all" value="select-all">全选</Option>
                {classList.map(cls => (
                  <Option key={cls.name} value={cls.name}>{cls.name}</Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card><Statistic title="学生总数" value={stats.totalStudents} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="学生入职总数" value={stats.employedCount} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="就业率" value={stats.employmentRate * 100} suffix="%" precision={0} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="回访平均薪资" value={stats.averageFollowUpSalary} precision={0} /></Card>
        </Col>
      </Row>

      <div>
        {selectedClasses.map(className => {
          const classInfo = currentClassInfos.find(info => info.name === className);
          const dataSource = classData[className] || [];
          return (
            <Card 
              key={className} 
              title={`${className}班 就业信息表`} 
              style={{ marginBottom: 16 }}
              extra={classInfo ? `专业：${classInfo.major} | 授课教员：${classInfo.instructor} | 班主任：${classInfo.classAdvisor} | 毕业时间：${classInfo.graduationTime}` : ''}
            >
              <Table
                columns={columns}
                dataSource={dataSource}
                loading={loading && dataSource.length === 0}
                pagination={{ pageSize: 10, simple: true }}
                rowKey={(record) => `${record.campus}-${record.className}-${record.id}`}
                scroll={{ x: 2000 }}
                size="small"
                bordered
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CampusClassEmploymentInfoPage;
