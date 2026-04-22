<template>
  <div ref="container">
    <a-modal
      :title="title"
      :width="660"
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
          <!-- 题目编码 -->
          <a-form-item label="题目编码">
            <a-input
              placeholder="请输入题目编码，如 Q1、Q2"
              v-decorator="['questionCode', { rules: [{ required: true, message: '请输入题目编码!' }, { max: 50, message: '最多50个字符' }] }]"
            />
          </a-form-item>

          <!-- 题目名称 -->
          <a-form-item label="题目名称">
            <a-input
              placeholder="请输入题目名称"
              v-decorator="['questionName', { rules: [{ required: true, message: '请输入题目名称!' }, { max: 200, message: '最多200个字符' }] }]"
            />
          </a-form-item>

          <!-- 题目类型 -->
          <a-form-item label="题目类型">
            <a-select
              placeholder="请选择题目类型"
              v-decorator="['questionType', { initialValue: 1, rules: [{ required: true, message: '请选择题目类型!' }] }]"
              @change="onQuestionTypeChange"
            >
              <a-select-option :value="1">单选</a-select-option>
              <a-select-option :value="2">多选</a-select-option>
              <a-select-option :value="3">文本</a-select-option>
              <a-select-option :value="4">评分</a-select-option>
              <a-select-option :value="5">日期</a-select-option>
            </a-select>
          </a-form-item>

          <!-- 选项配置（单选/多选时显示） -->
          <a-form-item v-if="showOptions" label="选项配置">
            <div v-for="(opt, idx) in optionList" :key="idx" style="display:flex;align-items:center;margin-bottom:6px;">
              <a-input
                v-model="optionList[idx]"
                :placeholder="'选项' + (idx + 1)"
                style="flex:1;"
                size="small"
              />
              <a-button
                type="link"
                icon="minus-circle"
                style="color:#f5222d;padding:0 4px;"
                @click="removeOption(idx)"
                v-if="optionList.length > 1"
              />
            </div>
            <a-button type="dashed" icon="plus" size="small" @click="addOption">添加选项</a-button>
          </a-form-item>

          <!-- 显示顺序 -->
          <a-form-item label="显示顺序">
            <a-input-number
              style="width:100%"
              :min="0"
              placeholder="请输入显示顺序"
              v-decorator="['sortOrder', { initialValue: 0 }]"
            />
          </a-form-item>

          <!-- 是否必填 -->
          <a-form-item label="是否必填">
            <a-radio-group v-decorator="['isRequired', { initialValue: 0 }]">
              <a-radio :value="0">否</a-radio>
              <a-radio :value="1">是</a-radio>
            </a-radio-group>
          </a-form-item>

          <!-- 状态 -->
          <a-form-item label="状态">
            <a-radio-group v-decorator="['status', { initialValue: 1 }]">
              <a-radio :value="1">启用</a-radio>
              <a-radio :value="0">禁用</a-radio>
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

  export default {
    name: 'SurveyQuestionModal',
    mixins: [mixinDevice],
    data() {
      return {
        title: '新增问卷调查项',
        visible: false,
        confirmLoading: false,
        model: {},
        optionList: [''],
        showOptions: true,
        labelCol: { xs: { span: 24 }, sm: { span: 6 } },
        wrapperCol: { xs: { span: 24 }, sm: { span: 16 } },
        form: this.$form.createForm(this),
        url: {
          add: '/surveyQuestion/add',
          edit: '/surveyQuestion/update'
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
        // 初始化选项列表
        const qType = record.questionType || 1
        this.showOptions = qType === 1 || qType === 2
        if (this.showOptions) {
          const opts = this.parseOptions(record.options)
          this.optionList = opts.length > 0 ? opts : ['']
        } else {
          this.optionList = ['']
        }
        this.$nextTick(() => {
          this.form.setFieldsValue(pick(this.model, 'questionCode', 'questionName', 'questionType', 'sortOrder', 'isRequired', 'status'))
        })
      },
      close() {
        this.$emit('close')
        this.visible = false
      },
      handleCancel() {
        this.close()
      },
      onQuestionTypeChange(val) {
        this.showOptions = val === 1 || val === 2
        if (this.showOptions && this.optionList.length === 0) {
          this.optionList = ['']
        }
      },
      addOption() {
        this.optionList.push('')
      },
      removeOption(idx) {
        this.optionList.splice(idx, 1)
      },
      parseOptions(val) {
        if (!val) return []
        try {
          const arr = typeof val === 'string' ? JSON.parse(val) : val
          return Array.isArray(arr) ? arr : []
        } catch (e) {
          return []
        }
      },
      handleOk() {
        const that = this
        this.form.validateFields((err, values) => {
          if (!err) {
            that.confirmLoading = true
            const formData = Object.assign({}, this.model, values)
            // 处理选项配置
            if (formData.questionType === 1 || formData.questionType === 2) {
              const validOpts = that.optionList.filter(o => o && o.trim() !== '')
              if (validOpts.length === 0) {
                that.$message.warning('单选/多选类型至少需要填写一个选项！')
                that.confirmLoading = false
                return
              }
              formData.options = JSON.stringify(validOpts)
            } else {
              formData.options = null
            }
            const url = formData.id ? that.url.edit : that.url.add
            postAction(url, formData).then(res => {
              if (res.code === 200) {
                that.$message.success('保存成功')
                that.$emit('ok')
                that.close()
              } else {
                that.$message.warning(res.message || '保存失败')
              }
            }).finally(() => {
              that.confirmLoading = false
            })
          }
        })
      }
    }
  }
</script>

<style scoped>
</style>
