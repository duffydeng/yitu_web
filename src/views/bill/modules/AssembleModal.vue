<template>
  <a-modal
    title="订单完工"
    :width="700"
    :visible="visible"
    :confirmLoading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
    cancelText="关闭">
    <a-spin :spinning="confirmLoading">
      <a-form :form="form" style="padding: 20px 10px;">
        <a-form-item label="完工时间" :labelCol="labelCol" :wrapperCol="wrapperCol">
          <j-date 
            placeholder="请选择完工时间" 
            v-decorator="['actualFinishTime', validatorRules.actualFinishTime]" 
            :show-time="true" 
            date-format="YYYY-MM-DD HH:mm:ss" 
            style="width: 100%">
          </j-date>
        </a-form-item>
        <a-form-item label="上传附件" :labelCol="labelCol" :wrapperCol="wrapperCol">
          <j-upload v-model="fileList" bizPath="dealer"></j-upload>
          <div style="color: #999; margin-top: 8px;">支持多文件上传，可上传完工照片、质检单等</div>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
  import { httpAction } from "@/api/manage"
  import JDate from "@/components/jeecg/JDate"
  import JUpload from "@/components/jeecg/JUpload"

  export default {
    name: "AssembleModal",
    components: {
      JDate,
      JUpload
    },
    data() {
      return {
        visible: false,
        confirmLoading: false,
        form: this.$form.createForm(this),
        ids: [],
        fileList: '',
        labelCol: {
          xs: { span: 24 },
          sm: { span: 6 }
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 18 }
        },
        validatorRules: {
          actualFinishTime: { rules: [{ required: true, message: "请选择完工时间!" }] }
        },
        url: {
          assemble: "/order/assemble"
        }
      }
    },
    computed: {},
    watch: {
      visible(val) {
        if (val) {
          document.addEventListener('keydown', this._handleEnter)
        } else {
          document.removeEventListener('keydown', this._handleEnter)
        }
      }
    },
    methods: {
      _handleEnter(e) {
        if (e.key === 'Enter' && !this.confirmLoading) {
          this.handleOk()
        }
      },
      show(ids) {
        this.ids = ids
        this.form.resetFields()
        this.fileList = ''
        this.visible = true
      },
      handleOk() {
        const that = this
        this.form.validateFields((err, values) => {
          if (!err) {
            that.confirmLoading = true
            let payload = {
              ids: this.ids.join(","),
              actualFinishTime: values.actualFinishTime,
              fileName: this.fileList
            }
            httpAction(this.url.assemble, payload, "post").then((res) => {
              if (res.code === 200) {
                const msg = res.data.msg || res.data.message || '订单完工成功'
                that.$message.success(msg)
                that.$emit("ok")
                that.close()
              } else {
                const errorMsg = res.message || res.data.message || '订单完工失败'
                that.$message.warning(errorMsg)
              }
            }).catch((error) => {
              that.$message.error('操作失败，请稍后重试')
            }).finally(() => {
              that.confirmLoading = false
            })
          }
        })
      },
      handleCancel() {
        this.close()
      },
      close() {
        this.$emit("close")
        this.visible = false
      }
    }
  }
</script>
