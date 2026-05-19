/**
 * 神殿教化司新生当月维稳明细编辑模态框
 */

import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, App } from 'antd';
import type { NewStudentStabilityDetailEditModalProps } from '@/types/new-student-stability-detail';
import dayjs from 'dayjs';

const NewStudentStabilityDetailEditModal: React.FC<NewStudentStabilityDetailEditModalProps> = ({
  visible,
  record,
  campus,
  onCancel,
  onSave
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        ...record,
        enrollmentDate: record.enrollmentDate ? dayjs(record.enrollmentDate) : null,
        fixedDepositTime: record.fixedDepositTime ? dayjs(record.fixedDepositTime) : null,
        refundTime: record.refundTime ? dayjs(record.refundTime) : null,
      });
    } else if (visible && !record) {
      form.resetFields();
      form.setFieldsValue({
        campus,
        tuitionFee: 0,
        qihangFee: 0,
        unionInvoiceAmount: 0,
        supplementAmount: 0,
        firePreventionAmount: 0,
        survivalAmount: 0,
        fixedDepositInterest: 0,
      });
    }
  }, [visible, record, form, campus]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        enrollmentDate: values.enrollmentDate ? values.enrollmentDate.format('YYYY-MM-DD') : '',
        fixedDepositTime: values.fixedDepositTime ? values.fixedDepositTime.format('YYYY-MM-DD') : '',
        refundTime: values.refundTime ? values.refundTime.format('YYYY-MM-DD') : '',
        campus,
        key: record?.key || `new-${Date.now()}`,
        serialNumber: record?.serialNumber || 0,
      };
      
      onSave(formattedValues);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={`${record ? '编辑' : '新增'}新生维稳明细`}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          tuitionFee: 0,
          qihangFee: 0,
          unionInvoiceAmount: 0,
          supplementAmount: 0,
          firePreventionAmount: 0,
          survivalAmount: 0,
          fixedDepositInterest: 0,
        }}
      >
        <Form.Item name="campus" hidden>
          <Input />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Form.Item
            label="班主任姓名"
            name="headTeacherName"
            rules={[{ required: true, message: '请输入班主任姓名' }]}
          >
            <Input placeholder="请输入班主任姓名" />
          </Form.Item>

          <Form.Item
            label="新生姓名"
            name="newStudentName"
            rules={[{ required: true, message: '请输入新生姓名' }]}
          >
            <Input placeholder="请输入新生姓名" />
          </Form.Item>

          <Form.Item
            label="入学时间"
            name="enrollmentDate"
            rules={[{ required: true, message: '请选择入学时间' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="专业"
            name="major"
            rules={[{ required: true, message: '请输入专业' }]}
          >
            <Input placeholder="请输入专业" />
          </Form.Item>

          <Form.Item
            label="学费"
            name="tuitionFee"
            rules={[{ required: true, message: '请输入学费' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              precision={2}
              placeholder="请输入学费"
            />
          </Form.Item>

          <Form.Item
            label="启航学费"
            name="qihangFee"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              precision={2}
              placeholder="请输入启航学费"
            />
          </Form.Item>

          <Form.Item
            label="联名发票金额"
            name="unionInvoiceAmount"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              precision={2}
              placeholder="请输入联名发票金额"
            />
          </Form.Item>

          <Form.Item
            label="补资金额"
            name="supplementAmount"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              precision={2}
              placeholder="请输入补资金额"
            />
          </Form.Item>

          <Form.Item
            label="防火责金额"
            name="firePreventionAmount"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              precision={2}
              placeholder="请输入防火责金额"
            />
          </Form.Item>

          <Form.Item
            label="生存金额"
            name="survivalAmount"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              precision={2}
              placeholder="请输入生存金额"
            />
          </Form.Item>

          <Form.Item
            label="定存保息"
            name="fixedDepositInterest"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0} 
              precision={2}
              placeholder="请输入定存保息"
            />
          </Form.Item>

          <Form.Item
            label="定存注资时间"
            name="fixedDepositTime"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="送考周期"
            name="dormitoryPeriod"
          >
            <Input placeholder="请输入送考周期" />
          </Form.Item>

          <Form.Item
            label="送考延迟"
            name="dormitoryDelay"
          >
            <Input placeholder="请输入送考延迟" />
          </Form.Item>

          <Form.Item
            label="退费时间"
            name="refundTime"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="定名住宿"
            name="accommodation1"
          >
            <Input placeholder="请输入定名住宿" />
          </Form.Item>

          <Form.Item
            label="留宿住"
            name="accommodation2"
          >
            <Input placeholder="请输入留宿住" />
          </Form.Item>
        </div>

        <Form.Item
          label="退费情况说明"
          name="refundDescription"
        >
          <Input.TextArea 
            rows={3}
            placeholder="请输入退费情况说明"
          />
        </Form.Item>

        <Form.Item
          label="备注"
          name="remarks"
        >
          <Input.TextArea 
            rows={3}
            placeholder="请输入备注"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NewStudentStabilityDetailEditModal;












