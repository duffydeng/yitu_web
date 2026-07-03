<template>
  <div ref="container">
    <a-modal
      :title="title"
      :width="600"
      :visible="visible"
      :confirmLoading="confirmLoading"
      :getContainer="() => $refs.container"
      :maskStyle="{'top':'93px','left':'154px'}"
      :wrapClassName="wrapClassNameInfo()"
      :mask="isDesktop()"
      :maskClosable="false"
      @ok="handleOk"
      @cancel="handleCancel"
      cancelText="取消"
      okText="保存"
      style="top:80px;">
      <a-spin :spinning="confirmLoading">
        <a-form :form="form" :label-col="labelCol" :wrapper-col="wrapperCol">

          <a-form-item label="昵称">
            <a-input
              placeholder="请输入昵称"
              v-decorator="['nickname', { rules: [{ max: 50, message: '最多50个字符' }] }]"
            />
          </a-form-item>

          <a-form-item label="真实姓名">
            <a-input
              placeholder="请输入真实姓名"
              v-decorator="['realName', { rules: [{ max: 30, message: '最多30个字符' }] }]"
            />
          </a-form-item>

          <a-form-item label="手机号">
            <a-input
              placeholder="请输入手机号"
              v-decorator="['phone', { rules: [{ max: 20, message: '最多20个字符' }] }]"
            />
          </a-form-item>

          <a-form-item label="角色">
            <a-radio-group v-decorator="['role', { initialValue: 1 }]">
              <a-radio :value="1">普通用户</a-radio>
              <a-radio :value="2">经销商</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item label="性别">
            <a-radio-group v-decorator="['gender', { initialValue: 1 }]">
              <a-radio :value="1">男</a-radio>
              <a-radio :value="2">女</a-radio>
              <a-radio :value="0">未知</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item label="年龄">
            <a-input-number
              style="width:100%"
              :min="0"
              :max="150"
              placeholder="请输入年龄"
              v-decorator="['age']"
            />
          </a-form-item>

          <a-form-item label="身高(cm)">
            <a-input-number
              style="width:100%"
              :min="0"
              :precision="1"
              placeholder="请输入身高"
              v-decorator="['heightCm']"
            />
          </a-form-item>

          <a-form-item label="体重(kg)">
            <a-input-number
              style="width:100%"
              :min="0"
              :precision="1"
              placeholder="请输入体重"
              v-decorator="['weightKg']"
            />
          </a-form-item>

        </a-form>
      </a-spin>
    </a-modal>
  </div>
</template>

<script>
  import pick from 'lodash.pick'
  import { mixinDevice } from '@/utils/mixin'
  import { postAction, putAction } from '@/api/manage'

  export default {
    name: 'WechatUserModal',
    mixins: [mixinDevice],
    data() {
      return {
        title: '新增微信用户',
        visible: false,
        confirmLoading: false,
        model: {},
        labelCol: { xs: { span: 24 }, sm: { span: 5 } },
        wrapperCol: { xs: { span: 24 }, sm: { span: 17 } },
        form: this.$form.createForm(this),
        url: {
          add: '/wechatUser/add',
          edit: '/wechatUser/update'
        }
      }
    },
    methods: {
      add() {
        this.edit({})
      },
      edit(record) {
        this.form.resetFields()
        this.model = Object.assign({}, record)
        this.visible = true
        this.$nextTick(() => {
          this.form.setFieldsValue(
            pick(this.model, 'nickname', 'realName', 'phone', 'role', 'gender', 'age', 'heightCm', 'weightKg')
          )
        })
      },
      close() {
        this.$emit('close')
        this.visible = false
      },
      handleCancel() {
        this.close()
      },
      handleOk() {
        const that = this
        this.form.validateFields((err, values) => {
          if (err) return
          that.confirmLoading = true
          const formData = Object.assign({}, this.model, values)
          const url = formData.id ? that.url.edit : that.url.add
          const request = formData.id ? putAction(url, formData) : postAction(url, formData)
          request.then(res => {
            if (res && res.code === 200) {
              that.$message.success('保存成功')
              that.$emit('ok')
              that.close()
            } else {
              that.$message.warning((res && res.message) || '保存失败')
            }
          }).finally(() => {
            that.confirmLoading = false
          })
        })
      }
    }
  }
</script>

<style scoped>
</style>
