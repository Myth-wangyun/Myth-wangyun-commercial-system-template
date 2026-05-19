// 学术->神殿->智慧司员工功能分析表
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, 
	Card, 
	Table, 
	Button, 
	Space, 
	Typography, 
	InputNumber, 
	Modal, 
	Form, 
	Input, 
	DatePicker,
	Tag,
	Row,
	Col,
	Spin,
	Tooltip
} from 'antd';
import { 
	SettingOutlined, 
	DownloadOutlined, 
	ReloadOutlined,
	TeamOutlined,
	SaveOutlined,
	SyncOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCampusStore } from '@/stores/campusStore';
import CampusSelector from '@/components/common/CampusSelector';
import { normalizeCampus } from '@/pages/academic/teaching-content/shared/campusStorage';
import { buildApiUrl } from '@/utils/apiBase';

const { Title, Text } = Typography;

type Category = '核心业务能力' | '一般业务能力' | '价值观';

// 数据记录类型 - 使用教员姓名作为动态键
interface StaffFunctionRecord {
	id: string;
	index: number; // 序号
	category: Category;
	functionItem: string; // 功能项目
	detailRequirement: string; // 详细要求
	fullScore: number; // 满分
	[key: string]: string | number | Category; // 动态键：教员姓名 -> 评分值
}

interface PersistData {
	evaluators: string[]; // 教员姓名列表
	rows: StaffFunctionRecord[];
}

const defaultNames = Array.from({ length: 9 }).map((_, i) => `姓名${i + 1}`);

// 构建默认13项数据（按图片描述）
// 使用教员姓名作为键，而不是s1-s9
const buildDefaultRows = (teacherNames: string[]): StaffFunctionRecord[] => {
	const mk = (
		index: number, 
		category: Category, 
		functionItem: string, 
		detailRequirement: string, 
		fullScore: number,
		teachers: string[]
	): StaffFunctionRecord => {
		const record: StaffFunctionRecord = {
			id: String(index),
			index,
			category,
			functionItem,
			detailRequirement,
			fullScore,
		};
		// 为每个教员初始化评分为0
		teachers.forEach(name => {
			record[name] = 0;
		});
		return record;
	};

	return [
		// 核心业务能力 (1-3)
		mk(1, '核心业务能力', '学员就业', '就业率和就业薪资高。', 15, teacherNames),
		mk(2, '核心业务能力', '口碑招生', '口碑招生和收入高。', 10, teacherNames),
		mk(3, '核心业务能力', '新生维稳', '新生流失较少。', 10, teacherNames),
		// 一般业务能力 (4-7)
		mk(4, '一般业务能力', '技术能力', '个人技术水平', 10, teacherNames),
		mk(5, '一般业务能力', '教学研发', '网络调查、开发大纲、课件编写能力。', 5, teacherNames),
		mk(6, '一般业务能力', '教学实施', '授课能力、积极辅导。', 10, teacherNames),
		mk(7, '一般业务能力', '教学测评', '考试合格率、学员满意度等。', 10, teacherNames),
		// 价值观 (8-13)
		mk(8, '价值观', '责任心', '对待学生，对待工作有责任心。', 5, teacherNames),
		mk(9, '价值观', '执行力', '能认真执行上级领导的各项安排。', 5, teacherNames),
		mk(10, '价值观', '任劳任怨', '不辞辛苦，任劳任怨。', 5, teacherNames),
		mk(11, '价值观', '团队精神', '有大局观，个人利益服从集体利益。', 5, teacherNames),
		mk(12, '价值观', '职业行为', '工装、出勤、自律。', 5, teacherNames),
		mk(13, '价值观', '沟通能力', '对上级、对同事、对学生', 5, teacherNames),
	];
};

// 计算类别 rowSpan
function computeCategoryRowSpan(data: StaffFunctionRecord[]) {
	const spans: Record<string, number> = {};
	let i = 0;
	while (i < data.length) {
		const category = data[i].category;
		let count = 1;
		for (let j = i + 1; j < data.length && data[j].category === category; j++) count++;
		spans[data[i].id] = count;
		for (let k = i + 1; k < i + count; k++) spans[data[k].id] = 0;
		i += count;
	}
	return spans;
}

const StaffFunctionAnalysisPage: React.FC = () => {
  const { message } = App.useApp()
	const { currentCampus, getAllCampuses } = useCampusStore();
	const resolvedCampus = normalizeCampus(currentCampus ?? getAllCampuses()[0]?.name ?? '主神殿');
	const [year, setYear] = useState<number>(dayjs().year());
	const [names, setNames] = useState<string[]>(defaultNames);
	const [rows, setRows] = useState<StaffFunctionRecord[]>(buildDefaultRows(defaultNames));
	const [settingOpen, setSettingOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [form] = Form.useForm();

	// 从后端获取教员列表（仅当前神殿）
	const loadTeachers = useCallback(async () => {
		try {
			// 确保使用当前神殿名称过滤
			const url = `${buildApiUrl('/config/teachers')}?campus_name=${encodeURIComponent(resolvedCampus)}&active=true`;
			console.log('[员工功能分析] 请求教员列表，神殿:', resolvedCampus, 'URL:', url);
			const res = await fetch(url);
			if (!res.ok) {
				console.warn('[员工功能分析] 获取教员列表失败:', res.status, res.statusText);
				return;
			}
			const data: { name?: string; campus_name?: string }[] = await res.json();
			// 双重过滤：确保只使用当前神殿的教员（防止后端返回所有教员）
			const teacherNames = data
				.filter((t) => {
					// 如果后端返回了campus_name，进行二次过滤
					if (t.campus_name && t.campus_name !== resolvedCampus) {
						return false;
					}
					return true;
				})
				.map((t) => (t.name || '').trim())
				.filter(Boolean);
			
			console.log(`[员工功能分析] 神殿 ${resolvedCampus} 的教员数量:`, teacherNames.length, '教员列表:', teacherNames);
			
			if (teacherNames.length > 0) {
				// 取前9个教员，不足则用默认名
				const finalNames = [...teacherNames.slice(0, 9)];
				while (finalNames.length < 9) finalNames.push(`姓名${finalNames.length + 1}`);
				setNames(finalNames);
				// 如果当前rows为空或需要更新教员列，重新初始化
				setRows(prev => {
					if (prev.length === 0 || prev.length !== 13) {
						return buildDefaultRows(finalNames);
					}
					// 更新现有rows，添加新教员列，移除不存在的教员列
					return prev.map(row => {
						const newRow: StaffFunctionRecord = {
							id: row.id,
							index: row.index,
							category: row.category,
							functionItem: row.functionItem,
							detailRequirement: row.detailRequirement,
							fullScore: row.fullScore,
						};
						// 为每个教员设置评分（保留旧值或初始化为0）
						finalNames.forEach(name => {
							newRow[name] = (row[name] as number) || 0;
						});
						return newRow;
					});
				});
				console.log('[员工功能分析] 成功加载当前神殿教员列表:', finalNames);
			} else {
				console.warn(`[员工功能分析] 神殿 ${resolvedCampus} 未获取到教员，使用默认姓名`);
			}
		} catch (error) {
			console.error('[员工功能分析] 加载教员列表失败:', error);
		}
	}, [resolvedCampus]);

	// 从后端加载数据
	const fetchRemote = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(
				buildApiUrl(`/staff-function-analysis?campus=${encodeURIComponent(resolvedCampus)}&year=${year}`)
			);
			if (res.ok) {
				const list = await res.json();
				if (Array.isArray(list) && list.length) {
					// 直接使用第一条记录（按年份筛选，每个神殿+年份只有一条记录）
					const record = list[0];
					const data = record?.['数据'] || {};
					
					// 恢复教员列表（兼容多种存储格式）
					let restoredNames: string[] = [];
					
					// 格式1: data.evaluators (新保存格式)
					if (Array.isArray(data.evaluators) && data.evaluators.length) {
						restoredNames = data.evaluators.slice(0, 9);
						console.log('[员工功能分析] 从 evaluators 恢复教员:', restoredNames);
					}
					// 格式2: data.teachers (旧保存格式)
					else if (Array.isArray(data.teachers) && data.teachers.length) {
						restoredNames = data.teachers.slice(0, 9);
						console.log('[员工功能分析] 从 teachers 恢复教员:', restoredNames);
					}
					// 格式3: data.evaluatorMapping (s1->教员名 映射格式)
					else if (data.evaluatorMapping && typeof data.evaluatorMapping === 'object') {
						const mapping = data.evaluatorMapping;
						for (let i = 1; i <= 11 && restoredNames.length < 9; i++) {
							const key = `s${i}`;
							if (mapping[key]) {
								restoredNames.push(mapping[key]);
							}
						}
						console.log('[员工功能分析] 从 evaluatorMapping 恢复教员:', restoredNames);
					}
					// 格式4: data.columnHeaders (兼容更旧的格式)
					else if (data.columnHeaders && typeof data.columnHeaders === 'object') {
						const headers = data.columnHeaders;
						for (let i = 1; i <= 11 && restoredNames.length < 9; i++) {
							const key = `s${i}`;
							if (headers[key]) {
								restoredNames.push(headers[key]);
							}
						}
						console.log('[员工功能分析] 从 columnHeaders 恢复教员:', restoredNames);
					}
					
					// 填充默认名称
					while (restoredNames.length < 9) restoredNames.push(`姓名${restoredNames.length + 1}`);
					restoredNames = restoredNames.slice(0, 9);
					setNames(restoredNames);
					console.log('[员工功能分析] 最终教员列表:', restoredNames);
					
					// 构建 evaluatorMapping 用于数据恢复（s1->教员名）
					const evaluatorMap: Record<string, string> = {};
					if (data.evaluatorMapping) {
						Object.assign(evaluatorMap, data.evaluatorMapping);
					}
					restoredNames.forEach((name, idx) => {
						if (!evaluatorMap[`s${idx + 1}`]) {
							evaluatorMap[`s${idx + 1}`] = name;
						}
					});
					
					if (Array.isArray(data.rows) && data.rows.length) {
						// 使用恢复的教员列表来构建数据
						const defaultRows = buildDefaultRows(restoredNames);
						const mergedRows = data.rows.map((row: any, idx: number) => {
							const defaultRow = defaultRows.find(d => d.id === String(row.id)) || defaultRows[idx] || defaultRows[0];
							const mergedRow: StaffFunctionRecord = {
								id: defaultRow.id,
								index: defaultRow.index,
								category: defaultRow.category,
								functionItem: defaultRow.functionItem,
								detailRequirement: defaultRow.detailRequirement,
								fullScore: defaultRow.fullScore,
							};
							// 复制所有教员评分（兼容新旧多种格式）
							restoredNames.forEach((name, nameIdx) => {
								// 新格式：直接用教员姓名作为键
								if (row[name] !== undefined) {
									mergedRow[name] = Number(row[name]) || 0;
								} else {
									// 旧格式：用 s1, s2, ... 作为键
									const oldKey = `s${nameIdx + 1}`;
									if (row[oldKey] !== undefined) {
										mergedRow[name] = Number(row[oldKey]) || 0;
									} else {
										mergedRow[name] = 0;
									}
								}
							});
							return mergedRow;
						});
						setRows(mergedRows);
						message.success(`已从后端加载 ${data.rows.length} 条数据`);
						return;
					}
				}
			}
			// 无数据时重置为默认（使用当前names）
			const currentNames = names.length > 0 ? names : defaultNames;
			setRows(buildDefaultRows(currentNames));
		} catch (error) {
			console.error('[员工功能分析] 远端加载失败:', error);
			message.error('加载数据失败');
		} finally {
			setLoading(false);
		}
	}, [resolvedCampus, year]);

	// 保存到后端
	const handleSave = async () => {
		setSaving(true);
		try {
			const payload = {
				神殿: resolvedCampus,
				年份: year,
				数据: {
					evaluators: names,
					rows, // 数据直接使用教员姓名作为键
				},
			};
			const res = await fetch(buildApiUrl('/staff-function-analysis'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});
			if (!res.ok) {
				const errorText = await res.text();
				console.error('[员工功能分析] 保存失败:', res.status, errorText);
				throw new Error(errorText || `HTTP ${res.status}`);
			}
			const result = await res.json();
			console.log('[员工功能分析] 保存成功:', result);
			message.success('已保存到后端');
		} catch (error) {
			console.error('[员工功能分析] 保存失败:', error);
			message.error(`保存失败: ${error instanceof Error ? error.message : '请重试'}`);
		} finally {
			setSaving(false);
		}
	};

	// 从教员功能分析表自动获取数据
	const handleAutoFetch = async () => {
		// 直接调用 fetchRemote 从后端加载已保存的数据
		await fetchRemote();
	};

	// 初始加载教员列表
	useEffect(() => {
		loadTeachers();
	}, [loadTeachers]);

	// 神殿或月份变化时重新加载数据
	useEffect(() => {
		fetchRemote();
	}, [fetchRemote]);

	// 评分变更 - 使用教员姓名作为键
	const onScoreChange = (id: string, teacherName: string, v: number | null) => {
		setRows(prev => prev.map(r => {
			if (r.id === id) {
				const newRow = { ...r };
				newRow[teacherName] = Math.min(Math.max(Number(v || 0), 0), r.fullScore);
				return newRow;
			}
			return r;
		}));
	};

	// 计算合计 - 使用教员姓名作为键
	const totals = useMemo(() => {
		const sum = (teacherName: string) => rows.reduce((a, b) => a + ((b[teacherName] as number) || 0), 0);
		const teacherTotals: { [key: string]: number } = {};
		names.forEach(name => {
			teacherTotals[name] = sum(name);
		});
		return {
			full: rows.reduce((a, b) => a + b.fullScore, 0),
			teachers: teacherTotals,
		};
	}, [rows, names]);

	const categoryRowSpanMap = useMemo(() => computeCategoryRowSpan(rows), [rows]);

	// 设置评分人
	const openSetting = () => {
		form.setFieldsValue({ evaluators: names });
		setSettingOpen(true);
	};

	const handleSettingOk = async () => {
		const values = await form.validateFields();
		const list: string[] = (values.evaluators || []).map((x: string) => x?.trim() || '').slice(0, 9);
		while (list.length < 9) list.push(`姓名${list.length + 1}`);
		setNames(list);
		// 更新rows结构，添加新教员列，移除不存在的教员列
		setRows(prev => prev.map(row => {
			const newRow: StaffFunctionRecord = {
				id: row.id,
				index: row.index,
				category: row.category,
				functionItem: row.functionItem,
				detailRequirement: row.detailRequirement,
				fullScore: row.fullScore,
			};
			// 为每个新教员设置评分（保留旧值或初始化为0）
			list.forEach(name => {
				newRow[name] = (row[name] as number) || 0;
			});
			return newRow;
		}));
		setSettingOpen(false);
		message.success('设置已保存');
	};

	// 重置分数
	const handleReset = () => {
		setRows(buildDefaultRows(names));
		message.success('分数已重置');
	};

	// 导出CSV
	const handleExport = () => {
		const headers = ['序号', '类别', '功能项目', '详细要求', '满分', ...names];
		const body = rows.map(r => [
			r.index,
			r.category,
			r.functionItem,
			r.detailRequirement,
			r.fullScore,
			...names.map(name => (r[name] as number) || 0)
		]);
		const summary = [
			'合计', '', '', '', totals.full, 
			...names.map(name => totals.teachers[name] || 0)
		];
		const csv = [headers, ...body, summary]
			.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
			.join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `${resolvedCampus}智慧司员工功能分析表_${year}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
		message.success('导出成功');
	};

	// 表格列定义
	const columns: ColumnsType<StaffFunctionRecord> = [
		{ 
			title: '序号', 
			dataIndex: 'index', 
			key: 'index', 
			width: 70, 
			align: 'center',
			fixed: 'left'
		},
		{
			title: '类别',
			dataIndex: 'category',
			key: 'category',
			width: 120,
			align: 'center',
			onCell: (record) => ({
				rowSpan: categoryRowSpanMap[record.id],
			}),
		},
		{ 
			title: '功能项目', 
			dataIndex: 'functionItem', 
			key: 'functionItem', 
			width: 140,
			align: 'center'
		},
		{ 
			title: '详细要求', 
			dataIndex: 'detailRequirement', 
			key: 'detailRequirement', 
			width: 280,
			align: 'center'
		},
		{ 
			title: '满分', 
			dataIndex: 'fullScore', 
			key: 'fullScore', 
			width: 80, 
			align: 'center' 
		},
		...names.map((teacherName, idx) => ({
			title: teacherName,
			dataIndex: teacherName,
			key: `teacher_${idx}`,
			width: 90,
			align: 'right' as const,
			render: (_: any, record: StaffFunctionRecord) => (
				<InputNumber
					min={0}
					max={record.fullScore}
					step={1}
					value={(record[teacherName] as number) || 0}
					onChange={(v) => onScoreChange(record.id, teacherName, v)}
					style={{ width: '100%' }}
				/>
			),
		})),
	];

	return (
		<div style={{ padding: 24 }}>
			<div style={{ marginBottom: 16 }}>
				<Title level={2}>
					<TeamOutlined className="me-2" />
					{resolvedCampus}智慧司员工功能分析表
				</Title>
				<Text type="secondary">9名评分人，满分100，按神殿+年份独立保存到后端</Text>
			</div>

			<div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
				<CampusSelector useGlobalState showLabel />
				<Space>
					<span>年份</span>
					<DatePicker
						picker="year"
						value={dayjs().year(year)}
						onChange={(d) => setYear(d ? d.year() : year)}
					/>
				</Space>
				<Space>
					<Tooltip title="从后端数据库重新加载已保存的数据">
						<Button icon={<SyncOutlined />} onClick={handleAutoFetch} loading={loading}>
							刷新数据
						</Button>
					</Tooltip>
					<Button icon={<SettingOutlined />} onClick={openSetting}>
						设置评分人
					</Button>
					<Button icon={<ReloadOutlined />} onClick={handleReset}>
						重置分数
					</Button>
					<Button icon={<DownloadOutlined />} onClick={handleExport}>
						导出CSV
					</Button>
					<Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
						保存
					</Button>
				</Space>
			</div>

			<Spin spinning={loading}>
			<Card>
				<Table
					columns={columns}
					dataSource={rows}
					rowKey="id"
					pagination={false}
					bordered
					size="small"
					scroll={{ x: 1600 }}
					summary={() => (
						<Table.Summary.Row>
							<Table.Summary.Cell index={0} align="center">
								<Text strong>合计</Text>
							</Table.Summary.Cell>
							<Table.Summary.Cell index={1} />
							<Table.Summary.Cell index={2} />
							<Table.Summary.Cell index={3} />
							<Table.Summary.Cell index={4} align="center">
								<Tag color="blue">{totals.full}</Tag>
							</Table.Summary.Cell>
							{names.map((name, idx) => (
								<Table.Summary.Cell key={name} index={5 + idx} align="center">
									<Tag color="geekblue">{totals.teachers[name] || 0}</Tag>
								</Table.Summary.Cell>
							))}
						</Table.Summary.Row>
					)}
				/>
			</Card>
			</Spin>

			{/* 设置评分人与月份 */}
			<Modal
				title="设置评分人与月份"
				open={settingOpen}
				onOk={handleSettingOk}
				onCancel={() => setSettingOpen(false)}
				destroyOnHidden
			>
				<Form form={form} layout="vertical" initialValues={{ evaluators: names }}>
					<Row gutter={12}>
						{Array.from({ length: 9 }).map((_, i) => (
							<Col span={12} key={i}>
								<Form.Item name={['evaluators', i]} label={`姓名${i + 1}`}>
									<Input placeholder={`姓名${i + 1}`} />
								</Form.Item>
							</Col>
						))}
					</Row>
				</Form>
			</Modal>
		</div>
	);
};

export default StaffFunctionAnalysisPage;
