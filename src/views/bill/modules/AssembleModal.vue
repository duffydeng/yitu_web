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
          <a-upload
            :action="uploadUrl"
            :file-list="fileList"
            :multiple="true"
            @change="handleUploadChange"
            :beforeUpload="beforeUpload">
            <a-button>
              <a-icon type="upload" /> 选择文件
            </a-button>
          </a-upload>
          <div style="color: #999; margin-top: 8px;">支持多文件上传，可上传完工照片、质检单等</div>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
  import { httpAction } from "@/api/manage"
  import JDate from "@/components/jeecg/JDate"

  export default {
    name: "AssembleModal",
    components: {
      JDate
    },
    data() {
      return {
        visible: false,
        confirmLoading: false,
        form: this.$form.createForm(this),
        ids: [],
        fileList: [],
        attachments: [],
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
          assemble: "/order/assemble",
          upload: "/orderAttachment/upload"
        }
      }
    },
    computed: {
      uploadUrl() {
        return window._CONFIG['domianURL'] + this.url.upload
      }
    },
    methods: {
      show(ids) {
        this.ids = ids
        this.form.resetFields()
        this.fileList = []
        this.attachments = []
        this.visible = true
      },
      beforeUpload(file) {
        const isLt10M = file.size / 1024 / 1024 < 10
        if (!isLt10M) {
          this.$message.error('文件大小不能超过10MB!')
          return false
        }
        return true
      },
      handleUploadChange(info) {
        let fileList = [...info.fileList]
        this.fileList = fileList
        
        // 处理上传成功的文件
        if (info.file.status === 'done') {
          const response = info.file.response
          if (response.code === 200 && response.data) {
            this.attachments.push({
              url: response.data.url || response.data,
              name: info.file.name
            })
            this.$message.success(`${info.file.name} 上传成功`)
          } else {
            this.$message.error(`${info.file.name} 上传失败`)
          }
        } else if (info.file.status === 'error') {
          this.$message.error(`${info.file.name} 上传失败`)
        }
        
        // 移除文件时同步删除attachments
        if (info.file.status === 'removed') {
          this.attachments = this.attachments.filter(att => att.name !== info.file.name)
        }
      },
      handleOk() {
        const that = this
        this.form.validateFields((err, values) => {
          if (!err) {
            that.confirmLoading = true
            let payload = {
              ids: this.ids.join(","),
              actualFinishTime: values.actualFinishTime,
              attachments: this.attachments
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
