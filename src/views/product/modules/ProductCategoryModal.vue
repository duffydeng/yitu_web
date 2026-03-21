<template>
  <div ref="container">
    <a-modal
      :title="title"
      :width="800"
      :visible="visible"
      :confirmLoading="confirmLoading"
      :okButtonProps="{ props: {disabled: disableSubmit} }"
      :getContainer="() => $refs.container"
      :maskStyle="{'top':'93px','left':'154px'}"
      :wrapClassName="wrapClassNameInfo()"
      :mask="isDesktop()"
      :maskClosable="false"
      @ok="handleOk"
      @cancel="handleCancel"
      cancelText="取消"
      okText="保存"
      style="top:100px;height: 50%;">
      <a-spin :spinning="confirmLoading">
        <a-form :form="form">
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="分类名称">
            <a-input placeholder="请输入分类名称" v-decorator.trim="[ 'name', validatorRules.name ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="父级分类">
            <a-select
              placeholder="请选择父级分类"
              v-decorator="[ 'parentId' ]"
              allow-clear
              showSearch
              optionFilterProp="children">
              <a-select-option v-for="item in parentList" :key="item.id" :value="item.id">
                {{ item.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="产品类型">
            <a-select placeholder="请选择产品类型" v-decorator="[ 'productType', validatorRules.productType ]">
              <a-select-option value="商品">商品</a-select-option>
              <a-select-option value="分类">分类</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="图片">
            <j-image-upload v-model="imgUrl" bizPath="product" text="上传" isMultiple></j-image-upload>
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="价格">
            <a-input-number placeholder="请输入价格" :precision="2" :min="0" style="width:100%" v-decorator="[ 'price' ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="父名称">
            <a-input placeholder="请输入父名称" v-decorator="[ 'parentName' ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="自定义1">
            <a-input placeholder="请输入自定义1" v-decorator="[ 'otherField1' ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="自定义2">
            <a-input placeholder="请输入自定义2" v-decorator="[ 'otherField2' ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="自定义3">
            <a-input placeholder="请输入自定义3" v-decorator="[ 'otherField3' ]" />
          </a-form-item>
          <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="自定义4">
            <a-input placeholder="请输入自定义4" v-decorator="[ 'otherField4' ]" />
          </a-form-item>
        </a-form>
      </a-spin>
    </a-modal>
  </div>
</template>

<script>
  import pick from 'lodash.pick'
  import { httpAction, getAction } from '@/api/manage'
  import { mixinDevice } from '@/utils/mixin'
  import JImageUpload from '@/components/jeecg/JImageUpload'

  export default {
    name: 'ProductCategoryModal',
    mixins: [mixinDevice],
    components: { JImageUpload },
    data () {
      return {
        title: '操作',
        visible: false,
        disableSubmit: false,
        model: {},
        imgUrl: '',
        parentList: [],
        labelCol: {
          xs: { span: 24 },
          sm: { span: 5 }
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 16 }
        },
        confirmLoading: false,
        form: this.$form.createForm(this),
        validatorRules: {
          name: { rules: [{ required: true, message: '请输入分类名称!' }] },
          productType: { rules: [{ required: true, message: '请选择产品类型!' }] }
        },
        url: {
          add: '/product/add',
          edit: '/product/edit'
        }
      }
    },
    methods: {
      add () {
        this.edit({})
      },
      edit (record) {
        this.form.resetFields()
        this.model = Object.assign({}, record || {})
        this.imgUrl = this.model.imgUrl || ''
        this.visible = true
        this.loadParentList()
        this.$nextTick(() => {
          this.form.setFieldsValue(pick(this.model, 'name', 'parentId', 'productType', 'price', 'parentName', 'otherField1', 'otherField2', 'otherField3', 'otherField4'))
        })
      },
      loadParentList () {
        getAction('/product/getParentList', {}).then((res) => {
          if (res && res.code === 200) {
            let data = res.data
            if (Array.isArray(data)) {
              this.parentList = data
            } else if (data && Array.isArray(data.rows)) {
              this.parentList = data.rows
            } else {
              this.parentList = []
            }
          } else {
            this.parentList = []
          }
        }).catch(() => {
          this.parentList = []
        })
      },
      close () {
        this.$emit('close')
        this.visible = false
        this.disableSubmit = false
        this.imgUrl = ''
      },
      handleOk () {
        const that = this
        this.form.validateFields((err, values) => {
          if (err) return
          that.confirmLoading = true
          let httpurl = this.model && this.model.id ? this.url.edit : this.url.add
          let method = this.model && this.model.id ? 'put' : 'post'
          let formData = Object.assign({}, this.model, values, { imgUrl: this.imgUrl })
          httpAction(httpurl, formData, method).then((res) => {
            if (res && res.code === 200) {
              that.$message.success((res.data && res.data.message) || '保存成功')
              that.$emit('ok')
              that.close()
            } else {
              that.$message.warning((res && res.data && res.data.message) || (res && res.message) || '保存失败')
            }
          }).finally(() => {
            that.confirmLoading = false
          })
        })
      },
      handleCancel () {
        this.close()
      }
    }
  }
</script>
