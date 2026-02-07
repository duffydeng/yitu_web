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
      style="top:5%;height: 90%;">
      <template slot="footer">
        <a-button key="back" v-if="isReadOnly" @click="handleCancel">
          取消
        </a-button>
      </template>
      <a-spin :spinning="confirmLoading">
        <a-form :form="form" id="dealerModal">
          <a-row class="form-row" :gutter="24">
            <a-col :span="24/2">
              <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="经销商姓名">
                <a-input placeholder="请输入经销商姓名" v-decorator.trim="[ 'name', validatorRules.name]" />
              </a-form-item>
            </a-col>
            <a-col :span="24/2">
              <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="登录用户名">
                <a-input placeholder="请输入登录用户名" v-decorator.trim="[ 'loginName', validatorRules.loginName]" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row class="form-row" :gutter="24">
            <a-col :span="24/2">
              <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="登录密码">
                <a-input-password placeholder="请输入登录密码" v-decorator.trim="[ 'password', model.id ? {} : validatorRules.password]" />
              </a-form-item>
            </a-col>
            <a-col :span="24/2">
              <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="手机号码">
                <a-input placeholder="请输入手机号码" v-decorator.trim="[ 'phonenum', validatorRules.phonenum]" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row class="form-row" :gutter="24">
            <a-col :span="24/2">
              <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="提成比例(%)">
                <a-input-number 
                  style="width:100%" 
                  placeholder="请输入提成比例" 
                  :min="0" 
                  :max="100" 
                  :precision="2"
                  v-decorator.trim="[ 'commissionDecimal', validatorRules.commissionDecimal]" />
              </a-form-item>
            </a-col>
            <a-col :span="24/2">
              <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="状态">
                <a-select v-decorator="[ 'status', validatorRules.status]" placeholder="请选择状态">
                  <a-select-option :value="0">正常</a-select-option>
                  <a-select-option :value="2">封禁</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row class="form-row" :gutter="24">
            <a-col :span="24/2">
              <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="父经销商">
                <a-select 
                  v-decorator="[ 'parentId' ]" 
                  placeholder="请选择父经销商"
                  allow-clear
                  showSearch
                  optionFilterProp="children">
                  <a-select-option v-for="dealer in parentDealerList" :key="dealer.id" :value="dealer.id">
                    {{ dealer.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="24/2">
              <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="是否二级经销商">
                <a-select v-decorator="[ 'twoLevelDealerIs', validatorRules.twoLevelDealerIs]" placeholder="请选择">
                  <a-select-option :value="0">否</a-select-option>
                  <a-select-option :value="1">是</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row class="form-row" :gutter="24">
            <a-col :span="24">
              <a-form-item :labelCol="labelColSpan" :wrapperCol="wrapperColSpan" label="经销商特色">
                <a-textarea :rows="3" placeholder="请输入经销商特色" v-decorator.trim="[ 'feature' ]" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row class="form-row" :gutter="24">
            <a-col :span="24">
              <a-form-item :labelCol="labelColSpan" :wrapperCol="wrapperColSpan" label="描述信息">
                <a-textarea :rows="3" placeholder="请输入描述信息" v-decorator.trim="[ 'description' ]" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row class="form-row" :gutter="24">
            <a-col :span="24">
              <a-form-item :labelCol="labelColSpan" :wrapperCol="wrapperColSpan" label="备注">
                <a-textarea :rows="2" placeholder="请输入备注" v-decorator.trim="[ 'remark' ]" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-spin>
    </a-modal>
  </div>
</template>

<script>
  import pick from 'lodash.pick'
  import { getAction, postAction, deleteAction } from '@/api/manage'
  import { validateDuplicateValue } from '@/utils/util'

  export default {
    name: "DealerModal",
    data () {
      return {
        title:"操作",
        visible: false,
        model: {},
        isReadOnly: false,
        labelCol: {
          xs: { span: 24 },
          sm: { span: 6 },
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 16 },
        },
        labelColSpan: {
          xs: { span: 24 },
          sm: { span: 3 },
        },
        wrapperColSpan: {
          xs: { span: 24 },
          sm: { span: 20 },
        },
        confirmLoading: false,
        form: this.$form.createForm(this),
        validatorRules: {
          name: {
            rules: [
              { required: true, message: '请输入经销商姓名!' },
              { max: 50, message: '长度不能超过50个字符!' }
            ]
          },
          loginName: {
            rules: [
              { required: true, message: '请输入登录用户名!' },
              { max: 50, message: '长度不能超过50个字符!' },
              { validator: this.validateLoginName }
            ]
          },
          password: {
            rules: [
              { required: true, message: '请输入登录密码!' },
              { min: 6, message: '密码长度不能少于6位!' }
            ]
          },
          phonenum: {
            rules: [
              { required: true, message: '请输入手机号码!' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码!' }
            ]
          },
          commissionDecimal: {
            rules: [
              { required: true, message: '请输入提成比例!' }
            ]
          },
          status: {
            rules: [
              { required: true, message: '请选择状态!' }
            ]
          },
          twoLevelDealerIs: {
            rules: [
              { required: true, message: '请选择是否二级经销商!' }
            ]
          }
        },
        parentDealerList: [],
        url: {
          add: "/dealer/add",
          edit: "/dealer/edit",
          checkLoginName: "/dealer/checkLoginName"
        }
      }
    },
    created () {
      this.loadParentDealerList()
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
          this.form.setFieldsValue(pick(this.model,'name','loginName','password','phonenum','commissionDecimal',
            'status','description','remark','feature','weixinOpenId','parentId','twoLevelDealerIs'));
        });
      },
      close () {
        this.$emit('close');
        this.visible = false;
      },
      handleOk () {
        const that = this;
        // 触发表单验证
        this.form.validateFields((err, values) => {
          if (!err) {
            that.confirmLoading = true;
            let httpurl = '';
            let method = '';
            if(!this.model.id){
              httpurl+=this.url.add;
              method = 'post';
            }else{
              httpurl+=this.url.edit;
               method = 'put';
            }
            let formData = Object.assign(this.model, values);
            console.log("表单提交数据",formData)
            postAction(httpurl,formData,method).then((res)=>{
              if(res.success){
                that.$message.success(res.message);
                that.$emit('ok');
              }else{
                that.$message.warning(res.message);
              }
            }).finally(() => {
              that.confirmLoading = false;
            })
          }
        })
      },
      handleCancel () {
        this.close()
      },
      validateLoginName(rule, value, callback) {
        if (!value) {
          callback()
        } else {
          var params = {
            tableName: 'jsh_dealer',
            fieldName: 'login_name',
            fieldVal: value,
            dataId: this.model.id
          }
          validateDuplicateValue(this.url.checkLoginName, params).then((res) => {
            if (res.success) {
              callback()
            } else {
              callback(res.message)
            }
          })
        }
      },
      loadParentDealerList() {
        let params = {
          pageSize: 1000,
          status: 0
        }
        getAction('/dealer/list', params).then(res => {
          if (res.code === 200) {
            this.parentDealerList = res.data.rows || []
          }
        })
      },
      isDesktop() {
        return window.innerWidth > 992;
      },
      wrapClassNameInfo() {
        return this.isDesktop() ? 'jeecg-modal-custom-info' : '';
      }
    }
  }
</script>

<style scoped>
  .form-row {
    margin-bottom: 10px;
  }
</style>