import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Table, Button, Modal, Form, InputNumber, Select, Typography, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useCampusStore } from '@/stores/campusStore';
import { shortCampusName } from '@/pages/academic/teaching-content/shared/campusStorage';
import CampusSelector from '@/components/common/CampusSelector';
import api from '@/services/api';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

interface MonthlyStabilityRecord {
  id: string;
  month: number;
  handoverCount: number;
  enrollmentCount: number;
  refundCount: number;
}

interface MonthlyStabilityFormValues {
  month: number;
  handoverCount: number;
  enrollmentCount: number;
  refundCount: number;
}

const MONTH_COUNT = 12;

const createDefaultRows = (): MonthlyStabilityRecord[] =>
  Array.from({ length: MONTH_COUNT }, (_, index) => ({
    id: `month-${index + 1}`,
    month: index + 1,
    handoverCount: 0,
    enrollmentCount: 0,
    refundCount: 0,
  }));

const calcRate = (record: MonthlyStabilityRecord): number | null =>
  record.enrollmentCount > 0 ? (record.refundCount / record.enrollmentCount) * 100 : null;

const rateText = (rate: number | null): string =>
  rate === null ? '#DIV/0!' : `${rate.toFixed(1)}%`;

const StudentStabilityMonthlyPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿';
  const campusShort = shortCampusName(activeCampus);

  const [rows, setRows] = useState<MonthlyStabilityRecord[]>(() => createDefaultRows());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MonthlyStabilityRecord | null>(null);
  const [form] = Form.useForm<MonthlyStabilityFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState<number>(dayjs().year());

  // 生成年份选项
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: currentYear - 5 + i,
    label: `${currentYear - 5 + i}年`,
  }));

  const loadData = async (autoSave: boolean = false) => {
    setLoading(true);
    try {
      const res = await api.get('/student-stability-monthly-summary', {
        params: { campus: activeCampus, year: year },
      });
      const data = res.data;
      if (data?.行列表 && data.行列表.length > 0) {
        const normalized: MonthlyStabilityRecord[] = data.行列表.map((item: any) => ({
          id: `month-${item.月份}`,
          month: item.月份,
          handoverCount: item.交接人数 || 0,
          enrollmentCount: item.入学人数 || 0,
          refundCount: item.退费人数 || 0,
        }));
        // 补齐缺失月份
        const monthMap = new Map<number, MonthlyStabilityRecord>();
        normalized.forEach((r) => monthMap.set(r.month, r));
        for (let m = 1; m <= MONTH_COUNT; m += 1) {
          if (!monthMap.has(m)) {
            monthMap.set(m, {
              id: `month-${m}`,
              month: m,
              handoverCount: 0,
              enrollmentCount: 0,
              refundCount: 0,
            });
          }
        }
        const finalRows = Array.from(monthMap.values()).sort((a, b) => a.month - b.month);
        setRows(finalRows);
        
        // 如果需要自动保存，则保存到后端
        if (autoSave) {
          try {
            const payload = {
              神殿名称: activeCampus,
              年份: year,
              行列表: finalRows.map((row) => ({
                月份: row.month,
                交接人数: row.handoverCount,
                入学人数: row.enrollmentCount,
                退费人数: row.refundCount,
              })),
            };
            await api.post('/student-stability-monthly-summary', payload);
          } catch (saveError: any) {
            console.error('自动保存失败', saveError);
            // 静默失败，不显示错误提示
          }
        }
      } else {
        setRows(createDefaultRows());
      }
    } catch (error) {
      console.error('加载月度汇总失败', error);
      message.error('加载月度汇总失败，请稍后重试');
      setRows(createDefaultRows());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true); // 初次加载时自动保存
  }, [activeCampus, year]);

  const totals = useMemo(() => {
    const handover = rows.reduce((sum, item) => sum + item.handoverCount, 0);
    const enrollment = rows.reduce((sum, item) => sum + item.enrollmentCount, 0);
    const refund = rows.reduce((sum, item) => sum + item.refundCount, 0);
    return {
      handover,
      enrollment,
      refund,
      rate: enrollment > 0 ? (refund / enrollment) * 100 : null,
    };
  }, [rows]);

  const columns: ColumnsType<MonthlyStabilityRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      align: 'center',
      render: (_value, _record, index) => (index === 0 ? campusShort : ''),
    },
    {
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 140,
      align: 'center',
      render: value => (value > 0 ? value : ''),
    },
    {
      title: '入学人数',
      dataIndex: 'enrollmentCount',
      key: 'enrollmentCount',
      width: 140,
      align: 'center',
      render: value => (value > 0 ? value : ''),
    },
    {
      title: '退费人数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 140,
      align: 'center',
      render: value => (value > 0 ? value : ''),
    },
    {
      title: '退费率',
      key: 'refundRate',
      width: 140,
      align: 'center',
      render: (_, record) => rateText(calcRate(record)),
    },
  ];

  const openModal = (record?: MonthlyStabilityRecord) => {
    setEditingRecord(record ?? null);
    form.resetFields();
    form.setFieldsValue({
      month: record?.month ?? undefined,
      handoverCount: record?.handoverCount ?? 0,
      enrollmentCount: record?.enrollmentCount ?? 0,
      refundCount: record?.refundCount ?? 0,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setRows(prev =>
        prev.map(item =>
          item.month === values.month
            ? {
                ...item,
                handoverCount: values.handoverCount,
                enrollmentCount: values.enrollmentCount,
                refundCount: values.refundCount,
              }
            : item,
        ),
      );
      setModalVisible(false);
      setEditingRecord(null);
      message.success('保存成功');
    } catch {
      // ignore
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        神殿名称: activeCampus,
        年份: year,
        行列表: rows.map((row) => ({
          月份: row.month,
          交接人数: row.handoverCount,
          入学人数: row.enrollmentCount,
          退费人数: row.refundCount,
        })),
      };
      await api.post('/student-stability-monthly-summary', payload);
      message.success('月度汇总已保存');
      await loadData();
    } catch (error: any) {
      console.error('保存月度汇总失败', error);
      message.error(error?.response?.data?.detail || '保存月度汇总失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  // Excel导入功能
  const handleImportExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

            if (jsonData.length < 2) {
              message.error('Excel文件内容为空或格式不正确');
              return;
            }

            // 查找表头行（可能在第1行或第2行）
            let headerRow = 0;
            const headers = jsonData[0] || [];
            const headerMap: Record<string, number> = {};
            
            headers.forEach((header: any, index: number) => {
              const headerStr = String(header || '').trim();
              if (headerStr.includes('月份') || headerStr.includes('月')) {
                headerMap['month'] = index;
              } else if (headerStr.includes('神殿')) {
                headerMap['campus'] = index;
              } else if (headerStr.includes('交接人数') || headerStr.includes('交接')) {
                headerMap['handover'] = index;
              } else if (headerStr.includes('入学人数') || headerStr.includes('入学')) {
                headerMap['enrollment'] = index;
              } else if (headerStr.includes('退费人数') || headerStr.includes('退费')) {
                headerMap['refund'] = index;
              }
            });

            if (!headerMap['month'] && !headerMap['handover']) {
              message.error('无法识别Excel表头，请确保包含"月份"、"交接人数"等列');
              return;
            }

            // 解析数据行
            const importedRows: MonthlyStabilityRecord[] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.every((cell: any) => !cell)) continue; // 跳过空行

              const month = headerMap['month'] !== undefined 
                ? Number(row[headerMap['month']]) || 0 
                : i; // 如果没有月份列，使用行号
              
              if (month < 1 || month > 12) continue; // 跳过无效月份

              const handover = headerMap['handover'] !== undefined 
                ? Number(row[headerMap['handover']]) || 0 
                : 0;
              const enrollment = headerMap['enrollment'] !== undefined 
                ? Number(row[headerMap['enrollment']]) || 0 
                : 0;
              const refund = headerMap['refund'] !== undefined 
                ? Number(row[headerMap['refund']]) || 0 
                : 0;

              importedRows.push({
                id: `month-${month}`,
                month,
                handoverCount: handover,
                enrollmentCount: enrollment,
                refundCount: refund,
              });
            }

            if (importedRows.length === 0) {
              message.error('未能从Excel中解析出有效数据');
              return;
            }

            // 更新表格数据
            const monthMap = new Map<number, MonthlyStabilityRecord>();
            rows.forEach((r) => monthMap.set(r.month, r));
            importedRows.forEach((r) => monthMap.set(r.month, r));
            
            // 补齐缺失月份
            for (let m = 1; m <= MONTH_COUNT; m++) {
              if (!monthMap.has(m)) {
                monthMap.set(m, {
                  id: `month-${m}`,
                  month: m,
                  handoverCount: 0,
                  enrollmentCount: 0,
                  refundCount: 0,
                });
              }
            }

            setRows(Array.from(monthMap.values()).sort((a, b) => a.month - b.month));
            message.success(`成功导入 ${importedRows.length} 条数据`);
          } catch (error) {
            console.error('Excel解析失败:', error);
            message.error('Excel文件解析失败，请检查文件格式');
          } finally {
            setLoading(false);
          }
        };
        reader.onerror = () => {
          message.error('文件读取失败');
          setLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('导入失败:', error);
        message.error('导入失败，请稍后重试');
        setLoading(false);
      }
    };
    input.click();
  };

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            {campusShort}后端新生维稳月度汇总表
          </Title>
          <Space>
            <Select
              value={year}
              onChange={setYear}
              options={yearOptions}
              style={{ width: 120 }}
            />
          <CampusSelector />
          </Space>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Button onClick={() => loadData(true)} loading={loading}>
            刷新
          </Button>
        </Space>

        <Table<MonthlyStabilityRecord>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          pagination={false}
          loading={loading}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} align="center">
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>合计</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="center" />
                <Table.Summary.Cell index={2} align="center">
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{totals.handover}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="center">
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{totals.enrollment}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="center">
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{totals.refund}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="center">
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{rateText(totals.rate)}</span>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Modal
        title={editingRecord ? `编辑 ${editingRecord.month} 月数据` : '填写维稳数据'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        onOk={handleSave}
        destroyOnClose
        width={480}
      >
        <Form<MonthlyStabilityFormValues> form={form} layout="vertical">
          <Form.Item
            label="月份"
            name="month"
            rules={[{ required: true, message: '请选择月份' }]}
          >
            <Select placeholder="请选择月份">
              {Array.from({ length: MONTH_COUNT }, (_, index) => (
                <Option key={index + 1} value={index + 1}>
                  {index + 1}月
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="交接人数"
            name="handoverCount"
            rules={[{ required: true, message: '请输入交接人数' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="入学人数"
            name="enrollmentCount"
            rules={[{ required: true, message: '请输入入学人数' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="退费人数"
            name="refundCount"
            rules={[{ required: true, message: '请输入退费人数' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentStabilityMonthlyPage;
