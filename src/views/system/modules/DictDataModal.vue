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
        <a-form :form="form" id="dictDataModal">
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="字典标签">
            <a-input placeholder="请输入字典标签" v-decorator.trim="[ 'dictLabel', validatorRules.dictLabel]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="字典键值">
            <a-input placeholder="请输入字典键值" v-decorator.trim="[ 'dictValue', validatorRules.dictValue]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="字典排序">
            <a-input-number placeholder="请输入排序" v-decorator="[ 'dictSort', validatorRules.dictSort]" style="width: 100%" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="状态">
            <a-select placeholder="请选择状态" v-decorator="[ 'status', validatorRules.status]">
              <a-select-option value="1">正常</a-select-option>
              <a-select-option value="0">停用</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="是否默认">
            <a-select placeholder="请选择" v-decorator="[ 'isDefault']">
              <a-select-option value="N">否</a-select-option>
              <a-select-option value="Y">是</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="表格回显样式">
            <a-select placeholder="请选择样式" v-decorator="[ 'listClass']" allowClear>
              <a-select-option value="default">默认</a-select-option>
              <a-select-option value="primary">主要</a-select-option>
              <a-select-option value="success">成功</a-select-option>
              <a-select-option value="info">信息</a-select-option>
              <a-select-option value="warning">警告</a-select-option>
              <a-select-option value="danger">危险</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="扩展字段1">
            <a-input placeholder="请输入扩展字段1" v-decorator="[ 'otherField1' ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="扩展字段2">
            <a-input placeholder="请输入扩展字段2" v-decorator="[ 'otherField2' ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="扩展字段3">
            <a-input placeholder="请输入扩展字段3" v-decorator="[ 'otherField3' ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="备注">
            <a-textarea :rows="2" placeholder="请输入备注" v-decorator="[ 'remark' ]" />
          </a-form-item>
        </a-form>
      </a-spin>
    </a-modal>
  </div>
</template>
<script>
  import pick from 'lodash.pick'
  import { addDictData, editDictData } from '@/api/api'
  import { autoJumpNextInput } from '@/utils/util'
  import { mixinDevice } from '@/utils/mixin'
  export default {
    name: "DictDataModal",
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
          dictLabel: {
            rules: [
              { required: true, message: '请输入字典标签!' }
            ]
          },
          dictValue: {
            rules: [
              { required: true, message: '请输入字典键值!' }
            ]
          },
          dictSort: {
            rules: [
              { required: true, message: '请输入排序!' }
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
      add (dictType) {
        this.edit({ dictType: dictType });
      },
      edit (record) {
        this.form.resetFields();
        this.model = Object.assign({}, record);
        this.visible = true;
        this.$nextTick(() => {
          this.form.setFieldsValue(pick(this.model, 'dictLabel', 'dictValue', 'dictSort', 'status', 'isDefault', 'listClass', 'otherField1', 'otherField2', 'otherField3', 'remark'))
          autoJumpNextInput('dictDataModal')
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
            if (!this.model.dictCode) {
              obj = addDictData(formData);
            } else {
              obj = editDictData(formData);
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
