/**
 * XX神殿活动计划安排表 (已接入后端)
 */

import React, { useState, useEffect } from 'react';
import { App, Card, Table, Button, Space, Select, Input, Modal, Form, DatePicker } from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloudDownloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useCampusStore } from '@/stores/campusStore';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

import { buildApiUrl } from '@/utils/apiBase';

// 活动计划记录接口
interface CampusActivityPlanRecord {
  key: string;
  time: string; // 时间
  location: string; // 地点
  activityForm: string; // 活动形式
  mainContent: string; // 主要内容
  responsible: string; // 负责人
  expectedResult: string; // 预期结果
  processKeyPoints: string; // 过程关键点
  actualResult: string; // 实标结果
}

const CampusActivityPlanTable: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore();
  const campuses = getAllCampuses();
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CampusActivityPlanRecord | null>(null);
  const [form] = Form.useForm();

  const [dataSource, setDataSource] = useState<CampusActivityPlanRecord[]>([]);
  const [yearSummaryData, setYearSummaryData] = useState<CampusActivityPlanRecord[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showYearData, setShowYearData] = useState(false);

  const isDateInSelectedMonth = (date: dayjs.Dayjs) =>
    date.year() === selectedYear && date.month() + 1 === selectedMonth;

  const disabledDate = (current: dayjs.Dayjs | null) =>
    !!current && !isDateInSelectedMonth(current);

  const hasMismatchedTimes = () => {
    const mismatched = dataSource.filter((row) => {
      if (!row.time) return false;
      const parsed = dayjs(row.time);
      if (!parsed.isValid()) return true;
      return !isDateInSelectedMonth(parsed);
    });
    if (mismatched.length > 0) {
      message.warning('发现存在活动时间不在当前筛选年月的数据，请切换月份后再保存。');
      return true;
    }
    return false;
  };

  // 加载全年汇总数据
  const loadYearSummary = async () => {
    if (!selectedCampus) return;
    setLoadingSummary(true);
    try {
      const allRows: CampusActivityPlanRecord[] = [];
      // 加载全年12个月的数据
      for (let month = 1; month <= 12; month++) {
        try {
          const params = new URLSearchParams({
            campus: selectedCampus,
            year: selectedYear.toString(),
            month: month.toString(),
          });
          const res = await fetch(`${buildApiUrl('/teaching-quality/campus-activity-plan')}?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            const rows = (data.行列表 || []).map((r: any, idx: number) => ({
              key: `${month}-${idx + 1}`,
              time: r.时间 || '',
              location: r.地点 || '',
              activityForm: r.活动形式 || '',
              mainContent: r.主要内容 || '',
              responsible: r.负责人 || '',
              expectedResult: r.预期结果 || '',
              processKeyPoints: r.过程关键点 || '',
              actualResult: r.实标结果 || '',
            }));
            allRows.push(...rows);
          }
        } catch (e) {
          console.error(`加载${month}月数据失败:`, e);
        }
      }
      setYearSummaryData(allRows);
    } catch (e: any) {
      console.error('加载全年汇总失败:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  // 加载数据
  const loadData = async () => {
    if (!selectedCampus) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        campus: selectedCampus,
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });
      const res = await fetch(`${buildApiUrl('/teaching-quality/campus-activity-plan')}?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const rows = (data.行列表 || []).map((r: any, idx: number) => ({
        key: String(idx + 1),
        time: r.时间 || '',
        location: r.地点 || '',
        activityForm: r.活动形式 || '',
        mainContent: r.主要内容 || '',
        responsible: r.负责人 || '',
        expectedResult: r.预期结果 || '',
        processKeyPoints: r.过程关键点 || '',
        actualResult: r.实标结果 || '',
      }));
      setDataSource(rows);
      // 同时加载全年汇总
      await loadYearSummary();
    } catch (e: any) {
      message.error('加载失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 保存数据
  const saveData = async () => {
    if (hasMismatchedTimes()) return;
    setLoading(true);
    try {
      const payload = {
        神殿名称: selectedCampus,
        年份: selectedYear,
        月份: selectedMonth,
        行列表: dataSource.map((r, i) => ({
          序号: i + 1,
          时间: r.time,
          地点: r.location,
          活动形式: r.activityForm,
          主要内容: r.mainContent,
          负责人: r.responsible,
          预期结果: r.expectedResult,
          过程关键点: r.processKeyPoints,
          实标结果: r.actualResult,
        })),
      };
      const res = await fetch(buildApiUrl('/teaching-quality/campus-activity-plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      message.success('保存成功');
      setEditMode(false);
      await loadData();
    } catch (e: any) {
      message.error('保存失败: ' + (e?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampus) {
      if (showYearData) {
        loadYearSummary();
      } else {
        loadData();
      }
    }
  }, [selectedCampus, selectedYear, selectedMonth, showYearData]);

  // 同步顶部神殿选择器：当全局神殿变化时，更新本地选择
  useEffect(() => {
    if (currentCampus && currentCampus !== selectedCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [currentCampus])

  // 表格列配置
  const columns: ColumnsType<CampusActivityPlanRecord> = [
    { title: '序号', key: 'serialNumber', width: 80, align: 'center', render: (_, __, index) => index + 1 },
    { title: '时间', dataIndex: 'time', key: 'time', width: 150, align: 'center', render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'time') },
    { title: '地点', dataIndex: 'location', key: 'location', width: 120, align: 'center', render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'location') },
    { title: '活动形式', dataIndex: 'activityForm', key: 'activityForm', width: 150, align: 'center', render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'activityForm') },
    { title: '主要内容', dataIndex: 'mainContent', key: 'mainContent', width: 200, align: 'left', render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'mainContent', true) },
    { title: '负责人', dataIndex: 'responsible', key: 'responsible', width: 100, align: 'center', render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'responsible') },
    { title: '预期结果', dataIndex: 'expectedResult', key: 'expectedResult', width: 150, align: 'left', render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'expectedResult', true) },
    { title: '过程关键点', dataIndex: 'processKeyPoints', key: 'processKeyPoints', width: 200, align: 'left', render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'processKeyPoints', true) },
    { title: '实标结果', dataIndex: 'actualResult', key: 'actualResult', width: 150, align: 'left', render: (text, record) => showYearData ? <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div> : renderEditableCell(text, record, 'actualResult', true) },
    ...(showYearData ? [] : [{ title: '操作', key: 'action', width: 150, align: 'center' as const, fixed: 'right' as const, render: (_: any, record: CampusActivityPlanRecord) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.key)}>删除</Button>
        </Space>
      ), }]),
  ];

  const renderEditableCell = (text: string, record: CampusActivityPlanRecord, field: keyof CampusActivityPlanRecord, isTextArea: boolean = false) => {
    if (!editMode) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{text || '-'}</div>;
    }
    // 时间字段改为日历选择，保存为 YYYY-MM-DD 字符串
    if (field === 'time') {
      return (
        <DatePicker
          value={text ? dayjs(text) : null}
          disabledDate={disabledDate}
          onChange={(d) => {
            if (d && !isDateInSelectedMonth(d)) {
              message.warning('所选时间不在当前筛选年月，请切换月份后再录入。');
              return;
            }
            handleCellChange(record.key, field, d ? d.format('YYYY-MM-DD') : '');
          }}
          style={{ width: '100%' }}
          allowClear
        />
      );
    }
    if (isTextArea) {
      return <TextArea value={text} onChange={(e) => handleCellChange(record.key, field, e.target.value)} autoSize={{ minRows: 2, maxRows: 6 }} style={{ fontSize: '12px' }} />;
    }
    return <Input value={text} onChange={(e) => handleCellChange(record.key, field, e.target.value)} style={{ fontSize: '12px' }} />;
  };

  const handleCellChange = (key: string, field: keyof CampusActivityPlanRecord, value: string) => {
    const newData = dataSource.map((item) => (item.key === key ? { ...item, [field]: value } : item));
    setDataSource(newData);
  };

  const handleAdd = () => {
    const newRecord: CampusActivityPlanRecord = { key: `${Date.now()}`, time: '', location: '', activityForm: '', mainContent: '', responsible: '', expectedResult: '', processKeyPoints: '', actualResult: '' };
    setDataSource([...dataSource, newRecord]);
    message.success('已添加新行');
  };

  const handleEdit = (record: CampusActivityPlanRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      time: record.time ? dayjs(record.time) : null,
    });
    setModalVisible(true);
  };

  const handleDelete = (key: string) => {
    setDataSource(dataSource.filter((item) => item.key !== key));
    message.success('已删除');
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        const formatted = {
          ...values,
          time: values.time ? (values.time as any).format('YYYY-MM-DD') : '',
        } as any
        setDataSource(dataSource.map((item) => (item.key === editingRecord.key ? { ...item, ...formatted } : item)));
        message.success('更新成功');
      }
      setModalVisible(false);
      setEditingRecord(null);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理显示全年数据切换
  const handleToggleYearView = () => {
    if (!showYearData && yearSummaryData.length === 0) {
      // 如果还没有加载全年数据，先加载
      loadYearSummary();
    }
    setShowYearData(!showYearData);
  };

  return (
    <Card
      title={`${selectedCampus || 'XX神殿'}活动计划安排表${showYearData ? ` - ${selectedYear}年全年数据` : ''}`}
      extra={
        <Space>
          <Select style={{ width: 150 }} value={selectedCampus} onChange={(v) => { setSelectedCampus(v); setCampus(v) }} placeholder="选择神殿">
            {campuses.map((campus) => (<Option key={campus.id} value={campus.name}>{campus.name}</Option>))}
          </Select>
          <Select style={{ width: 120 }} value={selectedYear} onChange={setSelectedYear}>
            <Option value={2023}>2023年</Option>
            <Option value={2024}>2024年</Option>
            <Option value={2025}>2025年</Option>
            <Option value={2026}>2026年</Option>
          </Select>
          {!showYearData && (
            <Select style={{ width: 100 }} value={selectedMonth} onChange={setSelectedMonth}>
              {Array.from({ length: 12 }, (_, i) => (<Option key={i + 1} value={i + 1}>{i + 1}月</Option>))}
            </Select>
          )}
          <Button
            type={showYearData ? 'primary' : 'default'}
            icon={<CalendarOutlined />}
            onClick={handleToggleYearView}
            loading={loadingSummary}
            disabled={!selectedCampus}
          >
            {showYearData ? '返回月度视图' : '查看全年数据'}
          </Button>
          {!showYearData && (
            <>
              <Button type="dashed" icon={<PlusOutlined />} onClick={handleAdd}>添加</Button>
              <Button icon={<EditOutlined />} onClick={() => setEditMode(!editMode)}>{editMode ? '退出编辑' : '编辑'}</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={saveData} loading={loading}>保存</Button>
            </>
          )}
          <Button icon={<CloudDownloadOutlined />} onClick={() => showYearData ? loadYearSummary() : loadData()} loading={loading || loadingSummary}>加载</Button>
          <Button icon={<DownloadOutlined />} onClick={() => message.info('导出功能开发中...')}>导出</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={showYearData ? yearSummaryData : dataSource}
        loading={showYearData ? loadingSummary : loading}
        pagination={showYearData ? { defaultPageSize: 50, showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` } : false}
        bordered
        scroll={{ x: 1400 }}
        size="small"
        rowKey="key"
        summary={() => {
          if (!showYearData) {
            const totalCount = yearSummaryData.length;
            const activityFormCounts: Record<string, number> = {};
            yearSummaryData.forEach((row) => {
              if (row.activityForm) {
                activityFormCounts[row.activityForm] = (activityFormCounts[row.activityForm] || 0) + 1;
              }
            });
            const activityFormSummary = Object.entries(activityFormCounts)
              .map(([form, count]) => `${form}: ${count}次`)
              .join('; ');

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                  <Table.Summary.Cell index={0} colSpan={1}>
                    全年汇总
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} colSpan={1}>
                    共{totalCount}项活动
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={1}>
                    {activityFormSummary || '-'}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={7} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={8} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={9} colSpan={1}>
                    -
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }
          return null;
        }}
      />
      <style>{`.ant-table-cell { padding: 8px 4px !important; font-size: 12px; }`}</style>
      <Modal title="编辑活动计划" open={modalVisible} onOk={handleModalOk} onCancel={() => { setModalVisible(false); setEditingRecord(null); form.resetFields(); }} width={800}>
        <Form form={form} layout="vertical">
          <Form.Item name="time" label="时间" rules={[{ required: true, message: '请选择时间' }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={disabledDate} />
          </Form.Item>
          <Form.Item name="location" label="地点" rules={[{ required: true, message: '请输入地点' }]}><Input placeholder="例如：T003教室" /></Form.Item>
          <Form.Item name="activityForm" label="活动形式" rules={[{ required: true, message: '请输入活动形式' }]}><Input placeholder="例如：班会、讲座、团建活动等" /></Form.Item>
          <Form.Item name="mainContent" label="主要内容" rules={[{ required: true, message: '请输入主要内容' }]}><TextArea rows={3} placeholder="描述活动的主要内容" /></Form.Item>
          <Form.Item name="responsible" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}><Input placeholder="负责人姓名" /></Form.Item>
          <Form.Item name="expectedResult" label="预期结果"><TextArea rows={2} placeholder="描述预期达到的效果" /></Form.Item>
          <Form.Item name="processKeyPoints" label="过程关键点"><TextArea rows={3} placeholder="描述活动过程中的关键环节和注意事项" /></Form.Item>
          <Form.Item name="actualResult" label="实标结果"><TextArea rows={2} placeholder="活动结束后填写实际达成的结果" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CampusActivityPlanTable;
