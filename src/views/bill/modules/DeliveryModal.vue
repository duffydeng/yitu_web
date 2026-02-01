<template>
  <a-modal
    :title="title"
    :width="600"
    :visible="visible"
    :confirmLoading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
    :maskClosable="false"
  >
    <a-spin :spinning="confirmLoading">
      <a-form-model
        ref="form"
        :model="model"
        :rules="rules"
        :label-col="labelCol"
        :wrapper-col="wrapperCol"
      >
        <a-form-model-item label="快递公司" prop="expressCompanyCode">
          <a-select
            v-model="model.expressCompanyCode"
            placeholder="请选择快递公司"
            @change="handleExpressChange"
          >
            <a-select-option value="deppon">德邦</a-select-option>
            <a-select-option value="sfExpress">顺丰</a-select-option>
            <a-select-option value="ztoTran">中通</a-select-option>
          </a-select>
        </a-form-model-item>
        
        <a-form-model-item label="快递单号">
          <a-input
            v-model="model.expressNumber"
            placeholder="请输入快递单号（选填）"
          />
        </a-form-model-item>
      </a-form-model>
    </a-spin>
  </a-modal>
</template>

<script>
import { postAction } from '@/api/manage'

export default {
  name: 'DeliveryModal',
  data() {
    return {
      title: '发货',
      visible: false,
      confirmLoading: false,
      labelCol: {
        span: 6
      },
      wrapperCol: {
        span: 16
      },
      model: {
        expressCompanyCode: undefined,
        expressCompanyName: undefined,
        expressNumber: undefined
      },
      orderIds: [],
      rules: {
        expressCompanyCode: [
          { required: true, message: '请选择快递公司', trigger: 'change' }
        ]
      },
      expressCompanyMap: {
        deppon: '德邦',
        sfExpress: '顺丰',
        ztoTran: '中通'
      },
      url: {
        delivery: '/order/delivery'
      }
    }
  },
  methods: {
    show(orderIds) {
      this.visible = true
      this.orderIds = orderIds || []
    },
    handleExpressChange(value) {
      this.model.expressCompanyName = this.expressCompanyMap[value]
    },
    handleOk() {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.confirmLoading = true
          const params = {
            orderIds: this.orderIds,
            expressCompanyCode: this.model.expressCompanyCode,
            expressCompanyName: this.model.expressCompanyName,
            expressNumber: this.model.expressNumber
          }
          
          postAction(this.url.delivery, params)
            .then(res => {
              if (res.success) {
                this.$message.success('发货成功')
                this.handleCancel()
                this.$emit('ok')
              } else {
                this.$message.error(res.message || '发货失败')
              }
            })
            .catch(err => {
              this.$message.error('发货失败：' + err.message)
            })
            .finally(() => {
              this.confirmLoading = false
            })
        }
      })
    },
    handleCancel() {
      this.visible = false
      this.orderIds = []
      this.resetForm()
    },
    resetForm() {
      this.$nextTick(() => {
        this.$refs.form.clearValidate()
        this.model = {
          expressCompanyCode: undefined,
          expressCompanyName: undefined,
          expressNumber: undefined
        }
      })
    }
  }
}
</script>
