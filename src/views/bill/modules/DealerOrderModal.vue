		<template>
		  <j-modal
		    :title="title"
		    :width="1200"
		    :visible="visible"
		    :confirmLoading="confirmLoading"
		    switchFullscreen
		    @ok="handleOk"
		    @cancel="handleCancel"
		    cancelText="关闭">
		    <a-spin :spinning="confirmLoading">
		      <a-form :form="form">
		        <a-row>
		          <a-col :span="12">
		            <a-form-item label="订单编号" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-input v-decorator="["orderNumber"]" placeholder="请输入订单编号" :readOnly="true"></a-input>
		            </a-form-item>
		          </a-col>
		          <a-col :span="12">
		            <a-form-item label="产品名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-input v-decorator="["productName"]" placeholder="请输入产品名称"></a-input>
		            </a-form-item>
		          </a-col>
		          <a-col :span="12">
		            <a-form-item label="经销商" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-input v-decorator="["organizationName"]" placeholder="请输入经销商" :readOnly="true"></a-input>
		            </a-form-item>
		          </a-col>
		          <a-col :span="12">
		            <a-form-item label="客户名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-input v-decorator="["customerName"]" placeholder="请输入客户名称"></a-input>
		            </a-form-item>
		          </a-col>
		           <a-col :span="12">
		            <a-form-item label="订单状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-select v-decorator="["orderStatus"]" placeholder="请选择订单状态">
		                <a-select-option value="0">已创建</a-select-option>
		                <a-select-option value="10">待排产</a-select-option>
		                <a-select-option value="20">待完工</a-select-option>
		                <a-select-option value="30">待质检</a-select-option>
		                <a-select-option value="40">待发货</a-select-option>
		                <a-select-option value="45">待揽收</a-select-option>
		                <a-select-option value="50">运输中</a-select-option>
		                <a-select-option value="60">已完成</a-select-option>
		                <a-select-option value="99">已取消</a-select-option>
		              </a-select>
		            </a-form-item>
		          </a-col>
		          <a-col :span="12">
		            <a-form-item label="订单总价" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-input-number v-decorator="["totalPrice"]" placeholder="请输入订单总价" style="width: 100%"></a-input-number>
		            </a-form-item>
		          </a-col>
		          <a-col :span="12">
		            <a-form-item label="定金" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-input-number v-decorator="["deposit"]" placeholder="请输入定金" style="width: 100%"></a-input-number>
		            </a-form-item>
		          </a-col>
		          <a-col :span="12">
		            <a-form-item label="计划完工时间" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <j-date placeholder="请选择计划完工时间" v-decorator="["planFinishTime"]" :show-time="true" date-format="YYYY-MM-DD HH:mm:ss" style="width: 100%"></j-date>
		            </a-form-item>
		          </a-col>
		          <a-col :span="12">
		            <a-form-item label="收货人" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-input v-decorator="["receivePerson"]" placeholder="请输入收货人"></a-input>
		            </a-form-item>
		          </a-col>
		          <a-col :span="12">
		            <a-form-item label="收货电话" :labelCol="labelCol" :wrapperCol="wrapperCol">
		              <a-input v-decorator="["receivePhone"]" placeholder="请输入收货电话"></a-input>
		            </a-form-item>
		          </a-col>
		          <a-col :span="24">
		            <a-form-item label="收货地址" :labelCol="{span: 3}" :wrapperCol="{span: 21}">
		              <a-input v-decorator="["receiveAddressDetail"]" placeholder="请输入收货地址"></a-input>
		            </a-form-item>
		          </a-col>
		        </a-row>
		      </a-form>
		    </a-spin>
		  </j-modal>
		</template>
		
		<script>
		  import { httpAction } from "@/api/manage"
		  import pick from "lodash.pick"
		  import { BillModalMixin } from "../mixins/BillModalMixin"
		  import JDate from "@/components/jeecg/JDate"
		
		  export default {
		    name: "DealerOrderModal",
		    mixins: [BillModalMixin],
		    components: {
		      JDate
		    },
		    data() {
		      return {
		        title: "操作",
		        visible: false,
		        model: {},
		        labelCol: {
		          xs: { span: 24 },
		          sm: { span: 6 }
		        },
		        wrapperCol: {
		          xs: { span: 24 },
		          sm: { span: 16 }
		        },
		        confirmLoading: false,
		        form: this.$form.createForm(this),
		        validatorRules: {},
		        url: {
		          edit: "/order/update",
                  info: "/order/info"
		        }
		      }
		    },
		    methods: {
		      edit(record) {
		        this.form.resetFields()
		        this.model = Object.assign({}, record)
		        this.visible = true

                // 加载详情
                httpAction(this.url.info + "?id=" + record.id, null, "get").then((res)=>{
                  if(res.success){
                    this.model = Object.assign({}, res.data)
                    this.$nextTick(() => {
                        this.form.setFieldsValue(pick(this.model, "orderNumber", "productName", "organizationName", "customerName", "orderStatus", "totalPrice", "deposit", "planFinishTime", "receivePerson", "receivePhone", "receiveAddressDetail"))
                    })
                  } else {
                      this.$message.warning(res.message)
                  }
                })
		      },
		      close() {
		        this.$emit("close")
		        this.visible = false
		      },
		      handleOk() {
		        const that = this
		        this.form.validateFields((err, values) => {
		          if (!err) {
		            that.confirmLoading = true
		            let httpurl = this.url.edit
		            let method = "put"
		            let formData = Object.assign(this.model, values)
		
		            httpAction(httpurl, formData, method).then((res) => {
		              if (res.success) {
		                that.$message.success(res.message)
		                that.$emit("ok")
		              } else {
		                that.$message.warning(res.message)
		              }
		            }).finally(() => {
		              that.confirmLoading = false
		              that.close()
		            })
		          }
		        })
		      },
		      handleCancel() {
		        this.close()
		      }
		    }
		  }
		</script>
		