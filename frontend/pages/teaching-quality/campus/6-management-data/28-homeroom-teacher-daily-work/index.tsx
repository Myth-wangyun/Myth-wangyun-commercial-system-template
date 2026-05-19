/**
 * 神殿教化司班主任日工单页面（已接入后端 API）
 *
 * 后端接口：
 * - GET  /api/v1/teaching-quality/homeroom-daily-work?campus=...&date=YYYY-MM-DD
 * - GET  /api/v1/teaching-quality/homeroom-daily-work/remark?campus=...&date=YYYY-MM-DD
 * - POST /api/v1/teaching-quality/homeroom-daily-work   （写入/覆盖保存某个组）
 */

import React, { useEffect, useMemo, useState } from 'react';
import { App,
  Card,
  Table,
  Button,
  Space,
  Input,
  DatePicker,
} from 'antd';

import HomeroomTeacherSelect from '@/components/HomeroomTeacherSelect';
import {
  ReloadOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SaveOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';

const { TextArea } = Input;

import { buildApiUrl } from '@/utils/apiBase';

// 班主任日工单记录接口（前端行结构）
interface DailyWorkRecord {
  key: string;
  date: string; // 日期
  dayOfWeek: string; // 星期
  executor: string; // 执行人
  serialNumber: number; // 序号
  taskName: string; // 任务名称
  taskDescription: string; // 任务描述
  taskGoal: string; // 任务目标
  executionTime: string; // 执行时间
  weight: string; // 权重
  result: string; // 结果
  groupId: string; // 用于合并单元格的分组ID（后端组ID或临时ID）
}

// 后端返回的结构
interface DetailOutput {
  明细ID: number;
  序号: number;
  任务名称?: string;
  任务描述?: string;
  任务目标?: string;
  执行时间?: string;
  权重?: string;
  结果?: string;
}
interface GroupOutput {
  组ID: number;
  神殿名称: string;
  日期: string; // YYYY-MM-DD
  执行人: string;
  星期?: string;
  备注?: string;
  明细列表: DetailOutput[];
}

// 获取星期的中文名称
const getChineseDayOfWeek = (dateStr: string): string => {
  if (!dateStr) return '';
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const d = dayjs(dateStr);
  return weekDays[d.day()];
};

const DEFAULT_REMARK_TEMPLATE =
  '1、出勤：XX班应到：  人，实到：  人，实到比例：  ，（几人线上几人线下，几人没电脑）（钉钉打卡几人，异常几人，异常情况）；\n' +
  '    XX班应到：  人，实到：  人，实到比例：  ……；\n' +
  '    XX班应到：  人，实到：  人，实到比例：  ……；\n' +
  '    XX班应到：  人，实到：  人，实到比例：  ……。\n' +
  '2、访谈：XX班，实际访谈几人，问题是什么。\n' +
  '3、口碑：朋友圈是否转发，效果：  。口碑量预计： 个，实际    个；质量如何      。月口碑目标：    人，截止日实际报名：  个。\n' +
  '4、新生情况：新生目前几人，几人未过课时（名单），几人欠费（名单/分别欠费多少）\n' +
  '5、催费：计划催费姓名，分别多少钱；实际催费姓名，分别多少钱。\n' +
  '6、就业：毕业班级，今日推荐人数预计    人，实际    人；班级目标平均薪资：    ，到目前为止平均就业薪资：     \n' +
  '7、班会：XX班，主题：     效果      。\n' +
  '8、素质训练：XX班      ，课题：    ，效果     。\n' +
  '9、其他';

const createEmptyRowsForNewGroup = (groupId: string, date: string): DailyWorkRecord[] => {
  // 自动计算星期
  const dayOfWeek = getChineseDayOfWeek(date);
  return Array.from({ length: 6 }).map((_, idx) => ({
    key: `${groupId}-${idx + 1}`,
    date,
    dayOfWeek,
    executor: '',
    serialNumber: idx + 1,
    taskName: '',
    taskDescription: '',
    taskGoal: '',
    executionTime: '',
    weight: '',
    result: '',
    groupId,
  }));
};

const CampusHomeroomTeacherDailyWorkPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const selectedCampus = currentCampus || '';
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  // 当前筛选的班主任（执行人）
  const [selectedExecutor, setSelectedExecutor] = useState<string>('');
  const [dataSource, setDataSource] = useState<DailyWorkRecord[]>([]);
  const [dailyRemark, setDailyRemark] = useState<string>(DEFAULT_REMARK_TEMPLATE);
  const [editingKey, setEditingKey] = useState<string>('');
  const [editingField, setEditingField] = useState<string>('');
  const formattedDate = useMemo(() => (selectedDate ? selectedDate.format('YYYY-MM-DD') : ''), [selectedDate]);

  // 将后端组数据扁平为表格数据
  const flattenGroups = (groups: GroupOutput[]): DailyWorkRecord[] => {
    const rows: DailyWorkRecord[] = [];
    groups.forEach(g => {
      const gid = String(g.组ID);
      const dateStr = g.日期;
      // 自动计算星期（如果后端没有提供，则根据日期计算）
      const dayOfWeekValue = g.星期 || getChineseDayOfWeek(dateStr);
      if (!g.明细列表 || g.明细列表.length === 0) {
        rows.push(...createEmptyRowsForNewGroup(gid, dateStr));
      } else {
        g.明细列表
          .sort((a, b) => a.序号 - b.序号)
          .forEach(d => {
            rows.push({
              key: `${gid}-${d.明细ID ?? d.序号}`,
              date: dateStr,
              dayOfWeek: dayOfWeekValue,
              executor: g.执行人,
              serialNumber: d.序号,
              taskName: d.任务名称 || '',
              taskDescription: d.任务描述 || '',
              taskGoal: d.任务目标 || '',
              executionTime: d.执行时间 || '',
              weight: d.权重 || '',
              result: d.结果 || '',
              groupId: gid,
            });
          });
      }
    });
    // 如果没有获取到任何记录，则为用户生成一组可编辑的空行，方便直接录入
    if (rows.length === 0) {
      const gid = `group-${Date.now()}`
      const baseRows = createEmptyRowsForNewGroup(gid, formattedDate || dayjs().format('YYYY-MM-DD'))
      // 如果已选择班主任，则把执行人列预填
      const presetExecutor = selectedExecutor || ''
      return baseRows.map((r) => ({ ...r, executor: presetExecutor }))
    }
    return rows;
  };

  // 计算日期列的rowSpan
  const getDateRowSpan = (record: DailyWorkRecord) => {
    const dataRows = [...dataSource];
    const currentIndex = dataRows.findIndex(item => item.key === record.key);
    if (currentIndex === -1) return 0;
    if (currentIndex > 0) {
      const prevRecord = dataRows[currentIndex - 1];
      if (prevRecord.groupId === record.groupId) {
        return 0;
      }
    }
    let sameGroupCount = 1;
    for (let i = currentIndex + 1; i < dataRows.length; i++) {
      if (dataRows[i].groupId === record.groupId) {
        sameGroupCount++;
      } else {
        break;
      }
    }
    return sameGroupCount;
  };

  const getDayOfWeekRowSpan = (record: DailyWorkRecord) => getDateRowSpan(record);
  const getExecutorRowSpan = (record: DailyWorkRecord) => getDateRowSpan(record);

  const loadRemark = async () => {
    if (!selectedCampus || !formattedDate) {
      return;
    }
    try {
      const url = `${buildApiUrl('/teaching-quality/homeroom-daily-work/remark')}?campus=${encodeURIComponent(selectedCampus)}&date=${encodeURIComponent(formattedDate)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const remarkValue = data?.备注;
      setDailyRemark(remarkValue == null ? DEFAULT_REMARK_TEMPLATE : remarkValue);
    } catch (e: any) {
      console.error(e);
      setDailyRemark(DEFAULT_REMARK_TEMPLATE);
      message.warning('备注加载失败，已使用默认模板');
    }
  };

  // 从后端加载
  const loadData = async () => {
    if (!selectedCampus || !formattedDate) {
      message.warning('请先选择神殿与日期');
      return;
    }
    try {
      // 前端筛选：即便后端暂不支持 executor 参数，这里也会在拿到数据后再过滤一次，避免“切换班主任还有旧数据”的问题
      const executorQuery = selectedExecutor ? `&executor=${encodeURIComponent(selectedExecutor)}` : '';
      const url = `${buildApiUrl('/teaching-quality/homeroom-daily-work')}?campus=${encodeURIComponent(selectedCampus)}&date=${encodeURIComponent(formattedDate)}${executorQuery}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      const groups: GroupOutput[] = await res.json();

      // 双保险：前端再按执行人过滤一次（后端可能未实现 executor 过滤参数）
      const filteredGroups = selectedExecutor
        ? groups.filter(g => (g.执行人 || '').trim() === selectedExecutor.trim())
        : groups;

      const rows = flattenGroups(filteredGroups);
      setDataSource(rows);
      await loadRemark();
      message.success('已从后端加载');
    } catch (e: any) {
      console.error(e);
      message.error('加载失败：' + (e?.message || '未知错误'));
    }
  };

  // 保存当前页面数据到后端
  const handleSave = async () => {
    if (!selectedCampus || !formattedDate) {
      message.warning('请先选择神殿与日期');
      return;
    }
    // 按 groupId 分组
    const groupsMap = new Map<string, DailyWorkRecord[]>();
    dataSource.forEach(r => {
      if (!groupsMap.has(r.groupId)) groupsMap.set(r.groupId, []);
      groupsMap.get(r.groupId)!.push(r);
    });

    try {
      // 逐组保存
      for (const [, rows] of groupsMap.entries()) {
        const first = rows[0];
        const payload = {
          神殿名称: selectedCampus,
          日期: first.date || formattedDate,
          执行人: first.executor || '未填写',
          星期: first.dayOfWeek || undefined,
          班主任: first.executor || '未填写',  // 添加班主任字段
          备注: dailyRemark,
          明细列表: rows
            .sort((a, b) => a.serialNumber - b.serialNumber)
            .map(r => ({
              序号: r.serialNumber,
              任务名称: r.taskName || undefined,
              任务描述: r.taskDescription || undefined,
              任务目标: r.taskGoal || undefined,
              执行时间: r.executionTime || undefined,
              权重: r.weight || undefined,
              结果: r.result || undefined,
            })),
        };
        const res = await fetch(buildApiUrl('/teaching-quality/homeroom-daily-work'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      message.success('保存成功');
      await loadData();
    } catch (e: any) {
      console.error(e);
      message.error('保存失败：' + (e?.message || '未知错误'));
    }
  };

  // 初次 & 选择变更时自动加载
  useEffect(() => {
    // 切换筛选条件时，立即清空现有数据，然后重新加载
    setDataSource([]);
    if (selectedCampus && formattedDate) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCampus, formattedDate, selectedExecutor]);

  // 添加新记录（在当前最后一个组后追加一个新组的空行）
  const handleAdd = () => {
    const gid = `group-${Date.now()}`;
    setDataSource(prev => [...prev, ...createEmptyRowsForNewGroup(gid, formattedDate)]);
    setEditingKey(`${gid}-1`);
    setEditingField('date');
  };

  // 在当前最后一个组中新增一条序号（行）
  const handleAddSerial = () => {
    setDataSource(prev => {
      if (!prev.length) {
        message.warning('请先新增组');
        return prev;
      }
      // 取最后一个组
      const lastGroupId = prev[prev.length - 1].groupId;
      const groupRows = prev.filter(r => r.groupId === lastGroupId);
      if (groupRows.length === 0) {
        message.warning('请先新增组');
        return prev;
      }
      const lastIndexInAll = (() => {
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].groupId === lastGroupId) return i;
        }
        return prev.length - 1;
      })();
      const maxSerial = groupRows.reduce((m, r) => Math.max(m, r.serialNumber), 0);
      const template = groupRows[0];
      const newRecord: DailyWorkRecord = {
        key: `${lastGroupId}-add-${Date.now()}`,
        date: template.date,
        dayOfWeek: template.dayOfWeek || getChineseDayOfWeek(template.date),
        executor: template.executor,
        serialNumber: maxSerial + 1,
        taskName: '',
        taskDescription: '',
        taskGoal: '',
        executionTime: '',
        weight: '',
        result: '',
        groupId: lastGroupId,
      };
      const next = [...prev];
      next.splice(lastIndexInAll + 1, 0, newRecord);
      // 设置编辑焦点
      setEditingKey(newRecord.key);
      setEditingField('taskName');
      return next;
    });
  };

  // 已使用顶部神殿选择器，页面内不再维护神殿状态

  // 表头样式（浅蓝色背景）
  const headerCellStyle: React.CSSProperties = {
    backgroundColor: '#e6f7ff',
    fontWeight: 'bold',
    textAlign: 'center',
  };

  // 定义表格列
  const columns: ColumnsType<DailyWorkRecord> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      align: 'center',
      render: (value, record) => {
        const rowSpan = getDateRowSpan(record);
        const isEditing = editingKey === record.key && editingField === 'date';
        if (isEditing) {
          return {
            children: (
              <Input
                value={value}
                onChange={(e) => {
                  const newDataSource = [...dataSource];
                  const idx = newDataSource.findIndex(item => item.key === record.key);
                  if (idx !== -1) {
                    const groupId = newDataSource[idx].groupId;
                    const newDate = e.target.value;
                    const newWeek = getChineseDayOfWeek(newDate);
                    newDataSource.forEach(item => {
                      if (item.groupId === groupId) {
                        item.date = newDate;
                        item.dayOfWeek = newWeek;
                      }
                    });
                    setDataSource(newDataSource);
                  }
                }}
                onBlur={() => { setEditingKey(''); setEditingField(''); }}
                onPressEnter={() => { setEditingKey(''); setEditingField(''); }}
                autoFocus
              />
            ),
            props: { rowSpan: rowSpan > 0 ? rowSpan : 0 },
          };
        }
        return {
          children: (
            <div onClick={() => { setEditingKey(record.key); setEditingField('date'); }}
                 style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}>
              {value || ''}
            </div>
          ),
          props: { rowSpan: rowSpan > 0 ? rowSpan : 0 },
        };
      },
    },
    {
      title: '星期',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      width: 100,
      align: 'center',
      render: (value, record) => {
        const rowSpan = getDayOfWeekRowSpan(record);
        const isEditing = editingKey === record.key && editingField === 'dayOfWeek';
        if (isEditing) {
          return {
            children: (
              <Input
                value={value}
                onChange={(e) => {
                  const newDataSource = [...dataSource];
                  const idx = newDataSource.findIndex(item => item.key === record.key);
                  if (idx !== -1) {
                    const groupId = newDataSource[idx].groupId;
                    newDataSource.forEach(item => {
                      if (item.groupId === groupId) item.dayOfWeek = e.target.value;
                    });
                    setDataSource(newDataSource);
                  }
                }}
                onBlur={() => { setEditingKey(''); setEditingField(''); }}
                onPressEnter={() => { setEditingKey(''); setEditingField(''); }}
                autoFocus
              />
            ),
            props: { rowSpan: rowSpan > 0 ? rowSpan : 0 },
          };
        }
        return {
          children: (
            <div onClick={() => { setEditingKey(record.key); setEditingField('dayOfWeek'); }}
                 style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}>
              {value || ''}
            </div>
          ),
          props: { rowSpan: rowSpan > 0 ? rowSpan : 0 },
        };
      },
    },
    {
      title: '执行人',
      dataIndex: 'executor',
      key: 'executor',
      width: 120,
      align: 'center',
      render: (value, record) => {
        const rowSpan = getExecutorRowSpan(record);
        const isEditing = editingKey === record.key && editingField === 'executor';
        if (isEditing) {
          return {
            children: (
              <HomeroomTeacherSelect
                campusName={selectedCampus}
                value={value}
                onChange={(newValue) => {
                  const newDataSource = [...dataSource];
                  const idx = newDataSource.findIndex(item => item.key === record.key);
                  if (idx !== -1) {
                    const groupId = newDataSource[idx].groupId;
                    newDataSource.forEach(item => {
                      if (item.groupId === groupId) item.executor = newValue || '';
                    });
                    setDataSource(newDataSource);
                  }
                  setEditingKey('');
                  setEditingField('');
                }}
                allowClear
                placeholder="请选择班主任"
                disabled={!selectedCampus}
              />
            ),
            props: { rowSpan: rowSpan > 0 ? rowSpan : 0 },
          };
        }
        return {
          children: (
            <div onClick={() => { setEditingKey(record.key); setEditingField('executor'); }}
                 style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}>
              {value || ''}
            </div>
          ),
          props: { rowSpan: rowSpan > 0 ? rowSpan : 0 },
        };
      },
    },
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      align: 'center',
      render: (value) => value,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'taskName';
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const idx = newDataSource.findIndex(item => item.key === record.key);
                if (idx !== -1) {
                  newDataSource[idx].taskName = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => { setEditingKey(''); setEditingField(''); }}
              onPressEnter={() => { setEditingKey(''); setEditingField(''); }}
              autoFocus
            />
          );
        }
        return (
          <div onClick={() => { setEditingKey(record.key); setEditingField('taskName'); }}
               style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}>
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '任务描述',
      dataIndex: 'taskDescription',
      key: 'taskDescription',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'taskDescription';
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const idx = newDataSource.findIndex(item => item.key === record.key);
                if (idx !== -1) {
                  newDataSource[idx].taskDescription = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => { setEditingKey(''); setEditingField(''); }}
              autoSize={{ minRows: 2, maxRows: 4 }}
              autoFocus
            />
          );
        }
        return (
          <div onClick={() => { setEditingKey(record.key); setEditingField('taskDescription'); }}
               style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}>
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '任务目标',
      dataIndex: 'taskGoal',
      key: 'taskGoal',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'taskGoal';
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const idx = newDataSource.findIndex(item => item.key === record.key);
                if (idx !== -1) {
                  newDataSource[idx].taskGoal = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => { setEditingKey(''); setEditingField(''); }}
              onPressEnter={() => { setEditingKey(''); setEditingField(''); }}
              autoFocus
            />
          );
        }
        return (
          <div onClick={() => { setEditingKey(record.key); setEditingField('taskGoal'); }}
               style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}>
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '执行时间',
      dataIndex: 'executionTime',
      key: 'executionTime',
      width: 150,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'executionTime';
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const idx = newDataSource.findIndex(item => item.key === record.key);
                if (idx !== -1) {
                  newDataSource[idx].executionTime = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => { setEditingKey(''); setEditingField(''); }}
              onPressEnter={() => { setEditingKey(''); setEditingField(''); }}
              autoFocus
            />
          );
        }
        return (
          <div onClick={() => { setEditingKey(record.key); setEditingField('executionTime'); }}
               style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}>
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'weight';
        if (isEditing) {
          return (
            <Input
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const idx = newDataSource.findIndex(item => item.key === record.key);
                if (idx !== -1) {
                  newDataSource[idx].weight = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => { setEditingKey(''); setEditingField(''); }}
              onPressEnter={() => { setEditingKey(''); setEditingField(''); }}
              autoFocus
            />
          );
        }
        return (
          <div onClick={() => { setEditingKey(record.key); setEditingField('weight'); }}
               style={{ cursor: 'pointer', minHeight: '32px', padding: '4px' }}>
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 200,
      align: 'center',
      render: (value, record) => {
        const isEditing = editingKey === record.key && editingField === 'result';
        if (isEditing) {
          return (
            <TextArea
              value={value}
              onChange={(e) => {
                const newDataSource = [...dataSource];
                const idx = newDataSource.findIndex(item => item.key === record.key);
                if (idx !== -1) {
                  newDataSource[idx].result = e.target.value;
                  setDataSource(newDataSource);
                }
              }}
              onBlur={() => { setEditingKey(''); setEditingField(''); }}
              autoSize={{ minRows: 2, maxRows: 4 }}
              autoFocus
            />
          );
        }
        return (
          <div onClick={() => { setEditingKey(record.key); setEditingField('result'); }}
               style={{ cursor: 'pointer', minHeight: '32px', padding: '4px', whiteSpace: 'pre-wrap' }}>
            {value || ''}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => { setEditingKey(record.key); setEditingField('date'); }}
          >编辑</Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              const newDataSource = dataSource.filter(item => item.key !== record.key);
              // 重新编号（仅对同组内）
              const groupId = record.groupId;
              const groupRows = newDataSource.filter(r => r.groupId === groupId).sort((a,b)=>a.serialNumber-b.serialNumber);
              groupRows.forEach((item, idx) => { item.serialNumber = idx + 1; });
              setDataSource([...newDataSource]);
              message.success('删除成功');
            }}
          >删除</Button>
        </Space>
      ),
    },
  ];

  // 刷新数据（从后端加载）
  const handleRefresh = () => { loadData(); };

  // 导出数据（占位）
  const handleExport = () => { message.info('导出功能开发中...'); };

  return (
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
        <FileTextOutlined style={{ marginRight: 8 }} />
        班主任日工单
      </div>

      <Card>
        {/* 操作栏 */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>日期：</span>
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              format="YYYY-MM-DD"
              style={{ width: 200 }}
              placeholder="请选择日期"
            />
            <span>班主任：</span>
            <HomeroomTeacherSelect
              campusName={selectedCampus}
              value={selectedExecutor}
              onChange={(v) => setSelectedExecutor(v || '')}
              placeholder="请选择班主任（筛选）"
              allowClear
              disabled={!selectedCampus}
            />
          </Space>
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增组</Button>
            <Button icon={<OrderedListOutlined />} onClick={handleAddSerial}>新增序号</Button>
            <Button icon={<SaveOutlined />} type="primary" ghost onClick={handleSave}>保存</Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>加载</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          scroll={{ x: 'max-content', y: 600 }}
          bordered
          size="small"
          rowKey="key"
          components={{
            header: {
              cell: (props: any) => {
                const mergedProps = {
                  ...props,
                  style: {
                    ...props.style,
                    ...headerCellStyle,
                  },
                };
                return <th {...mergedProps} />;
              },
            },
          }}
        />
        <style>{`
          .ant-table-thead > tr > th {
            background-color: #e6f7ff !important;
            font-weight: bold;
            text-align: center;
          }
          .ant-table-thead > tr:first-child > th {
            background-color: #e6f7ff !important;
          }
        `}</style>

        {/* 备注（按日期保存） */}
        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fafafa', border: '1px solid #d9d9d9', borderRadius: 4 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 8 }}>备注（按日期保存）：</div>
          <TextArea
            value={dailyRemark}
            onChange={(e) => setDailyRemark(e.target.value)}
            autoSize={{ minRows: 6, maxRows: 12 }}
          />
        </div>
      </Card>
    </div>
  );
};

export default CampusHomeroomTeacherDailyWorkPage;
