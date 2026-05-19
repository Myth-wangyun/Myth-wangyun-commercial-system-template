// 学术 -> 教员 -> 听课打分表（本地可编辑 + 本地持久化 + 后端保存）
import React, { useEffect, useMemo, useState } from 'react';
import { App, Card, Typography, Row, Col, Input, Space, Button, Divider, Table, DatePicker, Radio, Tabs, Select, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import YearlyLectureScoresSummary from './7-teacher-yearly-lecture-scores-summary';
import { teacherYearlyLectureScoreService } from '@/services/service';
import { fetchTeachers, type TeacherProfile } from '@/services/configMaster';
import { useCampusStore } from '@/stores/campusStore';

const { Title, Text } = Typography;

// 顶部信息
type Meta = {
  date: string; // YYYY-MM-DD
  className: string;
  courseContent: string;
  teacherName: string;
};

// 明细行
type RowItem = {
  key: string;
  category: string; // 评分类别
  content: string; // 评分标准
  score?: 1 | 2 | 3 | 4 | 5; // 选择 1~5 分
};

type AcademicScoreRow = {
  key: string;
  category: string;
  standard: string;
  scores: Array<number | undefined>; // 12 个月
};

const STORAGE_KEY = 'teacher-lecture-scoring-sheet:v1';

// 题目定义
const DEF: Array<{ category: string; items: string[] }> = [
  {
    category: '教学内容',
    items: [
      '1.是否按照最新16.0课程体系的授课',
      '2.教学内容是否与16.0课件一致',
      '3.是否按照5个阶段授课、13个环节授课的流程授课',
    ],
  },
  {
    category: '教学方法',
    items: [
      '4.知识点讲解是否使用3W1H教学方法授课',
      '5.案例讲解是否使用项目教学法授课',
      '6.教师的授课是否生动幽默',
    ],
  },
  {
    category: '关注学生',
    items: [
      '7.教员与学员互动、提问、交流较多。',
      '8.能表扬和鼓励学员，激发学员兴趣。',
      '9.教员能关注到每一名学员。',
      '10.教员能有效地解答学员的问题，且没有不耐烦的情绪。',
      '11.能抽出较多时间辅导学员。',
    ],
  },
  {
    category: '课堂管理',
    items: [
      '12.教员本人无迟到、早退、请假、课上接打手机等问题。',
      '13.学员迟到、早退、请假、旷课等出勤问题均进行及时妥善处理。',
      '14.学员未完成作业、抄作业等作业问题均进行及时妥善处理。',
      '15.学员看视频、玩游戏、打瞌睡、说话、接打手机等课堂问题均进行及时妥善处理。',
      '16.教员能对各类突发事件，进行及时妥善的处理。',
    ],
  },
  {
    category: '传授观念',
    items: [
      '17.教员能传授考勤、纪律的重要性。',
      '18.教员能传授积极的学习心态。',
    ],
  },
  {
    category: '语言表达',
    items: [
      '19.授课语言清晰、简练、易懂。',
      '20.声音洪亮，语速合理，声音抑扬顿挫。',
    ],
  },
];

const buildRows = (): RowItem[] => {
  const list: RowItem[] = [];
  DEF.forEach((group) => {
    group.items.forEach((txt, idx) => {
      list.push({ key: `${group.category}-${idx}`, category: group.category, content: txt });
    });
  });
  return list;
};

const buildAcademicTemplate = (): AcademicScoreRow[] => {
  // 仅在 2 月填充示例数据，其余月份留空，方便手动录入
  const febScores = [4.8, 4.7, 4.8, 4.7, 4.8, 4.6, 4.7, 4.7, 4.8, 4.8, 4.8, 4.7, 4.7, 4.9, 4.7, 4.8, 4.9, 4.8, 4.8, 4.8];
  const standards = [
    { category: '教学内容', standard: '1.是否按照最新16.0课程体系的授课' },
    { category: '教学内容', standard: '2.教学内容是否与16.0课件一致' },
    { category: '教学内容', standard: '3.是否按照5个阶段授课、13个环节授课的流程授课' },
    { category: '教学方法', standard: '4.知识点讲解是否使用3W1H教学方法授课' },
    { category: '教学方法', standard: '5.案例讲解是否使用项目教学法授课' },
    { category: '教学方法', standard: '6.教师的授课是否生动幽默' },
    { category: '关注学生', standard: '7.教员与学员互动、提问、交流较多。' },
    { category: '关注学生', standard: '8.能表扬和鼓励学员，激发学员兴趣。' },
    { category: '关注学生', standard: '9.教员能关注到每一名学员。' },
    { category: '关注学生', standard: '10.教员能有效地解答学员的问题，且没有不耐烦的情绪。' },
    { category: '关注学生', standard: '11.能抽出较多时间辅导学员。' },
    { category: '课堂管理', standard: '12.教员本人无迟到、早退、请假、课上接打手机等问题。' },
    { category: '课堂管理', standard: '13.学员迟到、早退、请假、旷课等出勤问题均进行及时妥善处理。' },
    { category: '课堂管理', standard: '14.学员未完成作业、抄作业等作业问题均进行及时妥善处理。' },
    { category: '课堂管理', standard: '15.学员看视频、玩游戏、打瞌睡、说话、接打手机等课堂问题均进行及时妥善处理。' },
    { category: '课堂管理', standard: '16.教员能对各类突发事件，进行及时妥善的处理。' },
    { category: '传授观念', standard: '17.教员能传授考勤、纪律的重要性。' },
    { category: '传授观念', standard: '18.教员能传授积极的学习心态。' },
    { category: '语言表达', standard: '19.授课语言清晰、简练、易懂。' },
    { category: '语言表达', standard: '20.声音洪亮，语速合理，声音抑扬顿挫。' },
  ];

  return standards.map((item, idx) => {
    const scores = Array(12).fill(undefined);
    scores[1] = febScores[idx]; // 2 月示例分
    return { key: `academic-${idx + 1}`, ...item, scores };
  });
};

const SatisfactionScoringSheet: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [meta, setMeta] = useState<Meta>(() => ({
    date: dayjs().format('YYYY-MM-DD'),
    className: '',
    courseContent: '',
    teacherName: '',
  }));
  const [rows, setRows] = useState<RowItem[]>(() => buildRows());
  const [suggestions, setSuggestions] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedAcademicTeacher, setSelectedAcademicTeacher] = useState<string>('');
  const [academicRows, setAcademicRows] = useState<AcademicScoreRow[]>(() => buildAcademicTemplate());

  // 为类别列做 rowSpan 计算
  const categorySpanMap = useMemo(() => {
    const map = new Map<string, { firstIndex: number; count: number }>();
    rows.forEach((r, idx) => {
      const m = map.get(r.category);
      if (!m) map.set(r.category, { firstIndex: idx, count: 1 });
      else m.count += 1;
    });
    return map;
  }, [rows]);

  // 智慧司听课成绩表行合并
  const academicCategorySpanMap = useMemo(() => {
    const map = new Map<string, { firstIndex: number; count: number }>();
    academicRows.forEach((r, idx) => {
      const m = map.get(r.category);
      if (!m) map.set(r.category, { firstIndex: idx, count: 1 });
      else m.count += 1;
    });
    return map;
  }, [academicRows]);

  // 加载教员列表
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        setLoadingTeachers(true);
        // 获取当前神殿的教员列表（后端过滤），无结果时回退到去后缀/全部
        const stripCampus = (s?: string) => (s ? s.replace(/神殿$/, '') : '');
        const campusName = currentCampus || '';
        const campusCode = stripCampus(campusName);

        let teacherList =
          (await fetchTeachers({ campus_name: campusName, active: true })) || [];

        if ((!teacherList || teacherList.length === 0) && campusCode) {
          teacherList = (await fetchTeachers({ campus_name: campusCode, active: true })) || [];
        }

        if (!teacherList || teacherList.length === 0) {
          teacherList = (await fetchTeachers({ active: true })) || [];
        }

        setTeachers(teacherList || []);
        
        if (!teacherList || teacherList.length === 0) {
          message.warning('未找到任何活跃教员，请检查配置中心是否有教员数据');
        }
      } catch (error) {
        console.error('加载教员列表失败:', error);
        message.error('加载教员列表失败，请检查网络连接或联系管理员');
        setTeachers([]);
      } finally {
        setLoadingTeachers(false);
      }
    };
    loadTeachers();
  }, [currentCampus]);

  // 选中默认教员（用于智慧司听课成绩表）
  useEffect(() => {
    if (!selectedAcademicTeacher && teachers.length > 0) {
      setSelectedAcademicTeacher(teachers[0].name);
    }
  }, [teachers, selectedAcademicTeacher]);

  const updateAcademicScore = (rowKey: string, monthIndex: number, value?: number | null) => {
    setAcademicRows((prev) =>
      prev.map((row) =>
        row.key === rowKey
          ? {
              ...row,
              scores: row.scores.map((v, idx) => (idx === monthIndex ? (value ?? undefined) : v)),
            }
          : row,
      ),
    );
  };

  const academicTableData = useMemo(() => {
    const calcAvg = (scores: Array<number | undefined>) => {
      const valid = scores.filter((v): v is number => typeof v === 'number');
      if (!valid.length) return undefined;
      const sum = valid.reduce((a, b) => a + b, 0);
      return Math.round((sum / valid.length) * 10) / 10;
    };

    const rowsWithAvg = academicRows.map((row) => {
      const avg = calcAvg(row.scores);
      const monthValues: Record<string, number | undefined> = {};
      row.scores.forEach((v, idx) => {
        monthValues[`m${idx + 1}`] = v;
      });
      return { ...row, ...monthValues, avg };
    });

    const totals = Array(12).fill(0);
    rowsWithAvg.forEach((row) => {
      for (let i = 0; i < 12; i++) {
        const val = (row as any)[`m${i + 1}`];
        totals[i] += val || 0;
      }
    });

    const totalAvg = rowsWithAvg.reduce((sum, row) => sum + ((row as any).avg || 0), 0);
    const totalRow: any = { key: 'total', category: '总分', standard: '', rowType: 'total', avg: totalAvg };
    totals.forEach((val, idx) => {
      totalRow[`m${idx + 1}`] = val ? Math.round(val * 10) / 10 : 0;
    });

    return [...rowsWithAvg, totalRow];
  }, [academicRows]);

  // 从后端加载数据
  const loadDataFromBackend = async () => {
    try {
      setLoading(true);
      // 获取最近的数据（按日期降序，取最新的）
      const data = await teacherYearlyLectureScoreService.getList({
        teacherName: undefined, // 不筛选教员，获取所有
        className: undefined, // 不筛选班级
        startDate: undefined,
        endDate: undefined,
      });

      console.log('从后端加载的数据:', data);

      if (data && data.length > 0) {
        // 使用最新的记录（按 id 降序排列，取第一个）
        const latestRecord = data[0];
        
        console.log('使用最新记录:', latestRecord);
        
        // 恢复 meta 数据
        setMeta({
          date: latestRecord.date || dayjs().format('YYYY-MM-DD'),
          className: latestRecord.className || '',
          courseContent: latestRecord.courseContent || '',
          teacherName: latestRecord.teacherName || '',
        });

        // 恢复 scores 数据
        if (latestRecord.scores && Array.isArray(latestRecord.scores) && latestRecord.scores.length > 0) {
          console.log('恢复评分数据:', latestRecord.scores);
          // 将后端数据转换为前端格式
          const baseRows = buildRows();
          const restoredRows = baseRows.map((row) => {
            const savedScore = latestRecord.scores.find((s: any) => s.key === row.key);
            if (savedScore && savedScore.score !== undefined && savedScore.score !== null) {
              return {
                ...row,
                score: savedScore.score as 1 | 2 | 3 | 4 | 5,
              };
            }
            return row;
          });
          setRows(restoredRows);
        } else {
          // 如果没有评分数据，使用默认的空行
          setRows(buildRows());
        }

        // 恢复意见建议
        if (latestRecord.suggestions) {
          setSuggestions(latestRecord.suggestions);
        } else {
          setSuggestions('');
        }
        
        message.success('已加载最新数据');
      } else {
        // 如果没有后端数据，尝试加载本地数据
        console.log('后端无数据，加载本地数据');
        loadLocalData();
      }
    } catch (error) {
      console.error('加载后端数据失败:', error);
      message.warning('加载后端数据失败，尝试加载本地数据');
      // 如果加载失败，尝试加载本地数据
      loadLocalData();
    } finally {
      setLoading(false);
    }
  };

  // 加载本地存储的数据
  const loadLocalData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj.meta)
          setMeta((m) => ({
            date: obj.meta.date ?? m.date,
            className: obj.meta.className ?? '',
            courseContent: obj.meta.courseContent ?? '',
            teacherName: obj.meta.teacherName ?? '',
          }));
        if (Array.isArray(obj.rows)) setRows(obj.rows);
        if (typeof obj.suggestions === 'string') setSuggestions(obj.suggestions);
      }
    } catch {}
  };

  // 页面初始化时加载数据（优先从后端加载）
  useEffect(() => {
    loadDataFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus]);

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta, rows, suggestions }));
      message.success('已保存到本地');
    } catch {
      message.error('本地保存失败');
    }
  };

  // 保存到后端
  const saveToBackend = async () => {
    // 验证必填字段
    if (!meta.className || !meta.className.trim()) {
      message.warning('请填写班级名称');
      return;
    }
    if (!meta.courseContent || !meta.courseContent.trim()) {
      message.warning('请填写授课内容');
      return;
    }
    if (!meta.teacherName || !meta.teacherName.trim()) {
      message.warning('请填写授课教员');
      return;
    }

    try {
      setLoading(true);
      const totalScore = rows.reduce((s, r) => s + (r.score ?? 0), 0);
      
      const payload = {
        date: meta.date,
        className: meta.className.trim(),
        courseContent: meta.courseContent.trim(),
        teacherName: meta.teacherName.trim(),
        totalScore,
        suggestions: suggestions.trim() || null,
        scores: rows.map(row => ({
          key: row.key,
          category: row.category,
          content: row.content,
          score: row.score,
        })),
      };

      await teacherYearlyLectureScoreService.create(payload);
      message.success('已保存到后端');
    } catch (error: any) {
      console.error('保存失败:', error);
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          error?.message || 
                          '保存失败，请检查网络连接或联系管理员';
      message.error(`保存失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setMeta({ date: dayjs().format('YYYY-MM-DD'), className: '', courseContent: '', teacherName: '' });
    setRows(buildRows());
    setSuggestions('');
  };

  const setScore = (rowIdx: number, val: 1 | 2 | 3 | 4 | 5) => {
    setRows((prev) => prev.map((r, i) => (i === rowIdx ? { ...r, score: val } : r)));
  };

  const columns: ColumnsType<RowItem> = [
    {
      title: '评分类别',
      dataIndex: 'category',
      width: 120,
      render: (v, _r, idx) => {
        const info = categorySpanMap.get(v as string);
        const rowSpan = info ? (info.firstIndex === idx ? info.count : 0) : 1;
        return { children: <Text>{v}</Text>, props: { rowSpan } as any };
      },
      fixed: 'left',
    },
    { title: '评分标准', dataIndex: 'content', width: 520, fixed: 'left' },
    ...([5, 4, 3, 2, 1] as const).map((scoreVal) => ({
      title: `${scoreVal}分`,
      key: `s${scoreVal}`,
      width: 80,
      align: 'center' as const,
      render: (_: any, _r: RowItem, rowIdx: number) => (
        <Radio checked={rows[rowIdx].score === scoreVal} onChange={() => setScore(rowIdx, scoreVal)} />
      ),
    })),
  ];

  const academicMonthCols = Array.from({ length: 12 }).map((_, idx) => {
    const month = idx + 1;
    const dataIndex = `m${month}`;
    return {
      title: `${month}月`,
      dataIndex,
      key: dataIndex,
      align: 'center' as const,
      width: 80,
      render: (v: number | undefined, record: any) => {
        if (record.rowType === 'total') {
          return v ?? 0;
        }
        return (
          <InputNumber
            min={0}
            max={5}
            step={0.1}
            value={v}
            onChange={(val) => updateAcademicScore(record.key, idx, val ?? undefined)}
            style={{ width: '100%' }}
          />
        );
      },
    };
  });

  const academicColumns: ColumnsType<any> = [
    {
      title: '评分类别',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      fixed: 'left',
      onCell: (_record, rowIndex) => {
        const info = academicCategorySpanMap.get((_record as any).category);
        if (!_record || (_record as any).rowType === 'total' || !info || rowIndex === undefined) return {};
        if (info.firstIndex === rowIndex) return { rowSpan: info.count };
        return { rowSpan: 0 };
      },
      render: (v: string) => v,
    },
    {
      title: '评分标准',
      dataIndex: 'standard',
      key: 'standard',
      width: 360,
      render: (v: string, record: any) => (record.rowType === 'total' ? '' : v),
    },
    ...academicMonthCols,
    {
      title: '平均分',
      dataIndex: 'avg',
      key: 'avg',
      align: 'center',
      width: 90,
      render: (v: number | undefined, record: any) => {
        if (record.rowType === 'total') return (v ?? 0).toFixed(1);
        return v !== undefined ? v.toFixed(1) : '';
      },
    },
  ];

  const totalScore = useMemo(() => rows.reduce((s, r) => s + (r.score ?? 0), 0), [rows]);

  const detailNode = (
    <Card bordered={false} style={{ background: '#f5f7fa' }}>
      <Title level={4} style={{ marginBottom: 12, textAlign: 'center' }}>
        听课打分表
      </Title>

      {/* 顶部信息 */}
      <Row gutter={[12, 8]} justify="space-between" style={{ marginBottom: 8 }}>
        <Col span={6}>
          <Space>
            <Text strong>日期</Text>
            <DatePicker value={dayjs(meta.date)} onChange={(d) => d && setMeta((m) => ({ ...m, date: d.format('YYYY-MM-DD') }))} />
          </Space>
        </Col>
        <Col span={6}>
          <Space>
            <Text strong>班级</Text>
            <Input value={meta.className} onChange={(e) => setMeta((m) => ({ ...m, className: e.target.value }))} />
          </Space>
        </Col>
        <Col span={6}>
          <Space>
            <Text strong>授课内容</Text>
            <Input value={meta.courseContent} onChange={(e) => setMeta((m) => ({ ...m, courseContent: e.target.value }))} />
          </Space>
        </Col>
        <Col span={6}>
          <Space>
            <Text strong>授课教员</Text>
            <Select
              value={meta.teacherName || undefined}
              onChange={(value) => setMeta((m) => ({ ...m, teacherName: value }))}
              placeholder={loadingTeachers ? "加载中..." : "请选择授课教员"}
              style={{ width: 150 }}
              loading={loadingTeachers}
              showSearch
              allowClear
              notFoundContent={loadingTeachers ? "加载中..." : teachers.length === 0 ? "暂无教员数据" : "未找到匹配项"}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={teachers.map((t) => ({
                label: t.name,
                value: t.name,
              }))}
            />
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      <Table<RowItem>
        bordered
        size="small"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />

      <div style={{ marginTop: 10 }}>
        <Text strong>总分：</Text>
        <Text>{totalScore}</Text>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div>
        <Text strong>对教员的意见和建议</Text>
        <Input.TextArea
          value={suggestions}
          onChange={(e) => setSuggestions(e.target.value)}
          rows={4}
          placeholder="请输入意见与建议"
          style={{ marginTop: 6 }}
        />
      </div>

      <Space style={{ marginTop: 12 }}>
        <Button type="primary" onClick={persist}>
          保存（本地）
        </Button>
        <Button type="primary" onClick={saveToBackend} loading={loading}>
          保存到后端
        </Button>
        <Button onClick={() => loadDataFromBackend()} loading={loading}>
          刷新数据
        </Button>
        <Button onClick={clearAll}>清空</Button>
      </Space>
    </Card>
  );

  const academicNode = (
    <Card bordered={false} style={{ background: '#f5f7fa' }}>
      <Title level={4} style={{ marginBottom: 12, textAlign: 'center' }}>
        智慧司听课成绩表
      </Title>

      <Space style={{ marginBottom: 12 }} wrap>
        <Text strong>当前神殿：</Text>
        <Text>{currentCampus || '未选择'}</Text>
        <Text strong>教员：</Text>
        <Select
          value={selectedAcademicTeacher || undefined}
          onChange={(val) => setSelectedAcademicTeacher(val)}
          placeholder={loadingTeachers ? '加载中...' : '请选择教员'}
          style={{ width: 200 }}
          loading={loadingTeachers}
          allowClear
          showSearch
          options={teachers.map((t) => ({ label: t.name, value: t.name }))}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
      </Space>

      <Table
        bordered
        size="small"
        columns={academicColumns}
        dataSource={academicTableData}
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Tabs
        items={[
          { key: 'detail', label: '个人详细', children: detailNode },
          { key: 'summary', label: '汇总', children: <YearlyLectureScoresSummary /> },
          { key: 'academic', label: '智慧司听课成绩表', children: academicNode },
        ]}
      />
    </div>
  );
};

export default SatisfactionScoringSheet;
