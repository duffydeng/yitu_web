<template>
  <j-modal
    :title="title"
    :width="1400"
    :visible="visible"
    :confirmLoading="confirmLoading"
    switchFullscreen
    @ok="handleOk"
    @cancel="handleCancel"
    cancelText="关闭">
    <a-spin :spinning="confirmLoading">
      <a-form :form="form">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="订单编号" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input v-decorator="['orderNumber']" placeholder="请输入订单编号" :readOnly="true"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="经销商" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input v-decorator="['organizationName']" placeholder="请输入经销商" :readOnly="true"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="客户名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input v-decorator="['customerName']" placeholder="请输入客户名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="客户电话" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input v-decorator="['customerPhone']" placeholder="请输入客户电话"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="产品名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input v-decorator="['productName']" placeholder="请输入产品名称"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="订单状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-select v-decorator="['orderStatus']" placeholder="请选择订单状态">
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
          <a-col :span="8">
            <a-form-item label="订单总价" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input-number v-decorator="['totalPrice']" placeholder="请输入订单总价" :precision="2" style="width: 100%"></a-input-number>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="定金" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input-number v-decorator="['deposit']" placeholder="请输入定金" :precision="2" style="width: 100%"></a-input-number>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="冲减库存" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-switch v-decorator="['deductStock', { valuePropName: 'checked' }]" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="计划完工时间" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <j-date placeholder="请选择计划完工时间" v-decorator="['planFinishTime']" :show-time="true" date-format="YYYY-MM-DD HH:mm:ss" style="width: 100%"></j-date>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="售后联系人" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input v-decorator="['afterSaleContact']" placeholder="请输入售后联系人"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="收货人" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input v-decorator="['receivePerson']" placeholder="请输入收货人"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="收货电话" :labelCol="labelCol" :wrapperCol="wrapperCol">
              <a-input v-decorator="['receivePhone']" placeholder="请输入收货电话"></a-input>
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="收货地址" :labelCol="{span: 2}" :wrapperCol="{span: 22}">
              <a-input v-decorator="['receiveAddressDetail']" placeholder="请输入收货地址"></a-input>
            </a-form-item>
          </a-col>
        </a-row>
        
        <!-- 订单明细列表 -->
        <a-divider>订单明细</a-divider>
        <a-table
          :columns="detailColumns"
          :dataSource="detailDataSource"
          :pagination="false"
          bordered
          size="small"
          rowKey="id">
          <template slot="materialName" slot-scope="text, record, index">
            <a-input v-if="editingKey === record.id || record.isNew" v-model="record.materialName" placeholder="请选择物料" @click="selectMaterial(record, index)" :readOnly="true" style="cursor: pointer"/>
            <span v-else>{{ text }}</span>
          </template>
          <template slot="barCode" slot-scope="text, record">
            <a @click="handleBarCodeClick(record)" style="color: #1890ff; cursor: pointer;">{{ text }}</a>
          </template>
          <template slot="version" slot-scope="text, record">
            <a-input v-if="editingKey === record.id || record.isNew" v-model="record.version" placeholder="请输入版本"/>
            <span v-else>{{ text }}</span>
          </template>
          <template slot="qty" slot-scope="text, record">
            <a-input-number v-if="editingKey === record.id || record.isNew" v-model="record.qty" :precision="2" :min="0" style="width: 100%" @change="calculateDetail(record)"/>
            <span v-else>{{ text }}</span>
          </template>
          <template slot="detailPrice" slot-scope="text, record">
            <a-input-number v-if="editingKey === record.id || record.isNew" v-model="record.detailPrice" :precision="2" :min="0" style="width: 100%" @change="calculateDetail(record)"/>
            <span v-else>{{ text }}</span>
          </template>
          <template slot="detailTotalPrice" slot-scope="text, record">
            <span>{{ record.detailTotalPrice }}</span>
          </template>
          <template slot="action" slot-scope="text, record, index">
            <div class="editable-row-operations">
              <span v-if="editingKey === record.id">
                <a @click="save(record)">保存</a>
                <a-divider type="vertical" />
                <a @click="cancel(record)">取消</a>
              </span>
              <span v-else>
                <a :disabled="editingKey !== ''" @click="edit(record)">编辑</a>
                <a-divider type="vertical" />
                <a-popconfirm title="确定删除吗?" @confirm="deleteRow(index)">
                  <a>删除</a>
                </a-popconfirm>
              </span>
            </div>
          </template>
        </a-table>
        <a-button type="dashed" block style="margin-top: 10px" @click="addDetailRow" icon="plus">
          新增明细
        </a-button>
      </a-form>
    </a-spin>
    
    <!-- 物料选择弹窗 -->
    <a-modal
      title="选择物料"
      :width="1000"
      :visible="materialModalVisible"
      @ok="handleMaterialOk"
      @cancel="materialModalVisible = false">
      <a-input-search
        placeholder="请输入条码/名称/规格/型号"
        v-model="materialSearchKey"
        @search="searchMaterial"
        style="margin-bottom: 16px"
      />
      <a-table
        :columns="materialColumns"
        :dataSource="materialList"
        :loading="materialLoading"
        :pagination="materialPagination"
        @change="handleMaterialTableChange"
        rowKey="id"
        :rowSelection="{
          type: 'radio',
          selectedRowKeys: selectedMaterialKeys,
          onChange: onMaterialSelectChange
        }">
      </a-table>
    </a-modal>
    
    <!-- BOM明细弹窗 -->
    <a-modal
      title="BOM明细"
      :width="1200"
      :visible="bomDetailModalVisible"
      @cancel="bomDetailModalVisible = false"
      :footer="null">
      <div v-if="bomDetailRecord" style="margin-bottom: 16px;">
        <a-descriptions :column="3" size="small" bordered>
          <a-descriptions-item label="条码">{{ bomDetailRecord.barCode }}</a-descriptions-item>
          <a-descriptions-item label="名称">{{ bomDetailRecord.materialName }}</a-descriptions-item>
          <a-descriptions-item label="版本">{{ bomDetailRecord.version }}</a-descriptions-item>
        </a-descriptions>
      </div>
      <a-table
        :columns="bomDetailColumns"
        :dataSource="bomDetailDataSource"
        :loading="bomDetailLoading"
        :pagination="bomDetailPagination"
        @change="handleBomDetailTableChange"
        rowKey="id"
        size="small"
        bordered>
      </a-table>
    </a-modal>
  </j-modal>
</template>

<script>
import { getAction, putAction } from "@/api/manage"
import pick from "lodash.pick"
import JDate from "@/components/jeecg/JDate"

export default {
  name: "DealerOrderEditModal",
  components: {
    JDate
  },
    data() {
    return {
      title: "编辑订单",
      visible: false,
      model: {},
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      },
      confirmLoading: false,
      form: this.$form.createForm(this),
      detailDataSource: [],
      editingKey: '',
      cacheData: {},
      currentEditRecord: null,
      currentEditIndex: -1,
      detailColumns: [
        { title: '物料名称', dataIndex: 'materialName', width: 200, scopedSlots: { customRender: 'materialName' }},
        { title: '条码', dataIndex: 'barCode', width: 150, scopedSlots: { customRender: 'barCode' }},
        { title: '版本', dataIndex: 'version', width: 120, scopedSlots: { customRender: 'version' }},
        { title: '分类名称', dataIndex: 'categoryName', width: 120},
        { title: '数量', dataIndex: 'qty', width: 120, scopedSlots: { customRender: 'qty' }},
        { title: '单价', dataIndex: 'detailPrice', width: 120, scopedSlots: { customRender: 'detailPrice' }},
        { title: '总价', dataIndex: 'detailTotalPrice', width: 120, scopedSlots: { customRender: 'detailTotalPrice' }},
        { title: '操作', dataIndex: 'action', width: 150, fixed: 'right', scopedSlots: { customRender: 'action' }}
      ],
      // 物料选择相关
      materialModalVisible: false,
      materialList: [],
      materialLoading: false,
      materialSearchKey: '',
      materialColumns: [
        { title: '条码', dataIndex: 'mBarCode', width: 120 },
        { title: '名称', dataIndex: 'name', width: 160, ellipsis: true },
        { title: '规格', dataIndex: 'standard', width: 100 },
        { title: '型号', dataIndex: 'model', width: 100 },
        { title: '类别', dataIndex: 'categoryName', width: 100 },
        { title: '单位', dataIndex: 'unit', width: 60 }
      ],
      materialPagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      selectedMaterialKeys: [],
      selectedMaterial: null,
      // BOM明细弹窗相关
      bomDetailModalVisible: false,
      bomDetailLoading: false,
      bomDetailDataSource: [],
      bomDetailRecord: null,
      bomDetailColumns: [
        { title: '#', dataIndex: '', key: 'rowIndex', width: 60, align: 'center', customRender: (text, record, index) => index + 1 },
        { title: '条码', dataIndex: 'barCode', width: 120 },
        { title: '名称', dataIndex: 'materialName', width: 200, ellipsis: true },
        { title: '规格', dataIndex: 'standard', width: 120 },
        { title: '型号', dataIndex: 'model', width: 120 },
        { title: '单位', dataIndex: 'unit', width: 80 },
        { title: '数量', dataIndex: 'qty', width: 100 },
        { title: '版本号', dataIndex: 'version', width: 100 },
        { title: '备注', dataIndex: 'remark', width: 150 }
      ],
      bomDetailPagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      url: {
        info: "/order/info",
        update: "/order/update",
        materialList: "/material/list",
        bomList: "/bomList/list"
      }
    }
  },
  methods: {
    edit(record) {
      this.cacheData = { ...record }
      this.editingKey = record.id
    },
    save(record) {
      this.editingKey = ''
      delete record.isNew
    },
    cancel(record) {
      if (record.isNew) {
        const index = this.detailDataSource.findIndex(item => item.id === record.id)
        this.detailDataSource.splice(index, 1)
      } else {
        Object.assign(record, this.cacheData)
        this.editingKey = ''
      }
    },
    addDetailRow() {
      const newData = {
        id: Date.now(),
        isNew: true,
        materialId: undefined,
        materialName: '',
        barCode: '',
        version: '',
        categoryId: undefined,
        categoryName: '',
        qty: 0,
        detailPrice: 0,
        detailTotalPrice: 0
      }
      this.detailDataSource.push(newData)
      this.editingKey = newData.id
    },
    deleteRow(index) {
      this.detailDataSource.splice(index, 1)
    },
    calculateDetail(record) {
      const qty = parseFloat(record.qty) || 0
      const price = parseFloat(record.detailPrice) || 0
      record.detailTotalPrice = (qty * price).toFixed(2)
    },
    selectMaterial(record, index) {
      this.currentEditRecord = record
      this.currentEditIndex = index
      this.materialModalVisible = true
      this.searchMaterial()
    },
    searchMaterial() {
      this.materialLoading = true
      const params = {
        pageNo: this.materialPagination.current,
        pageSize: this.materialPagination.pageSize
      }
      if (this.materialSearchKey) {
        params.materialParam = this.materialSearchKey
      }
      getAction(this.url.materialList, params).then(res => {
        if (res.code === 200) {
          this.materialList = res.data.rows || []
          this.materialPagination.total = res.data.total || 0
        }
      }).finally(() => {
        this.materialLoading = false
      })
    },
    handleMaterialTableChange(pagination) {
      this.materialPagination.current = pagination.current
      this.searchMaterial()
    },
    onMaterialSelectChange(selectedRowKeys, selectedRows) {
      this.selectedMaterialKeys = selectedRowKeys
      this.selectedMaterial = selectedRows[0]
    },
    handleMaterialOk() {
      if (this.selectedMaterial && this.currentEditRecord) {
        this.currentEditRecord.materialId = this.selectedMaterial.id
        this.currentEditRecord.materialName = this.selectedMaterial.name
        this.currentEditRecord.barCode = this.selectedMaterial.mBarCode
        this.currentEditRecord.categoryId = this.selectedMaterial.categoryId
        this.currentEditRecord.categoryName = this.selectedMaterial.categoryName
      }
      this.materialModalVisible = false
      this.selectedMaterialKeys = []
      this.selectedMaterial = null
    },
    show(record) {
      this.visible = true
      this.form.resetFields()
      this.detailDataSource = []
      this.editingKey = ''
      this.confirmLoading = true
      
      getAction(this.url.info, { id: record.id }).then(res => {
        if (res.code === 200 && res.data && res.data.info) {
          this.model = res.data.info
          this.$nextTick(() => {
            this.form.setFieldsValue(pick(this.model, 
              'orderNumber', 'organizationName', 'customerName', 'customerPhone',
              'productName', 'orderStatus', 'totalPrice', 'deposit', 'deductStock',
              'planFinishTime', 'afterSaleContact', 'receivePerson', 'receivePhone',
              'receiveAddressDetail'
            ))
          })
          
          if (res.data.info.orderDetails && res.data.info.orderDetails.length > 0) {
            this.detailDataSource = res.data.info.orderDetails.map(item => ({
              ...item,
              detailTotalPrice: item.detailTotalPrice || (item.qty * item.detailPrice).toFixed(2)
            }))
          }
        } else {
          this.$message.warning(res.message || '加载订单信息失败')
        }
      }).catch(err => {
        this.$message.error('加载订单信息失败：' + err.message)
      }).finally(() => {
        this.confirmLoading = false
      })
    },
    handleOk() {
      const that = this
      if (this.editingKey) {
        this.$message.warning('请先保存正在编辑的明细！')
        return
      }
      
      this.form.validateFields((err, values) => {
        if (!err) {
          if (this.detailDataSource.length === 0) {
            this.$message.warning('请至少添加一条订单明细！')
            return
          }
          
          that.confirmLoading = true
          const formData = {
            ...this.model,
            ...values,
            orderDetails: this.detailDataSource.map(item => {
              const detail = {
                orderId: this.model.id,
                materialId: item.materialId,
                materialName: item.materialName,
                barCode: item.barCode,
                version: item.version,
                categoryId: item.categoryId,
                categoryName: item.categoryName,
                qty: item.qty,
                detailPrice: item.detailPrice,
                detailTotalPrice: item.detailTotalPrice
              }
              // 只有原有的明细才传id，新增的不传id
              if (item.id && item.id < 1000000000000) {
                detail.id = item.id
              }
              return detail
            })
          }

          putAction(this.url.update, formData).then((res) => {
            if (res.code === 200) {
              that.$message.success(res.data.msg || res.data.message || '保存成功')
              that.$emit("ok")
              that.close()
            } else {
              that.$message.warning(res.data.msg || res.message || '保存失败')
            }
          }).catch(err => {
            that.$message.error('保存失败：' + err.message)
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
      this.visible = false
      this.editingKey = ''
      this.detailDataSource = []
      this.$emit("close")
    },
    // 点击条码查看BOM明细
    handleBarCodeClick(record) {
      if (!record.materialId) {
        this.$message.warning('物料ID不存在')
        return
      }
      this.bomDetailRecord = record
      this.bomDetailModalVisible = true
      this.bomDetailPagination.current = 1
      this.loadBomDetailList(record.materialId)
    },
    // 加载BOM明细列表
    loadBomDetailList(materialId) {
      this.bomDetailLoading = true
      const params = {
        search: {
          id: materialId,
          pageNo: this.bomDetailPagination.current,
          pageSize: this.bomDetailPagination.pageSize
        }
      }
      getAction(this.url.bomList, params).then(res => {
        if (res.code === 200) {
          const data = res.data.rows || res.data
          this.bomDetailDataSource = Array.isArray(data) ? data : []
          this.bomDetailPagination.total = res.data.total || (Array.isArray(data) ? data.length : 0)
        } else {
          this.$message.warning(res.message || '获取BOM明细失败')
          this.bomDetailDataSource = []
        }
      }).catch(err => {
        this.$message.error('获取BOM明细失败')
        this.bomDetailDataSource = []
      }).finally(() => {
        this.bomDetailLoading = false
      })
    },
    handleBomDetailTableChange(pagination) {
      this.bomDetailPagination.current = pagination.current
      this.bomDetailPagination.pageSize = pagination.pageSize
      if (this.bomDetailRecord && this.bomDetailRecord.materialId) {
        this.loadBomDetailList(this.bomDetailRecord.materialId)
      }
    }
  }
}
</script>

<style scoped>
.editable-row-operations a {
  margin-right: 8px;
}
</style>
