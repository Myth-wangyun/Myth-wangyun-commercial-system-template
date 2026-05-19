// 最高议事厅智慧司学术经理功能评价表
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Card, Table, Typography, Space, Button, InputNumber, Modal, Form, Input, DatePicker, Row, Col, Checkbox, Spin, Divider } from 'antd';
import { TeamOutlined, PlusOutlined, DownloadOutlined, ReloadOutlined, SaveOutlined, CheckOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import { fetchUsersByDepartment, type DepartmentUser, type DepartmentUserGroup } from '@/services/configMaster';
import { saveManagerFunctionEvaluation, type EvaluatorScores } from '@/services/staffFunctionAnalysis';
import './index.css';

const { Title, Text } = Typography;

type Category = '价值观' | '业务能力' | '团队建设' | '管理能力';

interface EvaluationRow {
  id: string;
  category: Category;
  order: number;
  item: string;
  requirement: string;
  full: number; // 满分 4
  scores: Record<string, number>; // 动态评分人列，key为评分人名称，value为分数
}

type TableRow = EvaluationRow & {
  rowType?: 'item' | 'categoryTotal' | 'grandTotal';
};

interface PersistData {
  month: string; // YYYY-MM
  evaluators: string[]; // 评分人列表
  rows: EvaluationRow[];
}

const CATEGORY_ORDER: Category[] = ['价值观', '业务能力', '团队建设', '管理能力'];

const buildDefaultRows = (): EvaluationRow[] => {
  const mk = (id: number, category: Category, item: string, requirement: string): EvaluationRow => ({
    id: String(id), category, order: id, item, requirement, full: 4,
    scores: {}, // 初始为空
  });

  return [
    // 价值观 5
    mk(1, '价值观', '责任心', '对待学生，对待工作有责任心。'),
    mk(2, '价值观', '执行力', '能认真执行上级领导的各项安排。'),
    mk(3, '价值观', '任劳任怨', '不辞辛苦，任劳任怨。'),
    mk(4, '价值观', '团队精神', '有大局观，个人利益服从集体利益。'),
    mk(5, '价值观', '职业道德', '做人准则，职业道德。'),
    // 业务能力 8
    mk(6, '业务能力', '技术能力', '个人技术水平'),
    mk(7, '业务能力', '创新能力', '有创造性思维'),
    mk(8, '业务能力', '教学研发', '网络调查、开发大纲、课件编写能力。'),
    mk(9, '业务能力', '教学实施', '授课、辅导。'),
    mk(10,'业务能力', '教学测评', '考试合格率、学员满意度。'),
    mk(11,'业务能力', '就业情况', '就业率和就业薪资高。'),
    mk(12,'业务能力', '口碑', '口碑招生和收入高。'),
    mk(13,'业务能力', '新生维稳', '新生流失较少。'),
    // 团队建设 6（从 14 开始）
    mk(14,'团队建设', '招聘能力', '能自己招聘所缺岗位。'),
    mk(15,'团队建设', '业务培养能力', '能培养员工的授课和课堂管理能力。'),
    mk(16,'团队建设', '价值观培养能力', '能培养员工的正确价值观。'),
    mk(17,'团队建设', '员工访谈能力', '能和各种类型的员工访谈。'),
    mk(18,'团队建设', '考核能力', '清楚工作重点，考核目标明确。'),
    mk(19,'团队建设', '评价能力', '能正确评价员工，优胜劣汰。'),
    // 管理能力 6（20-25）
    mk(20,'管理能力', '工作规划能力', '工作的时间和内容能够合理安排。'),
    mk(21,'管理能力', '威望及亲和力', '有威望和亲和力，员工愿意服从。'),
    mk(22,'管理能力', '示范能力', '能以身作则，起示范作用。'),
    mk(23,'管理能力', '领导能力', '能带领团队完成任务。'),
    mk(24,'管理能力', '工作方法', '对各种问题，能找到合适的工作方法。'),
    mk(25,'管理能力', '工作控制能力', '能监督员工按时完成任务。'),
  ];
};

const ManagerEvaluationPage: React.FC = () => {
  const { message } = App.useApp()
  const { currentCampus } = useCampusStore();
  const [month, setMonth] = useState<string>(dayjs().format('YYYY-MM'));
  const [evaluators, setEvaluators] = useState<string[]>([]); // 评分人列表，从后端获取
  const [rows, setRows] = useState<EvaluationRow[]>(buildDefaultRows());
  const [settingOpen, setSettingOpen] = useState(false);
  const [form] = Form.useForm();
  const [tempEvaluators, setTempEvaluators] = useState<string[]>([]);
  
  // 新增：智慧司人员列表状态（按神殿分组）
  const [userGroups, setUserGroups] = useState<DepartmentUserGroup[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // 神殿排序顺序（按照指定顺序）
  // 1.河北盛邦 2.河北冀美 3.河北石美 4.山西晋美 5.山西原美 6.山西太美 7.广西桂美 8.广西邕美 9.贵州黔美
  const campusOrder = useMemo(() => {
    const order = [
      '河北盛邦', '盛邦',
      '河北冀美', '冀美',
      '河北石美', '石美',
      '山西晋美', '晋美',
      '山西原美', '原美',
      '山西太美', '太美',
      '广西桂美', '桂美',
      '广西邕美', '邕美',
      '贵州黔美', '黔美',
    ]
    const orderMap = new Map<string, number>()
    // 每两个为一组（全称和简称），使用相同的排序值
    for (let i = 0; i < order.length; i += 2) {
      const sortValue = Math.floor(i / 2)
      orderMap.set(order[i], sortValue)
      orderMap.set(order[i + 1], sortValue)
      orderMap.set(order[i] + '神殿', sortValue)
      orderMap.set(order[i + 1] + '神殿', sortValue)
    }
    return orderMap
  }, [])

  // 构建用户名到神殿的映射
  const userCampusMap = useMemo(() => {
    const map = new Map<string, string>()
    userGroups.forEach(group => {
      group.users.forEach(user => {
        map.set(user.real_name, group.campus)
      })
    })
    return map
  }, [userGroups])

  // 根据神殿排序评分人
  const sortEvaluatorsByCampus = useCallback((names: string[]) => {
    return [...names].sort((a, b) => {
      const campusA = userCampusMap.get(a) || ''
      const campusB = userCampusMap.get(b) || ''
      const orderA = campusOrder.get(campusA) ?? campusOrder.get(campusA.replace('神殿', '')) ?? 999
      const orderB = campusOrder.get(campusB) ?? campusOrder.get(campusB.replace('神殿', '')) ?? 999
      if (orderA !== orderB) {
        return orderA - orderB
      }
      // 同一神殿内按名字排序
      return a.localeCompare(b, 'zh-CN')
    })
  }, [userCampusMap, campusOrder])

  const storageKey = (campus?: string | null, m?: string) => `managerFunction_${campus || '主神殿'}__${m || month}`;

  // 获取智慧司所有人员（按神殿分组）
  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      // 从 public.users 获取智慧司所有人员，按神殿分组
      const groups = await fetchUsersByDepartment('智慧司');
      setUserGroups(groups);
    } catch (error) {
      console.error('加载智慧司人员列表失败:', error);
      message.error('加载智慧司人员列表失败');
      setUserGroups([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // 计算总人数
  const totalUsersCount = useMemo(() => {
    return userGroups.reduce((sum, group) => sum + group.users.length, 0);
  }, [userGroups]);

  // 初始化时加载智慧司人员列表
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 加载
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(currentCampus, month));
      if (raw) {
        const parsed = JSON.parse(raw) as PersistData;
        setEvaluators(parsed.evaluators?.length ? parsed.evaluators : []);
        // 确保每个 row 都有 scores 字段
        const safeRows = (parsed.rows?.length ? parsed.rows : buildDefaultRows()).map(row => ({
          ...row,
          scores: row.scores || {}
        }));
        setRows(safeRows);
      } else {
        setEvaluators([]);
        setRows(buildDefaultRows());
      }
    } catch {
      setEvaluators([]);
      setRows(buildDefaultRows());
    }
  }, [currentCampus, month]);

  // 当评分人变化时，更新所有行的scores字段
  useEffect(() => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        const newScores: Record<string, number> = {};
        evaluators.forEach(evaluator => {
          // 添加安全检查：确保 row.scores 存在
          newScores[evaluator] = (row.scores && row.scores[evaluator]) || 0;
        });
        return { ...row, scores: newScores };
      });
      return updatedRows;
    });
  }, [evaluators.length]);

  // 保存到本地存储
  useEffect(() => {
    const data: PersistData = { month, evaluators, rows };
    try { localStorage.setItem(storageKey(currentCampus, month), JSON.stringify(data)); } catch {}
  }, [evaluators, rows, month, currentCampus]);

  const onScoreChange = (id: string, evaluator: string, value: number | null) => {
    setRows(prev => prev.map(r => 
      r.id === id ? { ...r, scores: { ...r.scores, [evaluator]: Number(value || 0) } } : r
    ));
  };

  const totals = useMemo(() => {
    // 分类合计
    const byCategory: Record<Category, Record<string, number>> = {
      价值观: { full: 0 },
      业务能力: { full: 0 },
      团队建设: { full: 0 },
      管理能力: { full: 0 },
    };

    CATEGORY_ORDER.forEach((cat) => {
      evaluators.forEach((e) => {
        if (byCategory[cat][e] == null) byCategory[cat][e] = 0;
      });
    });

    rows.forEach((row) => {
      const bucket = byCategory[row.category];
      bucket.full += row.full;
      evaluators.forEach((e) => {
        bucket[e] += row.scores[e] || 0;
      });
    });

    const grand: Record<string, number> = { full: 0 };
    evaluators.forEach((e) => { grand[e] = 0; });

    CATEGORY_ORDER.forEach((cat) => {
      const bucket = byCategory[cat];
      grand.full += bucket.full;
      evaluators.forEach((e) => {
        grand[e] += bucket[e];
      });
    });

    return { byCategory, grand };
  }, [rows, evaluators]);

  const tableData: TableRow[] = useMemo(() => {
    const data: TableRow[] = [];

    CATEGORY_ORDER.forEach((cat) => {
      const catRows = rows
        .filter((r) => r.category === cat)
        .sort((a, b) => a.order - b.order);

      data.push(...catRows.map((r) => ({ ...r, rowType: 'item' as const })));

      if (catRows.length > 0) {
        const catTotal = totals.byCategory[cat];
        const scores: Record<string, number> = {};
        evaluators.forEach((e) => {
          scores[e] = catTotal[e] || 0;
        });
        data.push({
          id: `${cat}-total`,
          category: cat,
          order: 0,
          item: `${cat}合计`,
          requirement: '',
          full: catTotal.full,
          scores,
          rowType: 'categoryTotal',
        });
      }
    });

    return data;
  }, [rows, evaluators, totals]);

  const categoryRowSpans = useMemo(() => {
    const map: Record<Category, number> = {
      价值观: 0,
      业务能力: 0,
      团队建设: 0,
      管理能力: 0,
    };
    tableData.forEach((row) => {
      map[row.category] += 1;
    });
    return map;
  }, [tableData]);

  const columns: ColumnsType<TableRow> = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 90,
      fixed: 'left',
      align: 'center',
      onCell: (record: TableRow, index?: number) => {
        if (index === undefined) return {};
        const category = record.category;
        // 如果上一行是同一类别，则本行不显示（rowSpan 为 0）
        if (index > 0 && tableData[index - 1].category === category) {
          return { rowSpan: 0 };
        }
        // 第一行显示类别，并纵向合并到该类别最后一行
        return {
          rowSpan: categoryRowSpans[category] || 1,
          style: { verticalAlign: 'middle' },
        };
      },
    },
    {
      title: '序号',
      dataIndex: 'order',
      key: 'order',
      width: 60,
      fixed: 'left',
      align: 'center',
      render: (value: number, record: TableRow) => (record.rowType === 'item' ? value : ''),
    },
    {
      title: '功能项目',
      dataIndex: 'item',
      key: 'item',
      width: 140,
      fixed: 'left',
      align: 'center',
    },
    { title: '详细要求', dataIndex: 'requirement', key: 'requirement', width: 280, fixed: 'left', align: 'center' },
    {
      title: '满分',
      dataIndex: 'full',
      key: 'full',
      width: 70,
      align: 'center',
      render: (value: number, record: TableRow) =>
        record.rowType === 'categoryTotal' ? (
          <Text type="danger" strong>
            {value}
          </Text>
        ) : (
          value
        ),
    },
    ...evaluators.map((evaluator, idx) => ({
      title: evaluator || `姓名${idx + 1}`,
      key: `score_${idx}`,
      width: 90,
      align: 'center' as const,
      render: (_: any, record: TableRow) =>
        record.rowType === 'categoryTotal' ? (
          <Text type="danger">{record.scores[evaluator] || 0}</Text>
        ) : (
          <InputNumber
            min={0}
            max={4}
            step={1}
            value={record.scores[evaluator] || 0}
            onChange={(v) => onScoreChange(record.id, evaluator, v)}
            style={{ width: '100%' }}
          />
        ),
    })),
  ];

  // 获取所有用户名列表用于初始化选中状态
  const allUserNames = useMemo(() => {
    return userGroups.flatMap(group => group.users.map(u => u.real_name));
  }, [userGroups]);

  const openSetting = () => {
    setTempEvaluators([...evaluators]);
    // 初始化选中的评分人
    const selectedNames = evaluators.filter(name => allUserNames.includes(name));
    form.setFieldsValue({
      selectedTeachers: selectedNames,
      month: dayjs(month)
    });
    setSettingOpen(true);
  };

  const handleSettingOk = async () => {
    const values = await form.validateFields();
    const selectedNames: string[] = values.selectedTeachers || [];
    
    if (selectedNames.length === 0) {
      message.error('至少需要选择一名评分人');
      return;
    }

    // 按照神殿排序评分人
    const sortedNames = sortEvaluatorsByCampus(selectedNames);
    setEvaluators(sortedNames);
    setMonth(values.month ? values.month.format('YYYY-MM') : month);
    setSettingOpen(false);
    message.success('设置已保存');
  };

  const handleSubmit = async () => {
    if (!currentCampus) {
      message.error('请先选择神殿');
      return;
    }
    if (evaluators.length === 0) {
      message.error('请先设置评分人');
      return;
    }

    try {
      // 计算每个评分人的分类合计
      const evaluatorScores: EvaluatorScores[] = evaluators.map(name => {
        const scores = {
          价值观: 0,
          业务能力: 0,
          团队建设: 0,
          管理能力: 0,
        };
        
        rows.forEach(row => {
          const score = row.scores[name] || 0;
          if (row.category === '价值观') scores.价值观 += score;
          else if (row.category === '业务能力') scores.业务能力 += score;
          else if (row.category === '团队建设') scores.团队建设 += score;
          else if (row.category === '管理能力') scores.管理能力 += score;
        });

        return {
          name,
          价值观: scores.价值观,
          业务能力: scores.业务能力,
          团队建设: scores.团队建设,
          管理能力: scores.管理能力,
          合计: scores.价值观 + scores.业务能力 + scores.团队建设 + scores.管理能力,
        };
      });

      // 提交到后端
      const year = parseInt(month.split('-')[0], 10);
      await saveManagerFunctionEvaluation({
        神殿: currentCampus,
        年份: year,
        月份: month,
        数据: {
          month,
          evaluators: evaluatorScores,
          details: {
            rows: rows.map(r => ({
              id: r.id,
              category: r.category,
              item: r.item,
              scores: r.scores,
            })),
          },
        },
      });

      message.success('提交成功');
      console.log('提交数据:', { month, evaluators: evaluatorScores, campus: currentCampus });
    } catch (error) {
      console.error('提交失败:', error);
      message.error('提交失败，请重试');
    }
  };

  const exportCsv = () => {
    const headers = ['类别', '序号', '功能项目', '详细要求', '满分', ...evaluators];

    const body: (string | number)[][] = [];

    CATEGORY_ORDER.forEach((cat) => {
      const catRows = rows
        .filter((r) => r.category === cat)
        .sort((a, b) => a.order - b.order);

      catRows.forEach((r) => {
        body.push([
          cat,
          r.order,
          r.item,
          r.requirement,
          r.full,
          ...evaluators.map((e) => r.scores[e] || 0),
        ]);
      });

      const catTotal = totals.byCategory[cat];
      body.push([
        `${cat}合计`,
        '',
        '',
        '',
        catTotal.full,
        ...evaluators.map((e) => catTotal[e] || 0),
      ]);
    });

    const grand = totals.grand;
    const summary = ['合计', '', '', '', grand.full, ...evaluators.map((e) => grand[e] || 0)];

    const csv = [headers, ...body, summary]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `学术经理功能评价表_${month}.csv`;
    a.click();
  };

  return (
    <div style={{ padding: 24 }}>
      <div className="mb-4">
        <Title level={2}><TeamOutlined className="me-2" />最高议事厅智慧司学术经理功能评价表</Title>
        <Text type="secondary">按条目和评分人维度填写分数，满分4分，共25项，总分100分</Text>
      </div>

      {/* 神殿与月份设置 */}
      <div className="mb-3" style={{ display:'flex', gap:16, alignItems:'center', flexWrap:'wrap' }}>
        <CampusSelector useGlobalState />
        {usersLoading && <Spin size="small" />}
        {!usersLoading && (
          <Text type="secondary">
            可选评分人: {totalUsersCount}人
          </Text>
        )}
        <Space>
          <span>评价月份</span>
          <DatePicker picker="month" value={dayjs(month)} onChange={(d)=> setMonth(d ? d.format('YYYY-MM') : month)} />
        </Space>
        <Space>
          <Button icon={<PlusOutlined />} onClick={openSetting}>设置评分人</Button>
          <Button icon={<ReloadOutlined />} onClick={()=> { setRows(buildDefaultRows()); setEvaluators([]); }}>重置分数</Button>
          <Button icon={<SaveOutlined />} onClick={() => message.success('保存成功')}>保存</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={handleSubmit}>提交</Button>
          <Button icon={<DownloadOutlined />} onClick={exportCsv}>导出CSV</Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={tableData}
          rowKey="id"
          pagination={false}
          bordered
          scroll={{ x: Math.max(1200, 700 + evaluators.length * 100), y: 600 }}
          sticky
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4} align="center">
                <Text strong>合计</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="center">
                <Text strong>{totals.grand.full}</Text>
              </Table.Summary.Cell>
              {evaluators.map((evaluator, idx) => (
                <Table.Summary.Cell key={`total_${idx}`} index={5 + idx} align="center">
                  <Text>{totals.grand[evaluator] || 0}</Text>
                </Table.Summary.Cell>
              ))}
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* 设置评分人 */}
      <Modal 
        title="设置评分人与月份" 
        open={settingOpen} 
        onOk={handleSettingOk} 
        onCancel={()=> setSettingOpen(false)} 
        width={800}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="month" label="评价月份" rules={[{ required: true, message: '请选择月份' }]}>
                <DatePicker picker="month" style={{ width:'100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="当前神殿">
                <Input value={currentCampus || '未选择神殿'} disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item 
            name="selectedTeachers" 
            label={`选择评分人（共${totalUsersCount}位教员可选，包含所有神殿）`}
            rules={[{ required: true, message: '请选择至少一名评分人' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              {usersLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Spin tip="加载中..." />
                </div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {userGroups.map((group, groupIndex) => (
                    <div key={group.campus} style={{ marginBottom: 16 }}>
                      <Divider orientation="left" style={{ margin: '8px 0' }}>
                        <Text strong>{group.campus}</Text>
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                          ({group.users.length}人)
                        </Text>
                      </Divider>
                      <Row gutter={[12, 8]}>
                        {group.users.map(user => (
                          <Col span={8} key={user.user_id}>
                            <Checkbox value={user.real_name}>
                              <span style={{ fontWeight: 500 }}>{user.real_name}</span>
                              {user.position && (
                                <Text type="secondary" style={{ marginLeft: 4, fontSize: 12 }}>
                                  - {user.position}
                                </Text>
                              )}
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ))}
                </div>
              )}
            </Checkbox.Group>
          </Form.Item>
          {!usersLoading && userGroups.length === 0 && (
            <Text type="warning">
              没有找到智慧司人员数据，请确认 public.users 表中有智慧司的员工数据
            </Text>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerEvaluationPage;