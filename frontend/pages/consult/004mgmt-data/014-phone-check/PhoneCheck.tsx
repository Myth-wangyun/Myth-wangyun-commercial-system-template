/**
 * 电话标准化检查表页面（咨询师标准化录音分析表）
 * 根据标准格式设计：步骤固定，子结构与次子结构预填充但允许编辑
 * 表格格式：步骤 | 完成情况 | 子结构 | 完成情况 | 次子结构 | 完成情况 | 纠正情况 | 备注
 */

import React, { useState, useEffect } from 'react';
import {
  App,
  Card,
  Button,
  Table,
  Form,
  Input,
  Modal,
  DatePicker,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  Radio,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  PrinterOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getPhoneCheckList,
  createPhoneCheck,
  updatePhoneCheck,
  deletePhoneCheck,
  getDefaultPhoneTemplate,
  type PhoneCheck,
} from '@/services/consult/phoneCheck';
import { useCampusStore } from '@/stores/campusStore';
import { NoCopyContainer } from '@/components/common';

const { TextArea } = Input;

// 完成情况类型：完成(√)、未完成(×)、不需要(○)
type CompletionStatus = '√' | '×' | '○' | null;

// 次子结构定义
interface SubSubItem {
  名称: string;
  完成情况: CompletionStatus;
}

// 子结构定义
interface SubItem {
  名称: string;
  完成情况: CompletionStatus;
  次子结构: SubSubItem[];
}

// 步骤定义
interface StepItem {
  步骤: string;
  完成情况: CompletionStatus;
  子结构: SubItem[];
  纠正情况: string;
  备注: string;
}

// 默认模板 - 咨询师标准化录音分析表
const getDefaultCheckTemplate = (): StepItem[] => [
  {
    步骤: '第一步：寒暄暖场',
    完成情况: null,
    子结构: [
      { 名称: '保持微笑、礼貌称呼、不连续发问适当赞美和表扬、老师姿态、先予后取', 完成情况: null, 次子结构: [{ 名称: '开场五句话', 完成情况: null }] },
    ],
    纠正情况: '',
    备注: '',
  },
  {
    步骤: '第二步：抓需求',
    完成情况: null,
    子结构: [
      { 名称: '确定咨询者的基本情况', 完成情况: null, 次子结构: [{ 名称: '称呼/年龄/性别；学习学历/工作/家庭/空白期', 完成情况: null }] },
      { 名称: '抓个性需求', 完成情况: null, 次子结构: [{ 名称: '什么年龄阶段该做什么事，为什么没有去做？对现状不满意的点，现在为什么考虑学习？考虑利用多长时间？学习什么专业的内容？', 完成情况: null }] },
      { 名称: '抓共性需求', 完成情况: null, 次子结构: [{ 名称: '上学的目的是什么？你即将选择什么路径达到你的目的？', 完成情况: null }] },
    ],
    纠正情况: '',
    备注: '',
  },
  {
    步骤: '第三步：强化需求',
    完成情况: null,
    子结构: [
      { 名称: '肯定对方想学习的想法', 完成情况: null, 次子结构: [{ 名称: '赏识有上进心，坚定学习的想法。', 完成情况: null }] },
      { 名称: '分析归因', 完成情况: null, 次子结构: [{ 名称: 'AI是国家发展的方向，也是市场趋势，就像你原来学的工程造价，20年前是国家和市场的趋势，现在不是了，所以现在有很多跟你一样的大学生回炉深造。现在只有继续跟着国家趋势的专业方向走，跟着市场的趋势走，才能找到符合咱们大学生的身份的高薪工作。另外中国现在进入工业4.0时代，需要的是应用技术型人才，科技人才第一生产力，你学技术是最正确的选择了。（底层逻辑：一肯定 二现在趋势 三过去趋势 四要跟着现在的趋势才能延续光环）', 完成情况: null }] },
      { 名称: '堵退路', 完成情况: null, 次子结构: [{ 名称: '所以现在趁着年轻提升自己是非常有必要的，否则随便去找个工作，这一两年维持一些温饱问题可以，咱是男孩子呢年龄再大点还整个四五千做基础工作就不好养家了，另外即便你想做一辈子底层工作，未来三五年也会被人工智能替代的。', 完成情况: null }] },
      { 名称: '鼓励持续学习', 完成情况: null, 次子结构: [{ 名称: '所以你想跟上这个时代继续有社会地位，只有不断提升自己的能力才是最好的出路。', 完成情况: null }] },
    ],
    纠正情况: '',
    备注: '',
  },
  {
    步骤: '第四步：针对性介绍优势',
    完成情况: null,
    子结构: [
      { 名称: '请对方提问题', 完成情况: null, 次子结构: [{ 名称: '你有什么想了解的吗？可以问问老师。', 完成情况: null }] },
      { 名称: '简单回答对方的一两个问题，引导到我们的核心优势上', 完成情况: null, 次子结构: [{ 名称: `我都离开学校三四年了，还能学会吗？
我：你有这个担心我能理解，但是也不用太担心的。本身我们是零基础教学，跟你之前的文化课基础没有任何关系，所以只要你跟着老师好好学肯定是没有问题的。而且清美采用的是项目教学法，跟大学里面纯讲理论是不一样的。而且我们是把企业的项目案例带到课堂上的，在清美学完不仅能学会，而且相当于积攒了一年多的工作经验，去公司直接上手而且是可以高薪工作的。硬实力：三省八校，软实力：借势造势清华美院韩红泉，北京电影学院刘谦；
咨：你们还给安排工作吗？
我：当然了，清美就是专门做就业的，我们已经积攒了一千两三百家合作企业。首先我们入学签订就业协议，毕业之后根据咱们学生的意愿推荐城市就业，像大学生学设计毕业出来之后起薪基本在8千往上，你像我们这个月刚毕业的董李帅大专学习的汽修，工作了一段时间之后过来清美学习设计专业的，一毕业8000底薪+4000提成还是双休再加五险，还是非常不错的。所以你完全不用担心。`, 完成情况: null }] },
      { 名称: '利用清美优势解决个性需求', 完成情况: null, 次子结构: [{ 名称: `咨：哦，那学多长时间，学费多少呀？
我：学习时间和费用是根据你选择的课程和班型决定的，课程和班型不一样学习时间和费用也不太一样的。你是计划学多长时间呀？
咨：时间越快越好吧，毕竟这个年龄了还得赶紧挣钱。
我：能理解的，学习时间从一两个月到五六个月不等的。
咨：专业我也不了解。
我：我们这边的课程是每年更新的，确保你学到的技术都是人工智能时代最有价值的设计技术。A我们的AI后期技术课程，无论二维还是三维还是后期，都加持了AI的技术，我们也讲授了AI设计的软件。B这些软件是设计领域里的顶尖技术；包括文生图，文生视频，图生图，图生视频，大幅度提高设计的效率，同时提高设计的质量，保证了你出品的水平。C这些技术是现在企业招聘所必须的最新的技术；学好了之后在就业市场上是非常有核心竞争优势的。我们这有mdjourney，stable diffusion，runway等，我明天上午可以给你尽量安排一节试听课。你看好不好？
（人工智能课程的行业优势介绍）
人工智能课程是未来二三十年AI时代必须要掌握的核心技能，是最有"钱"途的行业
1、随着人工智能时代的推进，大模型技术会成为AI时代基础性技术，类似pc时代的windows
2、AI可以赋能千行百业，你是学xxxx的，通过AI的赋能，可以找到更多的工作机会。
3、AI时代未来的发展趋势，是在各行各业的应用的开发。你先学会AI就取代了不会应用的人。`, 完成情况: null }] },
      { 名称: '利用清美优势解决共性需求', 完成情况: null, 次子结构: [{ 名称: '所以技术是前瞻性的，起薪基本是七八千起步，办公室环境和圈层，符合你身份地位。。。。。。', 完成情况: null }] },
    ],
    纠正情况: '',
    备注: '',
  },
  {
    步骤: '第五步：给出上门理由',
    完成情况: null,
    子结构: [
      { 名称: '第一个理由', 完成情况: null, 次子结构: [{ 名称: `第一次上门（班型优势+紧迫性）
咨：哦，那就行，我考虑一下吧。
我：你是考虑哪方面呢？既然想学习了，任何行业都是早学习早受益的，我们下周一正好有专门针对设计方向的岗前培训班开课，金九银十，现在学习，基本上九十月份就毕业了，正好赶上招聘旺季，也是最好的就业时机，你明天过来详细了解一下吧，合适的话咱们就学习了。`, 完成情况: null }] },
      { 名称: '第二个理由', 完成情况: null, 次子结构: [{ 名称: `第二次上门（规划方向）
咨：我也是刚有这个想法，你先加我微信发点学校的简介我先看看吧，要是去的话我再联系你。
我：好的，我一会申请加一下你的微信给你发点资料，不过我们看资料也是了解一个大概，现在是你择业的关键时期，到底哪个方向适合你不是看资料就能决定的，你明天过来吧，我给你做个详细的规划，看你适合走哪个方向，合适的话咱们就赶紧学了，不合适的话咱们赶紧看别的方向，毕竟时间不等人。`, 完成情况: null }] },
      { 名称: '第三个理由', 完成情况: null, 次子结构: [{ 名称: `咨：行吧，我跟家里也说一下，要是没什么事情的话就过去看看。
我：既然想提升呢也是为了有个更好的发展，我相信你家里肯定也是支持你的，而且你现在已经25岁了，家里肯定也主要是看你呢。你不是也担心能不能学会吗，明天我给你安排一节明天上午十点半的免费试听课吧，你可以听听，要是可以咱们就学习了。`, 完成情况: null }] },
    ],
    纠正情况: '',
    备注: '',
  },
  {
    步骤: '第六步：卡定上门时间或者再次回访时间',
    完成情况: null,
    子结构: [
      { 名称: '卡定两天内截止', 完成情况: null, 次子结构: [{ 名称: `咨：那行吧，你一会给我发个位置吧，我明天坐高铁过去看看。
我：行，你微信是这个号码吗？好加了，通过一下。我给你发一下学校的介绍和位置，你买好票以后跟我说一下。
咨：好的。
我：报名在后天也就截止了，咱们别错过了，如果合适咱们就学了，不合适的话咱们赶紧看别的出路。
咨：可以
我：我跟你家长也沟通一下吧，看看家长的意见
咨：不用的，我自己可以做主的
我：好的，那咱们明天见。
咨：明天见。`, 完成情况: null }] },
      { 名称: '确定上门时间，陪同者交通工具', 完成情况: null, 次子结构: [] },
      { 名称: '双主体电话，家长+孩子', 完成情况: null, 次子结构: [] },
      { 名称: '确定再次沟通时间', 完成情况: null, 次子结构: [] },
      { 名称: '礼貌挂断', 完成情况: null, 次子结构: [] },
    ],
    纠正情况: '',
    备注: '',
  },
];

// 完成情况选择器组件
const StatusSelector: React.FC<{
  value: CompletionStatus;
  onChange: (value: CompletionStatus) => void;
  size?: 'small' | 'middle';
}> = ({ value, onChange, size = 'small' }) => (
  <Radio.Group 
    value={value} 
    onChange={(e) => onChange(e.target.value)}
    size={size}
    buttonStyle="solid"
  >
    <Radio.Button value="√" style={{ color: value === '√' ? '#fff' : '#52c41a', backgroundColor: value === '√' ? '#52c41a' : undefined }}>√</Radio.Button>
    <Radio.Button value="×" style={{ color: value === '×' ? '#fff' : '#ff4d4f', backgroundColor: value === '×' ? '#ff4d4f' : undefined }}>×</Radio.Button>
    <Radio.Button value="○" style={{ color: value === '○' ? '#fff' : '#faad14', backgroundColor: value === '○' ? '#faad14' : undefined }}>○</Radio.Button>
  </Radio.Group>
);

// 状态标签组件
const StatusTag: React.FC<{ status: CompletionStatus }> = ({ status }) => {
  if (status === '√') return <Tag color="success" icon={<CheckCircleOutlined />}>√</Tag>;
  if (status === '×') return <Tag color="error" icon={<CloseCircleOutlined />}>×</Tag>;
  if (status === '○') return <Tag color="warning" icon={<MinusCircleOutlined />}>○</Tag>;
  return <Tag>-</Tag>;
};

const PhoneCheckPage: React.FC = () => {
  const { message, notification } = App.useApp();
  const [form] = Form.useForm();
  const { currentCampus } = useCampusStore();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingCheck, setEditingCheck] = useState<PhoneCheck | null>(null);
  const [viewingCheck, setViewingCheck] = useState<PhoneCheck | null>(null);
  const [checks, setChecks] = useState<PhoneCheck[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [checkContent, setCheckContent] = useState<StepItem[]>([]);
  const [filters, setFilters] = useState({
    consultant: undefined as string | undefined,
    campus: undefined as string | undefined,
    start_date: undefined as string | undefined,
    end_date: undefined as string | undefined,
  });

  const normalizeResponse = (response: any) => response?.data ?? response;

  // 绑定全局神殿选择器状态
  useEffect(() => {
    if (currentCampus) {
      setFilters((prev) => ({ ...prev, campus: currentCampus }));
      if (!editingCheck) {
        form.setFieldsValue({ 神殿: currentCampus });
      }
    }
  }, [currentCampus, editingCheck, form]);

  // 导出 CSV 功能
  const exportToCSV = () => {
    if (checks.length === 0) {
      message.warning('没有数据可导出');
      return;
    }

    const headers = ['日期', '神殿', '咨询师', '审核人', '学员姓名', '联系方式', '创建时间'];
    const rows = checks.map(check => [
      check.日期 ? dayjs(check.日期).format('YYYY-MM-DD') : '',
      check.神殿 || '',
      check.咨询师 || '',
      check.审核人 || '',
      check.学员姓名 || '',
      check.联系方式 || '',
      check.创建时间 ? dayjs(check.创建时间).format('YYYY-MM-DD HH:mm') : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `咨询师标准化录音分析表_${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
  };

  // 加载检查表列表
  const loadChecks = async () => {
    setLoading(true);
    try {
      const response = await getPhoneCheckList({
        ...filters,
        page,
        page_size: pageSize,
      });
      const payload = normalizeResponse(response);
      if (payload?.code === 0) {
        setChecks(payload.data?.数据列表 || []);
        setTotal(payload.data?.总记录数 || 0);
      }
    } catch (error) {
      message.error('加载列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecks();
  }, [page, pageSize, filters]);

  // 加载默认模板或使用内置模板
  const loadDefaultTemplate = async (): Promise<StepItem[]> => {
    try {
      const response = await getDefaultPhoneTemplate();
      const payload = normalizeResponse(response);
      if (payload?.code === 0 && payload.data?.模板内容?.length > 0) {
        return payload.data.模板内容;
      }
    } catch (error) {
      console.log('未找到默认模板，使用内置模板');
    }
    return getDefaultCheckTemplate();
  };

  // 打开新建/编辑模态框
  const handleOpenModal = async (check?: PhoneCheck) => {
    if (check) {
      setEditingCheck(check);
      form.setFieldsValue({
        ...check,
        日期: check.日期 ? dayjs(check.日期) : undefined,
      });
      setCheckContent(check.检查内容 || getDefaultCheckTemplate());
    } else {
      setEditingCheck(null);
      form.resetFields();
      form.setFieldsValue({
        日期: dayjs(),
        神殿: currentCampus || undefined,
      });
      const template = await loadDefaultTemplate();
      setCheckContent(template);
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingCheck(null);
    form.resetFields();
    setCheckContent([]);
  };

  // 查看详情
  const handleView = (check: PhoneCheck) => {
    setViewingCheck(check);
    setViewModalVisible(true);
  };

  // 保存检查表
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        ...values,
        日期: values.日期.format('YYYY-MM-DD HH:mm:ss'),
        检查内容: checkContent,
      };

      if (editingCheck) {
        await updatePhoneCheck(editingCheck.记录ID!, data);
        notification.success({ message: '已保存', description: '记录更新成功', placement: 'topRight', duration: 3 });
      } else {
        await createPhoneCheck(data);
        notification.success({ message: '已创建', description: '记录创建成功', placement: 'topRight', duration: 3 });
      }

      handleCloseModal();
      loadChecks();
    } catch (error) {
      notification.error({ message: '保存失败', description: '请检查网络连接或联系管理员', placement: 'topRight', duration: 4 });
    }
  };

  // 删除检查表
  const handleDelete = async (recordId: number) => {
    try {
      await deletePhoneCheck(recordId);
      message.success('删除成功');
      loadChecks();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 更新步骤完成情况
  const handleStepStatusChange = (stepIndex: number, status: CompletionStatus) => {
    const newContent = [...checkContent];
    newContent[stepIndex].完成情况 = status;
    setCheckContent(newContent);
  };

  // 更新子结构完成情况
  const handleSubStatusChange = (stepIndex: number, subIndex: number, status: CompletionStatus) => {
    const newContent = [...checkContent];
    newContent[stepIndex].子结构[subIndex].完成情况 = status;
    setCheckContent(newContent);
  };

  // 更新次子结构完成情况
  const handleSubSubStatusChange = (stepIndex: number, subIndex: number, subSubIndex: number, status: CompletionStatus) => {
    const newContent = [...checkContent];
    newContent[stepIndex].子结构[subIndex].次子结构[subSubIndex].完成情况 = status;
    setCheckContent(newContent);
  };

  // 更新步骤纠正情况
  const handleCorrectionChange = (stepIndex: number, value: string) => {
    const newContent = [...checkContent];
    newContent[stepIndex].纠正情况 = value;
    setCheckContent(newContent);
  };

  // 更新步骤备注
  const handleRemarkChange = (stepIndex: number, value: string) => {
    const newContent = [...checkContent];
    newContent[stepIndex].备注 = value;
    setCheckContent(newContent);
  };

  // 更新子结构名称（允许用户编辑）
  const handleSubNameChange = (stepIndex: number, subIndex: number, value: string) => {
    const newContent = [...checkContent];
    newContent[stepIndex].子结构[subIndex].名称 = value;
    setCheckContent(newContent);
  };

  // 更新次子结构名称（允许用户编辑）
  const handleSubSubNameChange = (stepIndex: number, subIndex: number, subSubIndex: number, value: string) => {
    const newContent = [...checkContent];
    newContent[stepIndex].子结构[subIndex].次子结构[subSubIndex].名称 = value;
    setCheckContent(newContent);
  };

  // 添加次子结构
  const handleAddSubSub = (stepIndex: number, subIndex: number) => {
    const newContent = [...checkContent];
    newContent[stepIndex].子结构[subIndex].次子结构.push({
      名称: '',
      完成情况: null,
    });
    setCheckContent(newContent);
  };

  // 删除次子结构
  const handleDeleteSubSub = (stepIndex: number, subIndex: number, subSubIndex: number) => {
    const newContent = [...checkContent];
    newContent[stepIndex].子结构[subIndex].次子结构.splice(subSubIndex, 1);
    setCheckContent(newContent);
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: '日期',
      key: '日期',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      key: '神殿',
      width: 100,
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      key: '咨询师',
      width: 100,
    },
    {
      title: '审核人',
      dataIndex: '审核人',
      key: '审核人',
      width: 100,
    },
    {
      title: '学员姓名',
      dataIndex: '学员姓名',
      key: '学员姓名',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: '创建时间',
      key: '创建时间',
      width: 150,
      render: (time: string) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: PhoneCheck) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该记录吗？"
            onConfirm={() => handleDelete(record.记录ID!)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 渲染检查内容编辑表格
  const renderCheckContentTable = () => {
    const tableData: any[] = [];
    
    checkContent.forEach((step, stepIndex) => {
      // 计算该步骤的行数
      let totalRows = 0;
      step.子结构.forEach((sub: SubItem) => {
        totalRows += Math.max(sub.次子结构.length, 1);
      });
      if (totalRows === 0) totalRows = 1;

      // 检查是否是第六步（次子结构需要跨行显示）
      const isStep6 = step.步骤.includes('第六步');
      // 第六步：找到有次子结构的第一个子结构
      const step6FirstSubWithSubSub = isStep6 ? step.子结构.findIndex((sub: SubItem) => sub.次子结构.length > 0) : -1;

      let rowIndex = 0;
      step.子结构.forEach((sub: SubItem, subIndex: number) => {
        const subRowCount = Math.max(sub.次子结构.length, 1);
        
        if (sub.次子结构.length === 0) {
          // 第六步特殊处理：后面的子结构次子结构列设为0（由第一个子结构跨行）
          const subSubRowSpan = isStep6 && subIndex > step6FirstSubWithSubSub ? 0 : 1;
          tableData.push({
            key: `${stepIndex}-${subIndex}-0`,
            stepIndex,
            subIndex,
            subSubIndex: -1,
            isFirstStepRow: rowIndex === 0,
            isFirstSubRow: true,
            stepRowSpan: rowIndex === 0 ? totalRows : 0,
            subRowSpan: 1,
            subSubRowSpan,
            isStep6NoAdd: isStep6 && subIndex > step6FirstSubWithSubSub, // 标记不显示添加按钮
            step,
            sub,
            subSub: null,
          });
          rowIndex++;
        } else {
          sub.次子结构.forEach((subSub: SubSubItem, subSubIndex: number) => {
            // 第六步：第一个有次子结构的子结构，跨所有行
            const subSubRowSpan = isStep6 && subIndex === step6FirstSubWithSubSub && subSubIndex === 0 
              ? totalRows 
              : (isStep6 ? 0 : (subSubIndex === 0 ? subRowCount : 0));
            tableData.push({
              key: `${stepIndex}-${subIndex}-${subSubIndex}`,
              stepIndex,
              subIndex,
              subSubIndex,
              isFirstStepRow: rowIndex === 0,
              isFirstSubRow: subSubIndex === 0,
              stepRowSpan: rowIndex === 0 ? totalRows : 0,
              subRowSpan: subSubIndex === 0 ? subRowCount : 0,
              subSubRowSpan,
              isStep6NoAdd: false,
              step,
              sub,
              subSub,
            });
            rowIndex++;
          });
        }
      });

      // 如果没有子结构，添加一个空行
      if (step.子结构.length === 0) {
        tableData.push({
          key: `${stepIndex}-empty`,
          stepIndex,
          subIndex: -1,
          subSubIndex: -1,
          isFirstStepRow: true,
          isFirstSubRow: true,
          stepRowSpan: 1,
          subRowSpan: 1,
          subSubRowSpan: 1,
          isStep6NoAdd: false,
          step,
          sub: null,
          subSub: null,
        });
      }
    });

    const tableColumns = [
      {
        title: '步骤',
        dataIndex: 'step',
        key: 'step',
        width: 180,
        onCell: (record: any) => ({
          rowSpan: record.stepRowSpan,
        }),
        render: (_: any, record: any) => (
          <div style={{ fontWeight: 'bold' }}>{record.step.步骤}</div>
        ),
      },
      {
        title: '完成情况',
        key: 'stepStatus',
        width: 130,
        onCell: (record: any) => ({
          rowSpan: record.stepRowSpan,
        }),
        render: (_: any, record: any) => (
          <StatusSelector
            value={record.step.完成情况}
            onChange={(status) => handleStepStatusChange(record.stepIndex, status)}
          />
        ),
      },
      {
        title: '子结构',
        key: 'sub',
        width: 200,
        onCell: (record: any) => ({
          rowSpan: record.subRowSpan,
        }),
        render: (_: any, record: any) =>
          record.sub ? (
            <TextArea
              value={record.sub.名称}
              onChange={(e) => handleSubNameChange(record.stepIndex, record.subIndex, e.target.value)}
              autoSize={{ minRows: 1, maxRows: 4 }}
              placeholder="子结构内容"
              style={{ fontSize: 12 }}
            />
          ) : (
            '-'
          ),
      },
      {
        title: '完成情况',
        key: 'subStatus',
        width: 130,
        onCell: (record: any) => ({
          rowSpan: record.subRowSpan,
        }),
        render: (_: any, record: any) => record.sub ? (
          <StatusSelector
            value={record.sub.完成情况}
            onChange={(status) => handleSubStatusChange(record.stepIndex, record.subIndex, status)}
          />
        ) : null,
      },
      {
        title: '次子结构',
        key: 'subSub',
        width: 300,
        onCell: (record: any) => ({
          rowSpan: record.subSubRowSpan !== undefined ? record.subSubRowSpan : 1,
        }),
        render: (_: any, record: any) => {
          // 如果rowSpan为0，不渲染内容
          if (record.subSubRowSpan === 0) return null;
          if (!record.sub) return '-';
          // 第六步的后几个子结构不显示添加按钮
          if (record.isStep6NoAdd) {
            return null;
          }
          if (record.subSubIndex === -1) {
            return (
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleAddSubSub(record.stepIndex, record.subIndex)}
              >
                添加
              </Button>
            );
          }
          return (
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextArea
                value={record.subSub?.名称}
                onChange={(e) => handleSubSubNameChange(record.stepIndex, record.subIndex, record.subSubIndex, e.target.value)}
                autoSize={{ minRows: 2, maxRows: 12 }}
                placeholder="次子结构内容"
                style={{ fontSize: 12 }}
              />
              <Space>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddSubSub(record.stepIndex, record.subIndex)}
                >
                  添加
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteSubSub(record.stepIndex, record.subIndex, record.subSubIndex)}
                >
                  删除
                </Button>
              </Space>
            </Space>
          );
        },
      },
      {
        title: '完成情况',
        key: 'subSubStatus',
        width: 130,
        onCell: (record: any) => ({
          rowSpan: record.subSubRowSpan !== undefined ? record.subSubRowSpan : 1,
        }),
        render: (_: any, record: any) => {
          if (record.subSubRowSpan === 0) return null;
          return record.subSub ? (
            <StatusSelector
              value={record.subSub.完成情况}
              onChange={(status) => handleSubSubStatusChange(record.stepIndex, record.subIndex, record.subSubIndex, status)}
            />
          ) : null;
        },
      },
      {
        title: '纠正情况',
        key: 'correction',
        width: 200,
        onCell: (record: any) => ({
          rowSpan: record.stepRowSpan,
        }),
        render: (_: any, record: any) => (
          <TextArea
            value={record.step.纠正情况}
            onChange={(e) => handleCorrectionChange(record.stepIndex, e.target.value)}
            autoSize={{ minRows: 1, maxRows: 3 }}
            placeholder="纠正情况"
          />
        ),
      },
      {
        title: '备注',
        key: 'remark',
        width: 150,
        onCell: (record: any) => ({
          rowSpan: record.stepRowSpan,
        }),
        render: (_: any, record: any) => (
          <TextArea
            value={record.step.备注}
            onChange={(e) => handleRemarkChange(record.stepIndex, e.target.value)}
            autoSize={{ minRows: 1, maxRows: 3 }}
            placeholder="备注"
          />
        ),
      },
    ];

    return (
      <Table
        columns={tableColumns}
        dataSource={tableData}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1400 }}
      />
    );
  };

  // 渲染查看详情表格
  const renderViewTable = () => {
    if (!viewingCheck?.检查内容) return null;

    const content = viewingCheck.检查内容 as StepItem[];
    const tableData: any[] = [];

    content.forEach((step, stepIndex) => {
      let totalRows = 0;
      step.子结构?.forEach((sub) => {
        totalRows += Math.max(sub.次子结构?.length || 0, 1);
      });
      if (totalRows === 0) totalRows = 1;

      // 检查是否是第六步（次子结构需要跨行显示）
      const isStep6 = step.步骤?.includes('第六步');
      const step6FirstSubWithSubSub = isStep6 ? (step.子结构?.findIndex((sub) => sub.次子结构 && sub.次子结构.length > 0) ?? -1) : -1;

      let rowIndex = 0;
      step.子结构?.forEach((sub, subIndex) => {
        const subRowCount = Math.max(sub.次子结构?.length || 0, 1);
        
        if (!sub.次子结构 || sub.次子结构.length === 0) {
          const subSubRowSpan = isStep6 && subIndex > step6FirstSubWithSubSub ? 0 : 1;
          tableData.push({
            key: `${stepIndex}-${subIndex}-0`,
            isFirstStepRow: rowIndex === 0,
            isFirstSubRow: true,
            stepRowSpan: rowIndex === 0 ? totalRows : 0,
            subRowSpan: 1,
            subSubRowSpan,
            step,
            sub,
            subSub: null,
          });
          rowIndex++;
        } else {
          sub.次子结构.forEach((subSub, subSubIndex) => {
            const subSubRowSpan = isStep6 && subIndex === step6FirstSubWithSubSub && subSubIndex === 0 
              ? totalRows 
              : (isStep6 ? 0 : (subSubIndex === 0 ? subRowCount : 0));
            tableData.push({
              key: `${stepIndex}-${subIndex}-${subSubIndex}`,
              isFirstStepRow: rowIndex === 0,
              isFirstSubRow: subSubIndex === 0,
              stepRowSpan: rowIndex === 0 ? totalRows : 0,
              subRowSpan: subSubIndex === 0 ? subRowCount : 0,
              subSubRowSpan,
              step,
              sub,
              subSub,
            });
            rowIndex++;
          });
        }
      });

      if (!step.子结构 || step.子结构.length === 0) {
        tableData.push({
          key: `${stepIndex}-empty`,
          isFirstStepRow: true,
          isFirstSubRow: true,
          stepRowSpan: 1,
          subRowSpan: 1,
          subSubRowSpan: 1,
          step,
          sub: null,
          subSub: null,
        });
      }
    });

    const viewColumns = [
      {
        title: '步骤',
        key: 'step',
        width: 180,
        onCell: (record: any) => ({ rowSpan: record.stepRowSpan }),
        render: (_: any, record: any) => <strong>{record.step.步骤}</strong>,
      },
      {
        title: '完成情况',
        key: 'stepStatus',
        width: 80,
        onCell: (record: any) => ({ rowSpan: record.stepRowSpan }),
        render: (_: any, record: any) => <StatusTag status={record.step.完成情况} />,
      },
      {
        title: '子结构',
        key: 'sub',
        width: 180,
        onCell: (record: any) => ({ rowSpan: record.subRowSpan }),
        render: (_: any, record: any) => record.sub?.名称 || '-',
      },
      {
        title: '完成情况',
        key: 'subStatus',
        width: 80,
        onCell: (record: any) => ({ rowSpan: record.subRowSpan }),
        render: (_: any, record: any) => record.sub ? <StatusTag status={record.sub.完成情况} /> : null,
      },
      {
        title: '次子结构',
        key: 'subSub',
        width: 300,
        onCell: (record: any) => ({ rowSpan: record.subSubRowSpan !== undefined ? record.subSubRowSpan : 1 }),
        render: (_: any, record: any) => {
          if (record.subSubRowSpan === 0) return null;
          return (
            <div style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {record.subSub?.名称 || '-'}
            </div>
          );
        },
      },
      {
        title: '完成情况',
        key: 'subSubStatus',
        width: 80,
        onCell: (record: any) => ({ rowSpan: record.subSubRowSpan !== undefined ? record.subSubRowSpan : 1 }),
        render: (_: any, record: any) => {
          if (record.subSubRowSpan === 0) return null;
          return record.subSub ? <StatusTag status={record.subSub.完成情况} /> : null;
        },
      },
      {
        title: '纠正情况',
        key: 'correction',
        width: 150,
        onCell: (record: any) => ({ rowSpan: record.stepRowSpan }),
        render: (_: any, record: any) => record.step.纠正情况 || '-',
      },
      {
        title: '备注',
        key: 'remark',
        width: 120,
        onCell: (record: any) => ({ rowSpan: record.stepRowSpan }),
        render: (_: any, record: any) => record.step.备注 || '-',
      },
    ];

    return (
      <Table
        columns={viewColumns}
        dataSource={tableData}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1200 }}
      />
    );
  };

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <div className="phone-check-page">
        <Card
          title="咨询师标准化录音分析表（电话标准化检查表）"
          extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadChecks}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
              新建检查
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, color: '#666', fontSize: 12 }}>
          说明：1.标准化表格返检电话；2.完成√，未完成×，不需要的子结构部分画○；3.每天连同日志表发校长群。
        </div>
        
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="咨询师"
            style={{ width: 120 }}
            allowClear
            onChange={(e) => setFilters({ ...filters, consultant: e.target.value || undefined })}
          />
          <Input
            placeholder="神殿"
            style={{ width: 120 }}
            allowClear
            value={currentCampus || ''}
            disabled
          />
          <DatePicker
            placeholder="开始日期"
            onChange={(date) => setFilters({ ...filters, start_date: date?.format('YYYY-MM-DD') })}
          />
          <DatePicker
            placeholder="结束日期"
            onChange={(date) => setFilters({ ...filters, end_date: date?.format('YYYY-MM-DD') })}
          />
          <Button type="primary" onClick={loadChecks}>
            搜索
          </Button>
          <Button icon={<ExportOutlined />} onClick={exportToCSV}>
            导出
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={checks}
          rowKey="记录ID"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      {/* 新建/编辑模态框 */}
      <Modal
        title={
          <Space>
            <span>{editingCheck ? '编辑' : '新建'}咨询师标准化录音分析表</span>
          </Space>
        }
        open={modalVisible}
        onOk={handleSave}
        onCancel={handleCloseModal}
        width={1600}
        destroyOnClose
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="神殿" label="神殿">
                <Input placeholder="神殿" disabled />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="咨询师"
                label="咨询师"
                rules={[{ required: true, message: '请输入咨询师' }]}
              >
                <Input placeholder="咨询师" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="日期"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="审核人" label="审核人">
                <Input placeholder="审核人" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="学员姓名" label="学员姓名">
                <Input placeholder="学员姓名" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="联系方式" label="联系方式">
                <Input placeholder="联系方式" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">检查内容</Divider>
          {renderCheckContentTable()}

          <Divider orientation="left">总结与备注</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="总结" label="总结">
                <TextArea rows={3} placeholder="总结" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="备注" label="备注">
                <TextArea rows={3} placeholder="备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title={
          <Space>
            <span>咨询师标准化录音分析表详情</span>
            <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={1400}
      >
        {viewingCheck && (
          <div>
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              <Col span={6}><strong>神殿：</strong>{viewingCheck.神殿 || '-'}</Col>
              <Col span={6}><strong>咨询师：</strong>{viewingCheck.咨询师}</Col>
              <Col span={6}><strong>日期：</strong>{dayjs(viewingCheck.日期).format('YYYY-MM-DD')}</Col>
              <Col span={6}><strong>审核人：</strong>{viewingCheck.审核人 || '-'}</Col>
              <Col span={6}><strong>学员姓名：</strong>{viewingCheck.学员姓名 || '-'}</Col>
              <Col span={6}><strong>联系方式：</strong>{viewingCheck.联系方式 || '-'}</Col>
            </Row>

            <Divider orientation="left">检查内容</Divider>
            {renderViewTable()}

            {viewingCheck.总结 && (
              <>
                <Divider orientation="left">总结</Divider>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewingCheck.总结}</div>
              </>
            )}

            {viewingCheck.备注 && (
              <>
                <Divider orientation="left">备注</Divider>
                <div style={{ whiteSpace: 'pre-wrap' }}>{viewingCheck.备注}</div>
              </>
            )}
          </div>
        )}
      </Modal>
      </div>
    </NoCopyContainer>
  );
};

export default PhoneCheckPage;
