'''<!-- create dff-->
<template>
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :style="cardStyle" :bordered="false">
        <!-- 查询区域 -->
        <div class="table-page-search-wrapper">
          <!-- 搜索区域 -->
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="订单编号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入订单编号" v-model="queryParam.orderNumber"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="客户名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入客户名称" v-model="queryParam.customerName"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="产品名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入产品名称" v-model="queryParam.productName"></a-input>
                </a-form-item>
              </a-col>
              <template v-if="toggleSearchStatus">
                <a-col :md="6" :sm="24">
                  <a-form-item label="创建时间" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-range-picker
                      style="width:100%"
                      v-model="queryParam.createTimeRange"
                      format="YYYY-MM-DD"
                      :placeholder="['开始时间', '结束时间']"
                      @change="onDateChange"
                      @ok="onDateOk"
                    />
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="订单状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="请选择单据状态" allow-clear v-model="queryParam.orderStatus">
                      <a-select-option value="0">已创建</a-select-option>
                      <a-select-option value="10">待排产</a-select-option>
                      <a-select-option value="20">待完工</a-select-option>
                      <a-select-option value="30">待质检</a-select-option>
                      <a-select-option value="40">待发货</a-select-option>
                      <a-select-option value="50">运输中</a-select-option>
                      <a-select-option value="60">已完成</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="经销商" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input placeholder="请输入经销商" v-model="queryParam.organizationName"></a-input>
                  </a-form-item>
                </a-col>
              </template>
              <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
                <a-col :md="6" :sm="24">
                  <a-button type="primary" @click="searchQuery">查询</a-button>
                  <a-button style="margin-left: 8px" @click="searchReset">重置</a-button>
                  <a @click="handleToggleSearch" style="margin-left: 8px">
                    {{ toggleSearchStatus ? '收起' : '展开' }}
                    <a-icon :type="toggleSearchStatus ? 'up' : 'down'"/>
                  </a>
                </a-col>
              </span>
            </a-row>
          </a-form>
        </div>
        <!-- 操作按钮区域 -->
        <div class="table-operator"  style="margin-top: 5px">
          <a-button @click="handleProductionAssign" type="primary" icon="plus">分配排产</a-button>
          <a-button @click="handleAssemble" type="primary" icon="check">完工</a-button>
          <a-button @click="handleQualityCheck" type="primary" icon="safety">质检完成</a-button>
          <a-button @click="handleDelivery" type="primary" icon="car">发货</a-button>
          <a-button v-if="isShowExcel && btnEnableList.indexOf(3)>-1" icon="download" @click="handleExport">导出</a-button>
          <a-popover trigger="click" placement="right">
            <template slot="content">
              <a-checkbox-group @change="onColChange" v-model="settingDataIndex" :defaultValue="settingDataIndex">
                <a-row style="width: 500px">
                  <template v-for="(item,index) in defColumns">
                    <template>
                      <a-col :span="8">
                        <a-checkbox :value="item.dataIndex">
                          <j-ellipsis :value="item.title" :length="10"></j-ellipsis>
                        </a-checkbox>
                      </a-col>
                    </template>
                  </template>
                </a-row>
                <a-row style="padding-top: 10px;">
                  <a-col>
                    恢复默认列配置：<a-button @click="handleRestDefault" type="link" size="small">恢复默认</a-button>
                  </a-col>
                </a-row>
              </a-checkbox-group>
            </template>
            <a-button icon="setting">列设置</a-button>
          </a-popover>
        </div>
        <!-- table区域-begin -->
        <div>
          <a-table
            ref="table"
            size="middle"
            bordered
            rowKey="id"
            :columns="columns"
            :dataSource="dataSource"
            :pagination="ipagination"
            :loading="loading"
            :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
            :customRow="customRow"
            :expandedRowKeys="expandedRowKeys"
            @expand="onExpand"
            @change="handleTableChange">
            <span slot="action" slot-scope="text, record">
              <a @click="handleEdit(record)">编辑</a>
            </span>
			<template slot="customRenderStatus" slot-scope="status">
              <a-tag v-if="status == '0'" color="blue">已创建</a-tag>
              <a-tag v-if="status == '10'" color="orange">待排产</a-tag>
              <a-tag v-if="status == '20'" color="purple">待完工</a-tag>
              <a-tag v-if="status == '30'" color="yellow">待质检</a-tag>
              <a-tag v-if="status == '40'" color="cyan">待发货</a-tag>
              <a-tag v-if="status == '45'" color="pink">待揽收</a-tag>
              <a-tag v-if="status == '50'" color="geekblue">运输中</a-tag>
              <a-tag v-if="status == '60'" color="green">已完成</a-tag>
              <a-tag v-if="status == '99'" color="grey">已取消</a-tag>
            </template>
            <a-table
              bordered
              size="small"
              slot="expandedRowRender"
              slot-scope="record"
              :loading="record.loading"
              :columns="detailColumns"
              :dataSource="record.childrens"
              :row-key="record => record.id"
              :pagination="false">
            </a-table>
          </a-table>
        </div>
        <!-- table区域-end -->
        <!-- 表单区域 -->
        <dealer-order-modal ref="modalForm" @ok="modalFormOk" @close="modalFormClose"></dealer-order-modal>
        <dealer-order-edit-modal ref="editModal" @ok="modalFormOk" @close="modalFormClose"></dealer-order-edit-modal>
        <production-assign-modal ref="productionAssignModal" @ok="modalFormOk"></production-assign-modal>
        <assemble-modal ref="assembleModal" @ok="modalFormOk"></assemble-modal>
        <quality-check-modal ref="qualityCheckModal" @ok="modalFormOk"></quality-check-modal>
        <delivery-modal ref="deliveryModal" @ok="modalFormOk"></delivery-modal>
        <bill-detail ref="modalDetail" @ok="modalFormOk" @close="modalFormClose"></bill-detail>
        <bill-excel-iframe ref="billExcelIframe" @ok="modalFormOk" @close="modalFormClose"></bill-excel-iframe>
      </a-card>
    </a-col>
  </a-row>
</template>
<script>
  import DealerOrderModal from './modules/DealerOrderModal' // 您需要创建此文件
  import DealerOrderEditModal from './modules/DealerOrderEditModal' // 订单编辑弹窗
  import BillDetail from './dialog/BillDetail'
  import BillExcelIframe from '@/components/tools/BillExcelIframe'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import { BillListMixin } from './mixins/BillListMixin'
  import { getAction } from '@/api/manage'
  import ProductionAssignModal from './modules/ProductionAssignModal' // 分配排产弹窗
  import AssembleModal from './modules/AssembleModal' // 完工弹窗
  import QualityCheckModal from './modules/QualityCheckModal' // 质检完成弹窗
  import DeliveryModal from './modules/DeliveryModal' // 发货弹窗
  import JEllipsis from '@/components/jeecg/JEllipsis'
  export default {
    name: "DealerOrderList",
    mixins:[JeecgListMixin,BillListMixin],
    components: {
      DealerOrderModal,
      DealerOrderEditModal,
      BillDetail,
      BillExcelIframe,
      JEllipsis,
      ProductionAssignModal,
      AssembleModal,
      QualityCheckModal,
      DeliveryModal
    },
    data () {
      return {
        // 查询条件
        queryParam: {
          organizationName: "",
          customerName: "",
          customerPhone: "",
          productName: "",
          orderNumber: "",
          orderStatus: undefined,
        },
        prefixNo: 'DLR',
        labelCol: {
          span: 6
        },
        wrapperCol: {
          span: 18
        },
        // 存储展开的行key
        expandedRowKeys: [],
        // 明细表头
        detailColumns: [
          { title: '物料名称', dataIndex: 'materialName'},
          { title: '条码', dataIndex: 'barCode'},
          { title: '版本', dataIndex: 'version'},
          { title: '分类名称', dataIndex: 'categoryName'},
          { title: '数量', dataIndex: 'qty'},
          { title: '单价', dataIndex: 'detailPrice'},
          { title: '总价', dataIndex: 'detailTotalPrice'},
          { title: '创建时间', dataIndex: 'createTime'},
          { title: '更新时间', dataIndex: 'updateTime'}
        ],
				// 默认索引
        defDataIndex:["action","orderNumber","orderStatus","organizationName","customerName","customerPhone","productName","totalPrice","deposit","deductStock","createTime","updateTime","planFinishTime","actualFinishTime","productionPerson","afterSaleContact","expressCompanyName","expressNumber","receivePerson","receivePhone","receiveAddressDetail","qualityInspector","qualityInspectionTime","deliveryTime","collectionTime","signOffTime"],
        // 默认列
        defColumns: [
          {
            title: '操作',
            dataIndex: 'action',
            align:"center", width: 100,
            scopedSlots: { customRender: 'action' },
          },
          { title: '订单编号', dataIndex: 'orderNumber',width:180},
          { title: '订单状态', dataIndex: 'orderStatus', width: 100, align: "center",
            scopedSlots: { customRender: 'customRenderStatus' }
          },
          { title: '经销商', dataIndex: 'organizationName',width:150, ellipsis:true},
          { title: '客户名称', dataIndex: 'customerName',width:120, ellipsis:true},
          { title: '客户手机号', dataIndex: 'customerPhone', width: 120 },
          { title: '产品名称', dataIndex: 'productName',width:200, ellipsis:true},
          { title: '订单总价', dataIndex: 'totalPrice',width:100},
          { title: '定金', dataIndex: 'deposit',width:100},
          { title: '冲减库存', dataIndex: 'deductStock', width: 80, customRender: (text) => text ? '是' : '否' },
          { title: '创建时间', dataIndex: 'createTime',width:150,
            customRender:function (text) {
              return !text?"":text.substring(0,10)
            }
          },
          { title: '更新时间', dataIndex: 'updateTime',width:150,
            customRender:function (text) {
              return !text?"":text.substring(0,10)
            }
          },
          { title: '计划完工时间', dataIndex: 'planFinishTime', width: 150,
            customRender:function (text) {
              return !text?"":text.substring(0,10)
            }
          },
          { title: '实际完工时间', dataIndex: 'actualFinishTime', width: 150,
            customRender:function (text) {
              return !text?"":text.substring(0,10)
            }
          },
          { title: '分配排产人', dataIndex: 'productionPerson',width:100, ellipsis:true},
          { title: '售后联系人', dataIndex: 'afterSaleContact',width:100, ellipsis:true},
          { title: '快递公司', dataIndex: 'expressCompanyName',width:120},
          { title: '快递单号', dataIndex: 'expressNumber',width:150},
          { title: '收货人', dataIndex: 'receivePerson',width:100, ellipsis:true},
          { title: '收货电话', dataIndex: 'receivePhone',width:120},
          { title: '收货地址', dataIndex: 'receiveAddressDetail',width:200, ellipsis:true},
          { title: '质检人', dataIndex: 'qualityInspector',width:100, ellipsis:true},
          { title: '质检时间', dataIndex: 'qualityInspectionTime', width: 150,
            customRender:function (text) {
              return !text?"":text.substring(0,10)
            }
          },
          { title: '发货时间', dataIndex: 'deliveryTime', width: 150,
            customRender:function (text) {
              return !text?"":text.substring(0,10)
            }
          },
          { title: '揽收时间', dataIndex: 'collectionTime', width: 150,
            customRender:function (text) {
              return !text?"":text.substring(0,10)
            }
          },
          { title: '签收时间', dataIndex: 'signOffTime', width: 150,
            customRender:function (text) {
              return !text?"":text.substring(0,10)
            }
          }
        ],
        url: {
          list: "/order/list",
          delete: "/order/delete",
          deleteBatch: "/order/deleteBatch",
          exportXlsUrl: "order/exportXls",
          importExcelUrl: "order/importExcel",
        }
      }
    },
    created() {
    },
    methods: {
			customRow(record) {
        return {
          on: { // 事件
            dblclick: () => {
              this.myHandleEdit(record);
            }
          }
        }
      },
      handleProductionAssign() {
        if (this.selectedRowKeys.length === 0) {
          this.$message.warning("请至少选择一条记录！");
          return;
        }
        this.$refs.productionAssignModal.show(this.selectedRowKeys);
      },
      handleAssemble() {
        if (this.selectedRowKeys.length === 0) {
          this.$message.warning("请至少选择一条记录！");
          return;
        }
        this.$refs.assembleModal.show(this.selectedRowKeys);
      },
      handleQualityCheck() {
        if (this.selectedRowKeys.length === 0) {
          this.$message.warning("请至少选择一条记录！");
          return;
        }
        this.$refs.qualityCheckModal.show(this.selectedRowKeys);
      },
      handleDelivery() {
        if (this.selectedRowKeys.length === 0) {
          this.$message.warning("请至少选择一条记录！");
          return;
        }
        this.$refs.deliveryModal.show(this.selectedRowKeys);
      },
      handleEdit(record) {
        this.$refs.editModal.show(record)
      },
      // 展开/折叠行
      onExpand(expanded, record) {
        if (expanded) {
          this.expandedRowKeys = [...new Set([...this.expandedRowKeys, record.id])]
          this.loadOrderDetail(record)
        } else {
          this.expandedRowKeys = this.expandedRowKeys.filter(key => key !== record.id)
        }
      },
      // 加载订单明细
      loadOrderDetail(record) {
        record.loading = true
        const { getAction } = require('@/api/manage')
        getAction('/order/getOrderDetailList', { orderId: record.id }).then(res => {
          if (res && res.code === 200) {
            record.childrens = res.data || []
          } else {
            this.$message.warning(res.message || '加载明细失败')
            record.childrens = []
          }
        }).catch(err => {
          this.$message.error('加载明细失败：' + err.message)
          record.childrens = []
        }).finally(() => {
          record.loading = false
        })
      }
    }
  }
</script>
<style scoped>
  @import '~@assets/less/common.less'
</style>
'''