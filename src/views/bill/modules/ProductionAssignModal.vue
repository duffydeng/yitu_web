<template>
  <a-modal
    title="分配排产"
    :width="700"
    :visible="visible"
    :confirmLoading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
    cancelText="关闭">
    <a-spin :spinning="confirmLoading">
      <a-form :form="form" style="padding: 20px 10px;">
        <a-form-item label="排产人" :labelCol="labelCol" :wrapperCol="wrapperCol">
          <a-select
            v-decorator="['productionPerson', validatorRules.productionPerson]"
            placeholder="请选择排产人"
            @focus="initUserList">
            <a-select-option v-for="(item, index) in userList" :key="index" :value="item.dictValue">
              {{ item.dictLabel }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="计划完工时间" :labelCol="labelCol" :wrapperCol="wrapperCol">
          <j-date 
            placeholder="请选择计划完工时间" 
            v-decorator="['planFinishTime', validatorRules.planFinishTime]" 
            :show-time="true" 
            date-format="YYYY-MM-DD HH:mm:ss" 
            style="width: 100%">
          </j-date>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
  import { httpAction, getAction } from "@/api/manage"
  import JDate from "@/components/jeecg/JDate"

  export default {
    name: "ProductionAssignModal",
    components: {
      JDate
    },
    data() {
      return {
        visible: false,
        confirmLoading: false,
        form: this.$form.createForm(this),
        ids: [],
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
          productionPerson: { rules: [{ required: true, message: "请选择排产人!" }] },
          planFinishTime: { rules: [{ required: true, message: "请选择计划完工时间!" }] }
        },
        url: {
          production: "/order/production",
          dictData: "/system/dict/data/listByType"
        }
      }
    },
    created() {
    },
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
        this.visible = true
        this.userList = []
        this.initUserList()
      },
      initUserList() {
        if (this.userList.length > 0) return
        getAction(this.url.dictData, { dictType: 'production_worker' }).then((res) => {
          if (res.code === 200 && res.data) {
            this.userList = res.data.rows || []
          }
        })
      },
      handleOk() {
        const that = this
        this.form.validateFields((err, values) => {
          if (!err) {
            that.confirmLoading = true
            let payload = {
              ids: this.ids.join(","),
              productionPerson: values.productionPerson,
              planFinishTime: values.planFinishTime
            }
            httpAction(this.url.production, payload, "post").then((res) => {
              if (res.code === 200) {
                const msg = res.data.msg || res.data.message || '分配排产成功'
                that.$message.success(msg)
                that.$emit("ok")
                that.close()
              } else {
                const errorMsg = res.message || res.data.message || '分配排产失败'
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
