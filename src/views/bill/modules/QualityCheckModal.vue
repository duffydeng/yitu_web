<template>
  <a-modal
    title="质检完成"
    :width="700"
    :visible="visible"
    :confirmLoading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
    cancelText="关闭">
    <a-spin :spinning="confirmLoading">
      <a-form :form="form" style="padding: 20px 10px;">
        <a-form-item label="质检人" :labelCol="labelCol" :wrapperCol="wrapperCol">
          <a-select 
            v-decorator="['qualityInspector', validatorRules.qualityInspector]" 
            placeholder="请选择质检人"
            showSearch
            :filter-option="false"
            @search="handleSearchUser"
            @focus="handleUserFocus"
            @popupScroll="handleUserScroll"
            optionFilterProp="children">
            <a-select-option v-for="(username, index) in userList" :key="index" :value="username">
              {{ username }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="质检时间" :labelCol="labelCol" :wrapperCol="wrapperCol">
          <j-date 
            placeholder="请选择质检时间" 
            v-decorator="['qualityInspectionTime', validatorRules.qualityInspectionTime]" 
            :show-time="true" 
            date-format="YYYY-MM-DD HH:mm:ss" 
            style="width: 100%">
          </j-date>
        </a-form-item>
        <a-form-item label="上传附件" :labelCol="labelCol" :wrapperCol="wrapperCol">
          <j-upload v-model="fileList" bizPath="dealer"></j-upload>
          <div style="color: #999; margin-top: 8px;">支持多文件上传，可上传质检报告、检测照片等</div>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
  import { httpAction, getAction } from "@/api/manage"
  import JDate from "@/components/jeecg/JDate"
  import JUpload from "@/components/jeecg/JUpload"

  export default {
    name: "QualityCheckModal",
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
        userList: [],
        userPage: 1,
        userPageSize: 20,
        userTotal: 0,
        userLoading: false,
        userSearchValue: '',
        labelCol: {
          xs: { span: 24 },
          sm: { span: 6 }
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 18 }
        },
        validatorRules: {
          qualityInspector: { rules: [{ required: true, message: "请选择质检人!" }] },
          qualityInspectionTime: { rules: [{ required: true, message: "请选择质检时间!" }] }
        },
        url: {
          check: "/order/check",
          userList: "/user/listAll"
        }
      }
    },
    computed: {},
    methods: {
      show(ids) {
        this.ids = ids
        this.form.resetFields()
        this.fileList = ''
        this.userList = []
        this.userPage = 1
        this.userSearchValue = ''
        this.visible = true
        this.initUserList()
      },
      handleUserFocus() {
        if (this.userList.length === 0) {
          this.initUserList()
        }
      },
      handleSearchUser(value) {
        this.userSearchValue = value
        this.userList = []
        this.userPage = 1
        this.initUserList()
      },
      handleUserScroll(e) {
        const { target } = e
        if (target.scrollTop + target.offsetHeight === target.scrollHeight) {
          if (!this.userLoading && this.userList.length < this.userTotal) {
            this.userPage++
            this.initUserList(true)
          }
        }
      },
      initUserList(isLoadMore = false){
        if(this.userLoading) return
        this.userLoading = true
        let params = {
          pageNo: this.userPage,
          pageSize: this.userPageSize
        }
        if(this.userSearchValue) {
          params.userName = this.userSearchValue
        }
        getAction(this.url.userList, params).then((res)=>{
          if(res.code === 200 && res.data){
            const rows = res.data.rows || []
            if(isLoadMore) {
              this.userList = [...this.userList, ...rows]
            } else {
              this.userList = rows
            }
            this.userTotal = res.data.total || rows.length
          }
        }).finally(() => {
          this.userLoading = false
        })
      },
      beforeUpload(file) {
        const isLt10M = file.size / 1024 / 1024 < 10
        if (!isLt10M) {
          this.$message.error('文件大小不能超过10MB!')
          return false
        }
        return true
      },
      handleOk() {
        const that = this
        this.form.validateFields((err, values) => {
          if (!err) {
            that.confirmLoading = true
            let payload = {
              ids: this.ids.join(","),
              qualityInspector: values.qualityInspector,
              qualityInspectionTime: values.qualityInspectionTime,
              fileName: this.fileList
            }
            httpAction(this.url.check, payload, "post").then((res) => {
              if (res.code === 200) {
                const msg = res.data.msg || res.data.message || '质检完成'
                that.$message.success(msg)
                that.$emit("ok")
                that.close()
              } else {
                const errorMsg = res.message || res.data.message || '质检失败'
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
