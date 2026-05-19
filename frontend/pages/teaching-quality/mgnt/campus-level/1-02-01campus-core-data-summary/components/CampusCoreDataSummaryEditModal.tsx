/**
 * Ê†°Âå∫ÊïôË¥®ÈÉ®Ê†∏ÂøÉÊï∞ÊçÆÊ±áÊÄªÁºñËæëÊ®°ÊÄÅÊ°ÜÁªÑ‰ª∂
 */

import React from 'react'
import { App, Modal, Form, InputNumber, Row, Col, Divider } from 'antd'
import type {
  CampusCoreDataSummaryEditModalProps,
  CampusCoreDataSummaryRecord,
} from '@/types/campus-core-data-summary'

const CampusCoreDataSummaryEditModal: React.FC<CampusCoreDataSummaryEditModalProps> = ({
  visible,
  record,
  onCancel,
  onSave,
}) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  React.useEffect(() => {
    if (visible && record) {
      form.setFieldsValue({
        serialNumber: record.serialNumber,
        campus: record.campus,
        totalStudents: record.totalStudents,
        totalClasses: record.totalClasses,
        totalTeachingQualityPositions: record.totalTeachingQualityPositions,
        totalCadrePositions: record.totalCadrePositions,
        totalEmployees: record.totalEmployees,
        totalEmploymentClasses: record.totalEmploymentClasses,
        totalEmployedStudents: record.totalEmployedStudents,
        employmentRate: record.employmentRate,
        averageEmploymentSalary: record.averageEmploymentSalary,
        salaryOverTenThousand: record.salaryOverTenThousand,
        totalEnterpriseContracts: record.totalEnterpriseContracts,
        totalWordOfMouthRegistrations: record.totalWordOfMouthRegistrations,
        totalWordOfMouthRevenue: record.totalWordOfMouthRevenue,
        totalFurtherEducationStudents: record.totalFurtherEducationStudents,
        totalFurtherEducationRevenue: record.totalFurtherEducationRevenue,
        furtherEducationRateByAmount: record.furtherEducationRateByAmount,
        totalNewStudentEnrollments: record.totalNewStudentEnrollments,
        totalNewStudentRefunds: record.totalNewStudentRefunds,
        totalOldStudentRefunds: record.totalOldStudentRefunds,
        refundRate: record.refundRate,
        turnoverRate: record.turnoverRate,
        totalDormitories: record.totalDormitories,
        totalDormitoryResidents: record.totalDormitoryResidents,
        targetSecondaryVocationalRegistrations: record.targetSecondaryVocationalRegistrations,
        targetUniversityRegistrations: record.targetUniversityRegistrations,
      })
    }
  }, [visible, record, form])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      if (!record) {
        message.error('ËÆ∞ÂΩï‰∏çÂ≠òÂú®')
        return
      }

      const updatedRecord: CampusCoreDataSummaryRecord = {
        ...record,
        totalStudents: values.totalStudents || 0,
        totalClasses: values.totalClasses || 0,
        totalTeachingQualityPositions: values.totalTeachingQualityPositions || 0,
        totalCadrePositions: values.totalCadrePositions || 0,
        totalEmployees: values.totalEmployees || 0,
        totalEmploymentClasses: values.totalEmploymentClasses || 0,
        totalEmployedStudents: values.totalEmployedStudents || 0,
        employmentRate: values.employmentRate || 0,
        averageEmploymentSalary: values.averageEmploymentSalary || 0,
        salaryOverTenThousand: values.salaryOverTenThousand || 0,
        totalEnterpriseContracts: values.totalEnterpriseContracts || 0,
        totalWordOfMouthRegistrations: values.totalWordOfMouthRegistrations || 0,
        totalWordOfMouthRevenue: values.totalWordOfMouthRevenue || 0,
        totalFurtherEducationStudents: values.totalFurtherEducationStudents || 0,
        totalFurtherEducationRevenue: values.totalFurtherEducationRevenue || 0,
        furtherEducationRateByAmount: values.furtherEducationRateByAmount || 0,
        totalNewStudentEnrollments: values.totalNewStudentEnrollments || 0,
        totalNewStudentRefunds: values.totalNewStudentRefunds || 0,
        totalOldStudentRefunds: values.totalOldStudentRefunds || 0,
        refundRate: values.refundRate || 0,
        turnoverRate: values.turnoverRate || 0,
        totalDormitories: values.totalDormitories || 0,
        totalDormitoryResidents: values.totalDormitoryResidents || 0,
        targetSecondaryVocationalRegistrations: values.targetSecondaryVocationalRegistrations || 0,
        targetUniversityRegistrations: values.targetUniversityRegistrations || 0,
      }

      onSave(updatedRecord)
      message.success('‰øùÂ≠òÊàêÂäü')
    } catch (error) {
      message.error('‰øùÂ≠òÂ§±Ë¥•')
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={`${record ? 'ÁºñËæë' : 'Êñ∞Â¢û'}${record?.campus || ''}Ê†°Âå∫ÊïôË¥®ÈÉ®Ê†∏ÂøÉÊï∞ÊçÆÊ±áÊÄª`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      width={1400}
      okText="‰øùÂ≠ò"
      cancelText="ÂèñÊ∂à"
      style={{ top: 20 }}
    >
      <Form form={form} layout="vertical" preserve={false} scrollToFirstError>
        {/* Âü∫Á°Ä‰ø°ÊÅØ */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#1890ff', marginBottom: 12 }}>üìä Âü∫Á°Ä‰ø°ÊÅØ</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Â∫èÂè∑"
                name="serialNumber"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Â∫èÂè∑' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} disabled={!!record} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Ê†°Âå∫"
                name="campus"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Ê†°Âå∫' }]}
              >
                <InputNumber style={{ width: '100%' }} disabled={!!record} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Â≠¶ÁîüÊÄª‰∫∫Êï∞"
                name="totalStudents"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Â≠¶ÁîüÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Â≠¶ÁîüÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Áè≠Á∫ßÊÄª‰∏™Êï∞"
                name="totalClasses"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Áè≠Á∫ßÊÄª‰∏™Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Áè≠Á∫ßÊÄª‰∏™Êï∞" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="ÊïôË¥®ÊÄªËÅåÊï∞"
                name="totalTeachingQualityPositions"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÊïôË¥®ÊÄªËÅåÊï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•ÊïôË¥®ÊÄªËÅåÊï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Âπ≤ÈÉ®ÊÄªËÅåÊï∞"
                name="totalCadrePositions"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Âπ≤ÈÉ®ÊÄªËÅåÊï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Âπ≤ÈÉ®ÊÄªËÅåÊï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="ÂëòÂ∑•ÊÄª‰∫∫Êï∞"
                name="totalEmployees"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÂëòÂ∑•ÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•ÂëòÂ∑•ÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Â∞±‰∏öÁè≠Á∫ßÊÄªÊï∞"
                name="totalEmploymentClasses"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Â∞±‰∏öÁè≠Á∫ßÊÄªÊï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Â∞±‰∏öÁè≠Á∫ßÊÄªÊï∞" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Â∞±‰∏öÁõ∏ÂÖ≥ */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#52c41a', marginBottom: 12 }}>üíº Â∞±‰∏öÁõ∏ÂÖ≥</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Â∞±‰∏öÊÄª‰∫∫Êï∞"
                name="totalEmployedStudents"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Â∞±‰∏öÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Â∞±‰∏öÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Â∞±‰∏öÁéá(%)"
                name="employmentRate"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Â∞±‰∏öÁéá' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="ËØ∑ËæìÂÖ•Â∞±‰∏öÁéá"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Â∞±‰∏öÂπ≥ÂùáËñ™ËµÑ"
                name="averageEmploymentSalary"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Â∞±‰∏öÂπ≥ÂùáËñ™ËµÑ' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Â∞±‰∏öÂπ≥ÂùáËñ™ËµÑ" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Ëñ™ËµÑËøá‰∏á‰∫∫Êï∞"
                name="salaryOverTenThousand"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Ëñ™ËµÑËøá‰∏á‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Ëñ™ËµÑËøá‰∏á‰∫∫Êï∞" />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* ‰ºÅ‰∏öÂêà‰Ωú‰∏éÂè£Á¢ë */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#fa8c16', marginBottom: 12 }}>ü§ù ‰ºÅ‰∏öÂêà‰Ωú‰∏éÂè£Á¢ë</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="‰ºÅ‰∏öÁ≠æÁ∫¶ÊÄªÊï∞"
                name="totalEnterpriseContracts"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•‰ºÅ‰∏öÁ≠æÁ∫¶ÊÄªÊï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•‰ºÅ‰∏öÁ≠æÁ∫¶ÊÄªÊï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Âè£Á¢ëÊä•ÂêçÊÄª‰∫∫Êï∞"
                name="totalWordOfMouthRegistrations"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Âè£Á¢ëÊä•ÂêçÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Âè£Á¢ëÊä•ÂêçÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Âè£Á¢ëÊÄªÊî∂ÂÖ•"
                name="totalWordOfMouthRevenue"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Âè£Á¢ëÊÄªÊî∂ÂÖ•' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Âè£Á¢ëÊÄªÊî∂ÂÖ•" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="ÂçáÂ≠¶ÊÄª‰∫∫Êï∞"
                name="totalFurtherEducationStudents"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÂçáÂ≠¶ÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•ÂçáÂ≠¶ÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="ÂçáÂ≠¶ÊÄªÊî∂ÂÖ•"
                name="totalFurtherEducationRevenue"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÂçáÂ≠¶ÊÄªÊî∂ÂÖ•' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•ÂçáÂ≠¶ÊÄªÊî∂ÂÖ•" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="ÂçáÂ≠¶ÁéáÔºàÈáëÈ¢ùÔºâ(%)"
                name="furtherEducationRateByAmount"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÂçáÂ≠¶Áéá' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="ËØ∑ËæìÂÖ•ÂçáÂ≠¶Áéá"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* Â≠¶ÁîüÁÆ°ÁêÜ */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#722ed1', marginBottom: 12 }}>üë• Â≠¶ÁîüÁÆ°ÁêÜ</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="Êñ∞ÁîüÂÖ•Â≠¶ÊÄª‰∫∫Êï∞"
                name="totalNewStudentEnrollments"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Êñ∞ÁîüÂÖ•Â≠¶ÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Êñ∞ÁîüÂÖ•Â≠¶ÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Êñ∞ÁîüÈÄÄË¥πÊÄª‰∫∫Êï∞"
                name="totalNewStudentRefunds"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Êñ∞ÁîüÈÄÄË¥πÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•Êñ∞ÁîüÈÄÄË¥πÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="ËÄÅÁîüÈÄÄË¥πÊÄª‰∫∫Êï∞"
                name="totalOldStudentRefunds"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ËÄÅÁîüÈÄÄË¥πÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•ËÄÅÁîüÈÄÄË¥πÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="ÈÄÄË¥πÁéá(%)"
                name="refundRate"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÈÄÄË¥πÁéá' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="ËØ∑ËæìÂÖ•ÈÄÄË¥πÁéá"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="ÂºÇÂä®Áéá(%)"
                name="turnoverRate"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÂºÇÂä®Áéá' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                  placeholder="ËØ∑ËæìÂÖ•ÂºÇÂä®Áéá"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* ÂÆøËàç‰∏éÂ≠¶Á±ç */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ color: '#13c2c2', marginBottom: 12 }}>üè† ÂÆøËàç‰∏éÂ≠¶Á±ç</h4>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                label="ÂÆøËàçÊÄª‰∏™Êï∞"
                name="totalDormitories"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÂÆøËàçÊÄª‰∏™Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•ÂÆøËàçÊÄª‰∏™Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="ÂÆøËàçÊÄª‰∫∫Êï∞"
                name="totalDormitoryResidents"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•ÂÆøËàçÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} placeholder="ËØ∑ËæìÂÖ•ÂÆøËàçÊÄª‰∫∫Êï∞" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="‰∏≠‰∏ìÂ±ÇÊ¨°ÁõÆÊ†áÊ≥®ÂÜåÊÄª‰∫∫Êï∞"
                name="targetSecondaryVocationalRegistrations"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•‰∏≠‰∏ìÂ±ÇÊ¨°ÁõÆÊ†áÊ≥®ÂÜåÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="ËØ∑ËæìÂÖ•‰∏≠‰∏ìÂ±ÇÊ¨°ÁõÆÊ†áÊ≥®ÂÜåÊÄª‰∫∫Êï∞"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label="Â§ßÂ≠¶Â±ÇÊ¨°ÁõÆÊ†áÊ≥®ÂÜåÊÄª‰∫∫Êï∞"
                name="targetUniversityRegistrations"
                rules={[{ required: true, message: 'ËØ∑ËæìÂÖ•Â§ßÂ≠¶Â±ÇÊ¨°ÁõÆÊ†áÊ≥®ÂÜåÊÄª‰∫∫Êï∞' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="ËØ∑ËæìÂÖ•Â§ßÂ≠¶Â±ÇÊ¨°ÁõÆÊ†áÊ≥®ÂÜåÊÄª‰∫∫Êï∞"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      </Form>
    </Modal>
  )
}

export default CampusCoreDataSummaryEditModal
