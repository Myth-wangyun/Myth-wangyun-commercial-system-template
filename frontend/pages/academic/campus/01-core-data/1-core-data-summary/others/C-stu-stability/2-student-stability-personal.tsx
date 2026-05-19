import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Table, Button, Modal, Form, Input, InputNumber, Select, Typography, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import api from '@/services/api';
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

interface PersonalStabilityRecord {
  id: string;
  serialNumber: number;
  instructorName: string;
  handoverCount: number;
  enrollmentCount: number;
  refundCount: number;
}

type PersonalFormValues = Omit<PersonalStabilityRecord, 'id'>;

const calcRate = (record: PersonalStabilityRecord): number | null =>
  record.enrollmentCount > 0 ? (record.refundCount / record.enrollmentCount) * 100 : null;

const rateText = (rate: number | null): string =>
  rate === null ? '#DIV/0!' : `${rate.toFixed(1)}%`;

const StudentStabilityPersonalPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses } = useCampusStore();
  const activeCampus = currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿';

  const [rows, setRows] = useState<PersonalStabilityRecord[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PersonalStabilityRecord | null>(null);
  const [form] = Form.useForm<PersonalFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teacherNames, setTeacherNames] = useState<string[]>([]);
  const [year, setYear] = useState<number>(dayjs().year());

  // 生成年份选项
  const currentYear = dayjs().year();
  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: currentYear - 5 + i,
    label: `${currentYear - 5 + i}年`,
  }));

  const loadData = (autoSave: boolean = false) => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const teachers = await fetchTeachers({
          campus_name: activeCampus,
          active: true,
          participate_kpi: true,
        });
        if (cancelled) return;
        const names = teachers
          .filter((t: TeacherProfile) => t.is_active && t.participate_kpi)
          .map((t) => t.name)
          .filter(Boolean);
        setTeacherNames(names);

        const res = await api.get('/student-stability-personal-summary', {
          params: { campus: activeCampus, year: year },
        });
        const data = res.data;
        const monthlyRows: PersonalStabilityRecord[] = [];
        if (data?.行列表 && data.行列表.length > 0) {
          data.行列表.forEach((item: any) => {
            const name = item.教员姓名?.trim();
            if (!name) return;
            monthlyRows.push({
              id: `teacher-${item.教员序号}`,
              serialNumber: item.教员序号,
              instructorName: name,
              handoverCount: item.交接人数 || 0,
              enrollmentCount: item.入学人数 || 0,
              refundCount: item.退费人数 || 0,
            });
          });
        }
        
        const finalRows = monthlyRows.sort((a, b) => a.serialNumber - b.serialNumber);
        setRows(finalRows);
        
        // 如果需要自动保存，则保存到后端
        if (autoSave && finalRows.length > 0) {
          try {
            const payload = {
              神殿名称: activeCampus,
              年份: year,
              行列表: finalRows.map((row) => ({
                教员序号: row.serialNumber,
                教员姓名: row.instructorName,
                交接人数: row.handoverCount,
                入学人数: row.enrollmentCount,
                退费人数: row.refundCount,
              })),
            };
            await api.post('/student-stability-personal-summary', payload);
          } catch (saveError: any) {
            console.error('自动保存失败', saveError);
            // 静默失败，不显示错误提示
          }
        }
      } catch (error) {
        console.error('加载数据失败', error);
        message.error('加载教员或汇总数据失败，请稍后重试');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    const disposer = loadData(true); // 初次加载时自动保存
    return () => {
      if (typeof disposer === 'function') disposer();
    };
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

  const columns: ColumnsType<PersonalStabilityRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
    },
    {
      title: '教员姓名',
      dataIndex: 'instructorName',
      key: 'instructorName',
      width: 160,
      align: 'center',
      render: value => value || '',
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

  const openModal = (record?: PersonalStabilityRecord) => {
    setEditingRecord(record ?? null);
    form.resetFields();
    form.setFieldsValue({
      serialNumber: record?.serialNumber ?? undefined,
      instructorName: record?.instructorName ?? '',
      handoverCount: record?.handoverCount ?? 0,
      enrollmentCount: record?.enrollmentCount ?? 0,
      refundCount: record?.refundCount ?? 0,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const next = [...rows];
      const idx = next.findIndex((item) => item.serialNumber === values.serialNumber);
      const normalized: PersonalStabilityRecord = {
        id: `teacher-${values.serialNumber}`,
        serialNumber: values.serialNumber,
        instructorName: values.instructorName.trim(),
        handoverCount: Number(values.handoverCount) || 0,
        enrollmentCount: Number(values.enrollmentCount) || 0,
        refundCount: Number(values.refundCount) || 0,
      };
      if (idx >= 0) {
        next[idx] = normalized;
      } else {
        next.push(normalized);
      }
      setRows(next.sort((a, b) => a.serialNumber - b.serialNumber));
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
      if (rows.length === 0) {
        message.warning('没有可保存的数据');
        return;
      }
      const payload = {
        神殿名称: activeCampus,
        年份: year,
        行列表: rows.map((row) => ({
          教员序号: row.serialNumber,
          教员姓名: row.instructorName,
          交接人数: row.handoverCount,
          入学人数: row.enrollmentCount,
          退费人数: row.refundCount,
        })),
      };
      await api.post('/student-stability-personal-summary', payload);
      message.success('已保存到后端');
    } catch (error: any) {
      console.error('保存失败', error);
      message.error(error?.response?.data?.detail || '保存失败，请稍后重试');
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

            // 查找表头行
            const headers = jsonData[0] || [];
            const headerMap: Record<string, number> = {};
            
            headers.forEach((header: any, index: number) => {
              const headerStr = String(header || '').trim();
              if (headerStr.includes('序号')) {
                headerMap['serial'] = index;
              } else if (headerStr.includes('教员姓名') || headerStr.includes('姓名')) {
                headerMap['name'] = index;
              } else if (headerStr.includes('交接人数') || headerStr.includes('交接')) {
                headerMap['handover'] = index;
              } else if (headerStr.includes('入学人数') || headerStr.includes('入学')) {
                headerMap['enrollment'] = index;
              } else if (headerStr.includes('退费人数') || headerStr.includes('退费')) {
                headerMap['refund'] = index;
              }
            });

            if (!headerMap['name']) {
              message.error('无法识别Excel表头，请确保包含"教员姓名"列');
              return;
            }

            // 解析数据行
            const importedRows: PersonalStabilityRecord[] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              if (!row || row.every((cell: any) => !cell)) continue; // 跳过空行

              const name = String(row[headerMap['name']] || '').trim();
              if (!name || name === '合计' || name === '总计') continue; // 跳过合计行

              const serial = headerMap['serial'] !== undefined 
                ? Number(row[headerMap['serial']]) || importedRows.length + 1 
                : importedRows.length + 1;
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
                id: `teacher-${serial}`,
                serialNumber: serial,
                instructorName: name,
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
            setRows(importedRows.sort((a, b) => a.serialNumber - b.serialNumber));
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
            后端新生维稳个人汇总表
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

        <Table<PersonalStabilityRecord>
          bordered
          size="small"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          pagination={false}
          loading={loading}
          onRow={record => ({
            onDoubleClick: () => openModal(record),
          })}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} align="center">
                  <span style={{ color: '#ff4d4f', fontWeight: 600 }}>合计</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} />
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
        title={editingRecord ? `编辑序号 ${editingRecord.serialNumber}` : '填写教员数据'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        onOk={handleSave}
        destroyOnClose
        width={520}
      >
        <Form<PersonalFormValues> form={form} layout="vertical">
          <Form.Item
            label="序号"
            name="serialNumber"
            rules={[{ required: true, message: '请选择序号' }]}
          >
            <Select placeholder="请选择序号">
              {Array.from({ length: Math.max(teacherNames.length || rows.length || 1) }, (_, index) => {
                const value = index + 1;
                const displayName = teacherNames[value - 1] || rows.find((r) => r.serialNumber === value)?.instructorName;
                return (
                  <Option key={value} value={value}>
                    {value} {displayName ? `(${displayName})` : ''}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            label="教员姓名"
            name="instructorName"
            rules={[{ required: true, message: '请输入教员姓名' }]}
          >
            <Input placeholder="请输入教员姓名" />
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

export default StudentStabilityPersonalPage;
