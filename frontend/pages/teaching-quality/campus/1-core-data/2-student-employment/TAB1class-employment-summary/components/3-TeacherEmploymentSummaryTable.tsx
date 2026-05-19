/**
 * 神殿后端班主任就业汇总表组件
 */

import React from 'react';
import { App, Card, Table, Button, Space, Row, Col, Statistic, Tag, Modal, Form, DatePicker, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons';
import type { TeacherEmploymentSummaryTableProps, TeacherEmploymentSummaryRecord } from '@/types/teacher-employment-summary';
import { tqTeacherEmploymentSummaryService } from '@/services/teaching-quality/TQteacherEmploymentSummary';
import dayjs from 'dayjs';

const TeacherEmploymentSummaryTable: React.FC<TeacherEmploymentSummaryTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport
}) => {
  const { message } = App.useApp()
  const [editVisible, setEditVisible] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<TeacherEmploymentSummaryRecord | null>(null);
  const [form] = Form.useForm();

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿');
      return;
    }

    try {
      const blob = await tqTeacherEmploymentSummaryService.exportTeacherEmploymentSummaryData(campus);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${campus}神殿后端班主任就业汇总表.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 计算教员姓名列的rowSpan
  const getTeacherNameRowSpan = (record: TeacherEmploymentSummaryRecord) => {
    if (record.rowType === 'subtotal' || record.rowType === 'total') {
      return 0;
    }
    
    // 检查是否是该教员的第一行
    const currentIndex = data.indexOf(record);
    if (currentIndex > 0) {
      const prevRecord = data[currentIndex - 1];
      if (prevRecord.teacherName === record.teacherName && prevRecord.rowType !== 'subtotal') {
        // 不是第一行，返回0不显示
        return 0;
      }
    }
    
    // 计算这个教员的所有行（包括合计行）
    let rowCount = 0;
    for (let i = currentIndex; i < data.length; i++) {
      if (data[i].rowType === 'subtotal') {
        rowCount++; // 合计行也算在内
        break;
      }
      if (data[i].teacherName && data[i].teacherName !== record.teacherName && i !== currentIndex) {
        break; // 遇到下一个教员，停止
      }
      rowCount++;
    }
    
    return rowCount;
  };

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalTeachers: 0,
        totalSalaryOverTenThousand: 0,
        averageAchievementRate: 0,
        averageEmploymentRate: 0
      };
    }

    const dataRows = data.filter(r => r.rowType === 'data');
    const totalRow = data.find(r => r.rowType === 'total');
    
    const teachers = new Set<string>();
    dataRows.forEach((r, index) => {
      for (let i = index; i >= 0; i--) {
        if (data[i].teacherName) {
          teachers.add(data[i].teacherName);
          break;
        }
        if (data[i].rowType === 'subtotal') {
          break;
        }
      }
    });

    return {
      totalTeachers: teachers.size,
      totalSalaryOverTenThousand: totalRow?.salaryOverTenThousand || 0,
      averageAchievementRate: Math.floor(
        dataRows.reduce((sum, r) => sum + (r.achievementRate || 0), 0) / dataRows.length
      ),
      averageEmploymentRate: totalRow?.employmentRate || 0
    };
  }, [data]);

  // 计算某个小计行对应教员的加权平均薪资（按档案人数加权；若档案人数为0则退化为算术平均）
  const computeTeacherAverages = (subtotalRecord: TeacherEmploymentSummaryRecord) => {
    // 以当前小计行作为锚点，找到上一小计行位置，取二者之间的所有明细行进行计算
    const idx = data.indexOf(subtotalRecord);
    let start = -1; // 上一个小计行的索引（没有则为 -1）
    for (let i = idx - 1; i >= 0; i -= 1) {
      if (data[i].rowType === 'subtotal') { start = i; break; }
    }

    let targetWeighted = 0;
    let actualWeighted = 0;
    let count = 0; // 加权分母（fileCount>0 用 fileCount，否则用1）

    for (let i = start + 1; i < idx; i += 1) {
      const r = data[i];
      if (!r || r.rowType !== 'data') continue;
      const files = Number(r.fileCount) || 0;
      const t = Number(r.targetAverageSalary) || 0;
      const a = Number(r.actualAverageSalary) || 0;
      const weight = files > 0 ? files : 1;
      targetWeighted += t * weight;
      actualWeighted += a * weight;
      count += weight;
    }

    const avgTarget = count > 0 ? Math.round(targetWeighted / count) : 0;
    const avgActual = count > 0 ? Math.round(actualWeighted / count) : 0;
    return { avgTarget, avgActual };
  };

  // 计算总计行的加权平均薪资
  const computeTotalAverages = () => {
    let fileSum = 0;
    let targetWeighted = 0;
    let actualWeighted = 0;
    let count = 0;
    data.forEach((r) => {
      if (r.rowType !== 'data') return;
      const files = Number(r.fileCount) || 0;
      const t = Number(r.targetAverageSalary) || 0;
      const a = Number(r.actualAverageSalary) || 0;
      fileSum += files;
      targetWeighted += t * (files > 0 ? files : 1);
      actualWeighted += a * (files > 0 ? files : 1);
      count += files > 0 ? files : 1;
    });
    const avgTarget = count > 0 ? Math.round(targetWeighted / count) : 0;
    const avgActual = count > 0 ? Math.round(actualWeighted / count) : 0;
    return { avgTarget, avgActual };
  };

  // 打开编辑弹窗
  const handleEdit = (record: TeacherEmploymentSummaryRecord) => {
    if (record.rowType !== 'data') return;
    setEditingRow(record);
    form.setFieldsValue({
      graduationTime: record.graduationTime ? dayjs(record.graduationTime) : null,
      targetAverageSalary: record.targetAverageSalary,
      targetEmploymentCount: record.targetEmploymentCount,
    });
    setEditVisible(true);
  };

  const handleEditOk = async () => {
    if (!editingRow || !campus) return;
    try {
      const values = await form.validateFields();
      setEditLoading(true);
      if (!editingRow.summaryId) {
        message.error('缺少汇总ID，无法更新');
        return;
      }
      // 教化司数据直接从QT表读取，暂不支持编辑
      // 如果需要修改，请直接在"班就业目标与结果汇总"页面修改原始数据
      message.info('教化司数据直接从QT班就业信息表读取，请在"班就业目标与结果汇总"页面修改原始数据');
      setEditVisible(false);
      setEditingRow(null);
      return;
      
      // await tqTeacherEmploymentSummaryService.updateTeacherEmploymentSummary(campus, editingRow.summaryId, {
      //   毕业时间: values.graduationTime ? values.graduationTime.format('YYYY-MM-DD') : undefined,
      //   目标平均就业薪资: values.targetAverageSalary ?? undefined,
      //   目标就业人数: values.targetEmploymentCount ?? undefined,
      // });
      // message.success('保存成功');
      setEditVisible(false);
      setEditingRow(null);
      onRefresh();
    } catch (err: any) {
      if (!err?.errorFields) {
        message.error('保存失败');
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditVisible(false);
    setEditingRow(null);
    form.resetFields();
  };

  const columns: ColumnsType<TeacherEmploymentSummaryRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'subtotal') {
          return {
            children: null,
            props: { rowSpan: 0 },
          };
        }
        if (record.rowType === 'total') {
          return {
            children: '',
            props: { rowSpan: 1 },
          };
        }
        // 序号只在每个班主任的第一行显示，通过rowSpan合并显示
        const rowSpan = getTeacherNameRowSpan(record);
        return {
          children: rowSpan > 0 ? value : null,
          props: {
            rowSpan: rowSpan > 0 ? rowSpan : 0
          }
        };
      }
    },
    {
      title: '班主任',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      fixed: 'left',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return {
            children: '',
            props: { rowSpan: 1 },
          };
        }
        const rowSpan = getTeacherNameRowSpan(record);
        return {
          children: value,
          props: {
            rowSpan: rowSpan
          }
        };
      }
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'subtotal') {
          return <span style={{ color: '#1890ff', fontWeight: 'bold' }}>合计/平均</span>;
        }
        if (record.rowType === 'total') {
          return <span style={{ color: '#1890ff', fontWeight: 'bold' }}>合计</span>;
        }
        return value;
      }
    },
    {
      title: '学制',
      dataIndex: 'programLength',
      key: 'programLength',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        if (record.rowType === 'subtotal' || record.rowType === 'total') {
          return null;
        }
        return value;
      }
    },
    {
      title: '班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 120,
      render: (value, record) => {
        if (record.rowType === 'subtotal' || record.rowType === 'total') {
          return '';
        }
        return value;
      }
    },
    {
      title: '毕业时间',
      dataIndex: 'graduationTime',
      key: 'graduationTime',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (record.rowType === 'subtotal' || record.rowType === 'total') {
          return null;
        }
        return value || '-';
      }
    },
    {
      title: () => <div>就业薪资</div>,
      children: [
        {
          title: '目标平均就业薪资',
          dataIndex: 'targetAverageSalary',
          key: 'targetAverageSalary',
          width: 150,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'subtotal') {
              const direct = Number(record.targetAverageSalary) || 0;
              if (direct > 0) return `¥${direct.toLocaleString()}`;
              const { avgTarget } = computeTeacherAverages(record);
              return `¥${(avgTarget || 0).toLocaleString()}`;
            }
            if (record.rowType === 'total') {
              const direct = Number(record.targetAverageSalary) || 0;
              if (direct > 0) return `¥${direct.toLocaleString()}`;
              const { avgTarget } = computeTotalAverages();
              return `¥${(avgTarget || 0).toLocaleString()}`;
            }
            if (!value) {
              return '-';
            }
            return `¥${value.toLocaleString()}`;
          }
        },
        {
          title: '实际平均就业薪资',
          dataIndex: 'actualAverageSalary',
          key: 'actualAverageSalary',
          width: 150,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'subtotal') {
              const { avgActual } = computeTeacherAverages(record);
              return `¥${(avgActual || 0).toLocaleString()}`;
            }
            if (record.rowType === 'total') {
              const { avgActual } = computeTotalAverages();
              return `¥${(avgActual || 0).toLocaleString()}`;
            }
            if (!value) {
              return '-';
            }
            return `¥${value.toLocaleString()}`;
          }
        },
        {
          title: '达标率',
          dataIndex: 'achievementRate',
          key: 'achievementRate',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (!value && record.rowType !== 'subtotal' && record.rowType !== 'total') {
              return '-';
            }
            if (!value) return null;
            return (
              <Tag color={value >= 100 ? 'green' : value >= 80 ? 'orange' : 'red'}>
                {value}%
              </Tag>
            );
          }
        },
      ]
    },
    {
      title: () => <div>就业率</div>,
      children: [
        {
          title: '档案人数',
          dataIndex: 'fileCount',
          key: 'fileCount',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (!value && record.rowType !== 'subtotal' && record.rowType !== 'total') {
              return '-';
            }
            return value || null;
          }
        },
        {
          title: '目标就业人数',
          dataIndex: 'targetEmploymentCount',
          key: 'targetEmploymentCount',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (!value && record.rowType !== 'subtotal' && record.rowType !== 'total') {
              return '-';
            }
            return value || null;
          }
        },
        {
          title: '实际就业人数',
          dataIndex: 'actualEmploymentCount',
          key: 'actualEmploymentCount',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (!value && record.rowType !== 'subtotal' && record.rowType !== 'total') {
              return '-';
            }
            return value || null;
          }
        },
        {
          title: '就业率',
          dataIndex: 'employmentRate',
          key: 'employmentRate',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (!value && record.rowType !== 'subtotal' && record.rowType !== 'total') {
              return '-';
            }
            if (!value) return null;
            return (
              <Tag color={value >= 90 ? 'green' : value >= 80 ? 'orange' : 'red'}>
                {value}%
              </Tag>
            );
          }
        },
      ]
    },
    {
      title: '薪资过万人数',
      dataIndex: 'salaryOverTenThousand',
      key: 'salaryOverTenThousand',
      width: 120,
      align: 'center',
      render: (value, record, index) => {
        if (!value && record.rowType !== 'subtotal' && record.rowType !== 'total') {
          return '-';
        }
        if (record.rowType === 'total') {
          return (
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {value}
            </span>
          );
        }
        return value || null;
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_value, record) => {
        // 允许明细行与小计行编辑；总计行不显示
        if (record.rowType === 'total') return null;
        return (
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
        );
      }
    },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      {data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="教员总数"
                value={stats.totalTeachers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="薪资过万总人数"
                value={stats.totalSalaryOverTenThousand}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均达标率"
                value={stats.averageAchievementRate}
                suffix="%"
                valueStyle={{ color: stats.averageAchievementRate >= 100 ? '#52c41a' : '#faad14' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均就业率"
                value={stats.averageEmploymentRate}
                suffix="%"
                valueStyle={{ color: stats.averageEmploymentRate >= 90 ? '#52c41a' : '#faad14' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}神殿后端班主任就业汇总表`}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleExport}
              disabled={!campus || data.length === 0}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 1600 }}
          rowKey="key"
          size="small"
          rowClassName={(record) => {
            if (record.rowType === 'total') {
              return 'table-row-total';
            }
            if (record.rowType === 'subtotal') {
              return 'table-row-subtotal';
            }
            return '';
          }}
        />
      </Card>

      <Modal
        title="编辑教员就业汇总"
        open={editVisible}
        confirmLoading={editLoading}
        onOk={handleEditOk}
        onCancel={handleEditCancel}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="毕业时间" name="graduationTime">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="目标平均就业薪资" name="targetAverageSalary">
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
          <Form.Item label="目标就业人数" name="targetEmploymentCount">
            <InputNumber style={{ width: '100%' }} min={0} step={1} />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .table-row-total {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .table-row-subtotal {
          background-color: #fafafa;
        }
      `}</style>
    </div>
  );
};

export default TeacherEmploymentSummaryTable;