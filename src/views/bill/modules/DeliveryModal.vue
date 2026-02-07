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
            ids: this.orderIds.join(","),
            expressCompanyCode: this.model.expressCompanyCode,
            expressCompanyName: this.model.expressCompanyName,
            expressNumber: this.model.expressNumber
          }
          
          postAction(this.url.delivery, params)
            .then(res => {
              if (res.code === 200) {
                const msg = res.data.msg || res.data.message || '发货成功'
                this.$message.success(msg)
                this.$emit('ok')
                this.handleCancel()
              } else {
                const errorMsg = res.data.msg || res.message || res.data.message || '发货失败'
                this.$message.warning(errorMsg)
              }
            })
            .catch(err => {
              this.$message.error('操作失败，请稍后重试')
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
