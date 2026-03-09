<template>
  <j-modal
    :title="title"
    :width="width"
    :visible="visible"
    :confirmLoading="confirmLoading"
    :keyboard="false"
    :forceRender="true"
    v-bind:prefixNo="prefixNo"
    fullscreen
    switchFullscreen
    @cancel="handleCancel"
    :id="prefixNo"
    style="top:20px;height: 95%;">
    <template slot="footer">
      <a-button @click="handleCancel">取消</a-button>
      <a-button v-if="billPrintFlag && isShowPrintBtn" @click="handlePrintPro('组装单')">三联打印-新版</a-button>
      <a-button v-if="billPrintFlag && isShowPrintBtn" @click="handlePrint('组装单')">三联打印</a-button>
      <a-button v-if="checkFlag && isCanCheck" :loading="confirmLoading" @click="handleOkAndCheck">保存并审核</a-button>
      <a-button type="primary" :loading="confirmLoading" @click="handleOk">保存（Ctrl+S）</a-button>
      <!--发起多级审核-->
      <a-button v-if="!checkFlag" @click="handleWorkflow()" type="primary">提交流程</a-button>
    </template>
    <a-spin :spinning="confirmLoading">
      <a-form :form="form">
        <a-row class="form-row" :gutter="24">
          <a-col :lg="6" :md="12" :sm="24">
            <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="单据日期">
              <j-date v-decorator="['operTime', validatorRules.operTime]" :show-time="true"/>
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :sm="24">
            <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="单据编号">
              <a-input placeholder="请输入单据编号" v-decorator.trim="[ 'number', validatorRules.number ]" />
            </a-form-item>
          </a-col>
          <a-col :lg="6" :md="12" :sm="24"></a-col>
          <a-col :lg="6" :md="12" :sm="24"></a-col>
        </a-row>
        <j-editable-table id="billModal"
          :ref="refKeys[0]"
          :loading="materialTable.loading"
          :columns="materialTable.columns"
          :dataSource="materialTable.dataSource"
          :minWidth="minWidth"
          :maxHeight="300"
          :rowNumber="true"
          :rowSelection="true"
          :actionButton="true"
          :rowClassName="getBomRowClass"
          @valueChange="onValueChange"
          @added="onAdded"
          @deleted="onDeleted">
          <template #buttonAfter>
            <a-row :gutter="24" style="float:left;" data-step="4" data-title="扫码录入" data-intro="此功能支持扫码枪扫描商品条码进行录入">
              <a-col v-if="scanStatus" :md="6" :sm="24">
                <a-button @click="scanEnter">扫码录入</a-button>
              </a-col>
              <a-col v-if="!scanStatus" :md="16" :sm="24" style="padding: 0 6px 0 12px">
                <a-input placeholder="请扫描商品条码并回车" v-model="scanBarCode" @pressEnter="scanPressEnter" ref="scanBarCode"/>
              </a-col>
              <a-col v-if="!scanStatus" :md="6" :sm="24" style="padding: 0px">
                <a-button @click="stopScan">收起扫码</a-button>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-button icon="apartment" @click="handleExpandBom" :loading="bomLoading">拆解条码</a-button>
              </a-col>
            </a-row>
          </template>
          <template #depotBatchSet>
            <a-icon type="down" @click="handleBatchSetDepot" />
          </template>
          <template #depotAdd>
            <a-divider v-if="quickBtn.depot" style="margin: 4px 0;" />
            <div v-if="quickBtn.depot" class="dropdown-btn" @click="addDepot"><a-icon type="plus" /> 新增</div>
            <div class="dropdown-btn" @mousedown="e => e.preventDefault()" @click="initDepot"><a-icon type="reload" /> 刷新</div>
          </template>
        </j-editable-table>
        <a-row class="form-row" :gutter="24">
          <a-col :lg="24" :md="24" :sm="24">
            <a-form-item :labelCol="labelCol" :wrapperCol="{xs: { span: 24 },sm: { span: 24 }}" label="">
              <a-textarea :rows="1" placeholder="请输入备注" v-decorator="[ 'remark' ]" style="margin-top:8px;"/>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row class="form-row" :gutter="24">
          <a-col :lg="6" :md="12" :sm="24">
            <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="附件">
              <j-upload v-model="fileList" bizPath="bill"></j-upload>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-spin>
    <depot-modal ref="depotModalForm" @ok="depotModalFormOk"></depot-modal>
    <batch-set-depot ref="batchSetDepotModalForm" @ok="batchSetDepotModalFormOk"></batch-set-depot>
    <workflow-iframe ref="modalWorkflow" @ok="workflowModalFormOk"></workflow-iframe>
    <bill-print-iframe ref="modalPrint"></bill-print-iframe>
    <bill-print-pro-iframe ref="modalPrintPro"></bill-print-pro-iframe>
  </j-modal>
</template>
<script>
  import pick from 'lodash.pick'
  import DepotModal from '../../system/modules/DepotModal'
  import BatchSetDepot from '../dialog/BatchSetDepot'
  import WorkflowIframe from '@/components/tools/WorkflowIframe'
  import BillPrintIframe from '../dialog/BillPrintIframe'
  import BillPrintProIframe from '../dialog/BillPrintProIframe'
  import { FormTypes } from '@/utils/JEditableTableUtil'
  import { JEditableTableMixin } from '@/mixins/JEditableTableMixin'
  import { BillModalMixin } from '../mixins/BillModalMixin'
  import { getAction } from '@/api/manage'
  import { getBomList } from '@/api/api'
  import { getMpListShort } from "@/utils/util"
  import JUpload from '@/components/jeecg/JUpload'
  import JDate from '@/components/jeecg/JDate'
  import Vue from 'vue'
  export default {
    name: "AssembleFormModal",
    mixins: [JEditableTableMixin, BillModalMixin],
    components: {
      DepotModal,
      BatchSetDepot,
      WorkflowIframe,
      BillPrintIframe,
      BillPrintProIframe,
      JUpload,
      JDate
    },
    data () {
      return {
        title:"操作",
        width: '1600px',
        moreStatus: false,
        // 新增时子表默认添加几行空数据
        addDefaultRowNum: 1,
        visible: false,
        operTimeStr: '',
        prefixNo: 'ZZD',
        fileList:[],
        model: {},
        labelCol: {
          xs: { span: 24 },
          sm: { span: 8 },
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 16 },
        },
        refKeys: ['materialDataTable', ],
        activeKey: 'materialDataTable',
        materialTable: {
          loading: false,
          dataSource: [],
          columns: [
            { title: '商品类型',key: 'mType',width:'7%', type: FormTypes.normal },
            { title: '仓库名称', key: 'depotId', width: '8%', type: FormTypes.select, placeholder: '请选择${title}', options: [],
              allowSearch:true, validateRules: [{ required: true, message: '${title}不能为空' }]
            },
            { title: '条码', key: 'barCode', width: '12%', type: FormTypes.popupJsh, kind: 'material', multi: true,
              validateRules: [{ required: true, message: '${title}不能为空' }]
            },
            { title: '名称', key: 'name', width: '10%', type: FormTypes.normal },
            { title: '规格', key: 'standard', width: '9%', type: FormTypes.normal },
            { title: '型号', key: 'model', width: '9%', type: FormTypes.normal },
            { title: '颜色', key: 'color', width: '5%', type: FormTypes.normal },
            { title: '品牌', key: 'brand', width: '6%', type: FormTypes.normal },
            { title: '制造商', key: 'mfrs', width: '6%', type: FormTypes.normal },
            { title: '扩展1', key: 'otherField1', width: '4%', type: FormTypes.normal },
            { title: '扩展2', key: 'otherField2', width: '4%', type: FormTypes.normal },
            { title: '扩展3', key: 'otherField3', width: '4%', type: FormTypes.normal },
            { title: '库存', key: 'stock', width: '5%', type: FormTypes.normal },
            { title: '单位', key: 'unit', width: '4%', type: FormTypes.normal },
            { title: '多属性', key: 'sku', width: '4%', type: FormTypes.normal },
            { title: '数量', key: 'operNumber', width: '5%', type: FormTypes.inputNumber,
              validateRules: [{ required: true, message: '${title}不能为空' }]
            },
            { title: '单价', key: 'unitPrice', width: '5%', type: FormTypes.inputNumber },
            { title: '自定义费用', key: 'spcPrice', width: '6%', type: FormTypes.inputNumber },
            { title: '金额', key: 'allPrice', width: '5%', type: FormTypes.inputNumber },
            { title: '备注', key: 'remark', width: '5%', type: FormTypes.input }
          ]
        },
        bomLoading: false,
        confirmLoading: false,
        validatorRules:{
          operTime:{
            rules: [
              { required: true, message: '请输入单据日期!' }
            ]
          },
          number:{
            rules: [
              { required: true, message: '请输入单据编号!' }
            ]
          },
          type:{
            rules: [
              { required: true, message: '请选择类型!' }
            ]
          }
        },
        url: {
          add: '/depotHead/addDepotHeadAndDetail',
          edit: '/depotHead/updateDepotHeadAndDetail',
          detailList: '/depotItem/getDetailList'
        }
      }
    },
    created () {
    },
    methods: {
      //调用完edit()方法之后会自动调用此方法
      editAfter() {
        this.billStatus = '0'
        this.currentSelectDepotId = ''
        this.changeColumnHide()
        if (this.action === 'add') {
          this.addInit(this.prefixNo)
          this.fileList = []
        } else {
          this.model.operTime = this.model.operTimeStr
          this.fileList = this.model.fileName
          this.$nextTick(() => {
            this.form.setFieldsValue(pick(this.model,'organId', 'operTime', 'number', 'remark',
              'discount','discountMoney','discountLastMoney','otherMoney','accountId','changeAmount'))
          });
          // 加载子表数据
          let params = {
            headerId: this.model.id,
            mpList: getMpListShort(Vue.ls.get('materialPropertyList')),  //扩展属性
            linkType: 'basic'
          }
          let url = this.url.detailList;
          this.requestSubTableData(url, params, this.materialTable);
        }
        //复制新增单据-初始化单号和日期
        if(this.action === 'copyAdd') {
          this.model.id = ''
          this.model.tenantId = ''
          this.copyAddInit(this.prefixNo)
        }
        this.initSystemConfig()
        this.initDepot()
        this.initPlatform()
        this.initQuickBtn()
        this.handleChangeOtherField()
      },
      //提交单据时整理成formData
      classifyIntoFormData(allValues) {
        let totalPrice = 0
        let billMain = Object.assign(this.model, allValues.formValue)
        let detailArr = allValues.tablesValue[0].values || []
        billMain.type = '其它'
        billMain.subType = '组装单'
        for(let item of detailArr){
          item.spcPrice = item.spcPrice ? item.spcPrice-0 : 0
          item.operNumber = item.operNumber ? item.operNumber-0 : 0
          item.unitPrice = item.unitPrice ? item.unitPrice-0 : 0
          item.allPrice = (item.operNumber*item.unitPrice + item.spcPrice).toFixed(2)-0
          totalPrice += item.allPrice-0
        }
        billMain.totalPrice = totalPrice
        if(this.fileList && this.fileList.length > 0) {
          billMain.fileName = this.fileList
        } else {
          billMain.fileName = ''
        }
        if(this.model.id){
          billMain.id = this.model.id
        }
        billMain.status = this.billStatus
        return {
          info: JSON.stringify(billMain),
          rows: JSON.stringify(detailArr),
        }
      },
      // hasBom=1 的行标红
      getBomRowClass(record) {
        return record && record.hasBom == 1 ? 'tr-has-bom' : ''
      },
      // 拆解条码：取表格第一行的条码，调 getBomList 接口，将子件列表填充到表格
      handleExpandBom() {
        let that = this
        this.$refs[this.refKeys[0]].getValues((error, values) => {
          if (error) return
          // 找第一行有条码的组合件条码
          let mainBarCode = ''
          for (let i = 0; i < values.length; i++) {
            if (values[i].barCode) {
              mainBarCode = values[i].barCode
              break
            }
          }
          if (!mainBarCode) {
            that.$message.warning('请先在表格中填入组合件条码！')
            return
          }
          that.bomLoading = true
          getBomList({ barCode: mainBarCode }).then((res) => {
            if (res && res.code === 200) {
              let bomData = res.data.rows || res.data
              if (!bomData || bomData.length === 0) {
                that.$message.warning('该条码暂无 BOM 子件信息！')
                return
              }
              // 获取当前默认仓库
              getAction('/depot/findDepotByCurrentUser').then((depotRes) => {
                let defaultDepotId = ''
                if (depotRes && depotRes.code === 200) {
                  let arr = depotRes.data
                  if (arr.length === 1) {
                    defaultDepotId = arr[0].id + ''
                  } else {
                    for (let i = 0; i < arr.length; i++) {
                      if (arr[i].isDefault) {
                        defaultDepotId = arr[i].id + ''
                        break
                      }
                    }
                  }
                }
                // 构造新数据行：第一行为组合件（保留原第一行），后续为子件
                let newRows = []
                // 保留组合件行（第一行）
                if (values.length > 0 && values[0].barCode) {
                  let mainRow = Object.assign({}, values[0])
                  let hasBom = mainRow.hasBom
                  mainRow.mType = (hasBom == 1 || hasBom == '1') ? '组装件' : '普通子件'
                  mainRow.spcPrice = mainRow.spcPrice ? mainRow.spcPrice-0 : 0
                  mainRow.operNumber = mainRow.operNumber ? mainRow.operNumber-0 : 0
                  mainRow.unitPrice = mainRow.unitPrice ? mainRow.unitPrice-0 : 0
                  mainRow.allPrice = (mainRow.operNumber*mainRow.unitPrice + mainRow.spcPrice).toFixed(2)-0
                  newRows.push(mainRow)
                }
                // 追加子件行
                for (let i = 0; i < bomData.length; i++) {
                  let item = bomData[i]
                  let operNumber = item.operNumber || item.num || 1
                  let unitPrice = item.unitPrice || item.billPrice || item.purchaseDecimal || 0
                  let spcPrice = item.spcPrice || 0
                  newRows.push({
                    mType: (item.hasBom == 1 || item.hasBom == '1') ? '组装件' : '普通子件',
                    depotId: defaultDepotId || (values[0] && values[0].depotId) || '',
                    barCode: item.mBarCode || item.barCode || '',
                    name: item.name || '',
                    standard: item.standard || '',
                    model: item.model || '',
                    color: item.color || '',
                    brand: item.brand || '',
                    mfrs: item.mfrs || '',
                    otherField1: item.otherField1 || '',
                    otherField2: item.otherField2 || '',
                    otherField3: item.otherField3 || '',
                    stock: item.stock || '',
                    unit: item.unit || item.commodityUnit || '',
                    sku: item.sku || '',
                    hasBom: item.hasBom,
                    operNumber: operNumber,
                    unitPrice: unitPrice,
                    spcPrice: spcPrice,
                    allPrice: (operNumber*unitPrice + spcPrice).toFixed(2)-0,
                    remark: item.remark || ''
                  })
                }
                that.materialTable.dataSource = newRows
                that.$message.success('拆解成功，共填入 ' + bomData.length + ' 条子件！')
              })
            } else {
              that.$message.warning((res && res.message) || '拆解失败，请检查接口！')
            }
          }).finally(() => {
            that.bomLoading = false
          })
        })
      },
      onAdded(event) {
        const { row, target } = event
        getAction('/depot/findDepotByCurrentUser').then((res) => {
          if (res.code === 200) {
            let arr = res.data
            for (let i = 0; i < arr.length; i++) {
              if(arr[i].isDefault){
                target.setValues([{rowKey: row.id, values: {depotId: arr[i].id+''}}])
              }
            }
          }
        })
        if(target.rows.length>=2) {
          target.setValues([{rowKey: row.id, values: {mType: '普通子件', spcPrice: 0}}])
        } else {
          target.setValues([{rowKey: row.id, values: {mType: '组装件', spcPrice: 0}}])
        }
      }
    }
  }
</script>
<style scoped>
  >>> .tr-has-bom .td {
    color: #f5222d;
  }
</style>
