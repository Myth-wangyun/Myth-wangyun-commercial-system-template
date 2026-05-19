import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker } from 'antd';
import dayjs from 'dayjs';
import type {
  CampusPersonalEnrollmentStatisticsRecord,
  CampusPersonalEnrollmentStatisticsEditModalProps,
} from '@/types/campus-personal-enrollment-statistics';

const CampusPersonalEnrollmentStatisticsEditModal: React.FC<CampusPersonalEnrollmentStatisticsEditModalProps> = ({
  visible,
  record,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        ...record,
        vocationalTargetTime: record.vocationalTargetTime
          ? dayjs(record.vocationalTargetTime)
          : null,
        universityTargetTime: record.universityTargetTime
          ? dayjs(record.universityTargetTime)
          : null,
      });
    } else {
      form.resetFields();
    }
  }, [visible, record, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        vocationalTargetTime: values.vocationalTargetTime
          ? values.vocationalTargetTime.format('YYYY-MM-DD')
          : '',
        universityTargetTime: values.universityTargetTime
          ? values.universityTargetTime.format('YYYY-MM-DD')
          : '',
      };
      onOk(formattedValues);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={record ? '编辑学籍统计' : '新增学籍统计'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      okText="确定"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="sequence"
          label="序号"
          rules={[{ required: true, message: '请输入序号' }]}
        >
          <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入序号" />
        </Form.Item>

        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input placeholder="请输入姓名" />
        </Form.Item>

        <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 'bold', fontSize: 16 }}>
          中专层次
        </div>

        <Form.Item
          name="vocational3YearRegistered"
          label="中专3年学籍注册人数"
          rules={[{ required: true, message: '请输入中专3年学籍注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          name="vocational1YearRegistered"
          label="中专1年制人数"
          rules={[{ required: true, message: '请输入中专1年制人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          name="vocationalOtherRegistered"
          label="其他已注册人数"
          rules={[{ required: true, message: '请输入其他已注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          name="vocationalTargetCount"
          label="目标注册人数"
          rules={[{ required: true, message: '请输入目标注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          name="vocationalTargetTime"
          label="目标注册时间"
          rules={[{ required: true, message: '请选择目标注册时间' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="vocationalActualRegistered"
          label="实际注册人数"
          rules={[{ required: true, message: '请输入实际注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 'bold', fontSize: 16 }}>
          大学层次
        </div>

        <Form.Item
          name="adultExamRegistered"
          label="成考注册人数"
          rules={[{ required: true, message: '请输入成考注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          name="openUniversityRegistered"
          label="国开注册人数"
          rules={[{ required: true, message: '请输入国开注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          name="universityOtherRegistered"
          label="其他已注册人数"
          rules={[{ required: true, message: '请输入其他已注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          name="universityTargetCount"
          label="目标注册人数"
          rules={[{ required: true, message: '请输入目标注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item
          name="universityTargetTime"
          label="目标注册时间"
          rules={[{ required: true, message: '请选择目标注册时间' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="universityActualRegistered"
          label="实际注册人数"
          rules={[{ required: true, message: '请输入实际注册人数' }]}
        >
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CampusPersonalEnrollmentStatisticsEditModal;












