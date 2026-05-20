<template>
  <div ref="container">
    <a-modal
      :title="title"
      :width="800"
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
      style="top:15%;height: 60%;">
      <template slot="footer">
        <a-button key="back" v-if="isReadOnly" @click="handleCancel">
          取消
        </a-button>
      </template>
      <a-spin :spinning="confirmLoading">
        <a-form :form="form" id="dictTypeModal">
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="字典名称">
            <a-input placeholder="请输入字典名称" v-decorator.trim="[ 'dictName', validatorRules.dictName]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="字典类型">
            <a-input placeholder="请输入字典类型" v-decorator.trim="[ 'dictType', validatorRules.dictType]" :readOnly="!!model.dictId" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="状态">
            <a-select placeholder="请选择状态" v-decorator="[ 'status', validatorRules.status]">
              <a-select-option value="0">正常</a-select-option>
              <a-select-option value="1">停用</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="备注">
            <a-textarea :rows="3" placeholder="请输入备注" v-decorator="[ 'remark' ]" />
          </a-form-item>
        </a-form>
      </a-spin>
    </a-modal>
  </div>
</template>
<script>
  import pick from 'lodash.pick'
  import { addDictType, editDictType } from '@/api/api'
  import { autoJumpNextInput } from '@/utils/util'
  import { mixinDevice } from '@/utils/mixin'
  export default {
    name: "DictTypeModal",
    mixins: [mixinDevice],
    data () {
      return {
        title: "操作",
        visible: false,
        model: {},
        isReadOnly: false,
        labelCol: {
          xs: { span: 24 },
          sm: { span: 5 },
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 16 },
        },
        confirmLoading: false,
        form: this.$form.createForm(this),
        validatorRules: {
          dictName: {
            rules: [
              { required: true, message: '请输入字典名称!' },
              { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
            ]
          },
          dictType: {
            rules: [
              { required: true, message: '请输入字典类型!' },
              { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
            ]
          },
          status: {
            rules: [
              { required: true, message: '请选择状态!' }
            ]
          }
        }
      }
    },
    methods: {
      add () {
        this.edit({});
      },
      edit (record) {
        this.form.resetFields();
        this.model = Object.assign({}, record);
        this.visible = true;
        this.$nextTick(() => {
          this.form.setFieldsValue(pick(this.model, 'dictName', 'dictType', 'status', 'remark'))
          autoJumpNextInput('dictTypeModal')
        });
      },
      close () {
        this.$emit('close');
        this.visible = false;
      },
      handleOk () {
        const that = this;
        this.form.validateFields((err, values) => {
          if (!err) {
            that.confirmLoading = true;
            let formData = Object.assign(this.model, values);
            let obj;
            if (!this.model.dictId) {
              obj = addDictType(formData);
            } else {
              obj = editDictType(formData);
            }
            obj.then((res) => {
              if (res.code === 200) {
                that.$emit('ok');
              } else {
                that.$message.warning(res.data.message);
              }
            }).finally(() => {
              that.confirmLoading = false;
              that.close();
            })
          }
        })
      },
      handleCancel () {
        this.close()
      }
    }
  }
</script>
<style scoped>
</style>
