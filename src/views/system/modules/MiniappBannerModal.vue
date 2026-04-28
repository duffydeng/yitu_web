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

          <!-- 标题 -->
          <a-form-item label="标题">
            <a-input
              placeholder="请输入标题（可选）"
              v-decorator="['title', { rules: [{ max: 100, message: '最多100个字符' }] }]"
            />
          </a-form-item>

          <!-- 图片 -->
          <a-form-item label="图片">
            <j-image-upload v-model="imageUrl" bizPath="banner" text="上传图片"></j-image-upload>
            <div style="color:#999;font-size:12px;margin-top:4px;">建议上传尺寸 750×300px 的横幅图片</div>
          </a-form-item>

          <!-- 跳转链接 -->
          <a-form-item label="跳转链接">
            <a-input
              placeholder="请输入跳转链接（可选）"
              v-decorator="['linkUrl', { rules: [{ max: 500, message: '最多500个字符' }] }]"
            />
          </a-form-item>

          <!-- 排序 -->
          <a-form-item label="排序">
            <a-input-number
              style="width:100%"
              :min="0"
              placeholder="数字越小越靠前"
              v-decorator="['sortNum', { initialValue: 0 }]"
            />
          </a-form-item>

          <!-- 状态 -->
          <a-form-item label="状态">
            <a-radio-group v-decorator="['status', { initialValue: 1 }]">
              <a-radio :value="1">启用</a-radio>
              <a-radio :value="0">停用</a-radio>
            </a-radio-group>
          </a-form-item>

        </a-form>
      </a-spin>
    </a-modal>
  </div>
</template>

<script>
  import pick from 'lodash.pick'
  import { mixinDevice } from '@/utils/mixin'
  import { postAction } from '@/api/manage'
  import JImageUpload from '@/components/jeecg/JImageUpload'

  export default {
    name: 'MiniappBannerModal',
    mixins: [mixinDevice],
    components: { JImageUpload },
    data() {
      return {
        title: '新增Banner',
        visible: false,
        confirmLoading: false,
        model: {},
        imageUrl: '',
        labelCol: { xs: { span: 24 }, sm: { span: 5 } },
        wrapperCol: { xs: { span: 24 }, sm: { span: 17 } },
        form: this.$form.createForm(this),
        url: {
          add: '/miniappBanner/add',
          edit: '/miniappBanner/update'
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
        this.imageUrl = this.model.imageUrl || ''
        this.visible = true
        this.$nextTick(() => {
          this.form.setFieldsValue(
            pick(this.model, 'title', 'linkUrl', 'sortNum', 'status')
          )
        })
      },
      close() {
        this.$emit('close')
        this.visible = false
        this.imageUrl = ''
      },
      handleCancel() {
        this.close()
      },
      handleOk() {
        const that = this
        this.form.validateFields((err, values) => {
          if (err) return
          if (!that.imageUrl) {
            that.$message.warning('请上传Banner图片！')
            return
          }
          that.confirmLoading = true
          const formData = Object.assign({}, this.model, values, { imageUrl: this.imageUrl })
          const url = formData.id ? that.url.edit : that.url.add
          postAction(url, formData).then(res => {
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
