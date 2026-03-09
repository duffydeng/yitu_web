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
                <a-form-item label="单据编号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入单据编号" v-model="queryParam.number"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="商品信息" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入条码、名称、助记码、规格、型号等信息" v-model="queryParam.materialParam"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="单据日期" :labelCol="labelCol" :wrapperCol="wrapperCol">
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
            <template v-if="toggleSearchStatus">
              <a-row :gutter="24">
                <a-col :md="6" :sm="24">
                  <a-form-item label="仓库名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="请选择仓库" showSearch allow-clear optionFilterProp="children" v-model="queryParam.depotId">
                      <a-select-option v-for="(depot,index) in depotList" :value="depot.id" :key="index">
                        {{ depot.depotName }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="操作员" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="请选择操作员" showSearch allow-clear optionFilterProp="children" v-model="queryParam.creator">
                      <a-select-option v-for="(item,index) in userList" :key="index" :value="item.id">
                        {{ item.userName }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="单据状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="请选择单据状态" allow-clear v-model="queryParam.status">
                      <a-select-option value="0">未审核</a-select-option>
                      <a-select-option value="9" v-if="!checkFlag">审核中</a-select-option>
                      <a-select-option value="1">已审核</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="单据备注" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input placeholder="请输入单据备注" v-model="queryParam.remark"></a-input>
                  </a-form-item>
                </a-col>
              </a-row>
            </template>
          </a-form>
        </div>
        <!-- 操作按钮区域 -->
        <div class="table-operator"  style="margin-top: 5px">
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="myHandleAdd" type="primary" icon="plus">新增</a-button>
          <a-button v-if="btnEnableList.indexOf(1)>-1" icon="delete" @click="batchDel">删除</a-button>
          <a-button v-if="checkFlag && btnEnableList.indexOf(2)>-1" icon="check" @click="batchSetStatus(1)">审核</a-button>
          <a-button v-if="checkFlag && btnEnableList.indexOf(7)>-1" icon="stop" @click="batchSetStatus(0)">反审核</a-button>
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
          <a-tooltip placement="left" title="用于将多种商品合并成一个商品，被合并的商品库存减少，合并后的商品库存增加。" slot="action">
            <a-icon v-if="btnEnableList.indexOf(1)>-1" type="question-circle" style="font-size:20px;float:right;" />
          </a-tooltip>
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
            :components="handleDrag(columns)"
            :pagination="ipagination"
            :scroll="scroll"
            :loading="loading"
            :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
            :expandedRowKeys="expandedRowKeys"
            @expand="onExpand"
            @change="handleTableChange">
            <span slot="action" slot-scope="text, record">
              <a @click="handleDetailModal(record)">查看</a>
              <a-divider v-if="btnEnableList.indexOf(1)>-1" type="vertical" />
              <a v-if="btnEnableList.indexOf(1)>-1" @click="myHandleEdit(record)">编辑</a>
              <a-divider v-if="btnEnableList.indexOf(1)>-1" type="vertical" />
              <a v-if="btnEnableList.indexOf(1)>-1" @click="myHandleCopyAdd(record)">复制</a>
              <a-divider v-if="btnEnableList.indexOf(1)>-1" type="vertical" />
              <a-popconfirm v-if="btnEnableList.indexOf(1)>-1" title="确定删除吗?" @confirm="() => myHandleDelete(record)">
                <a>删除</a>
              </a-popconfirm>
            </span>
            <template slot="customRenderStatus" slot-scope="status">
              <a-tag v-if="status == '0'" color="red">未审核</a-tag>
              <a-tag v-if="status == '1'" color="green">已审核</a-tag>
              <a-tag v-if="status == '9'" color="orange">审核中</a-tag>
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
        <assemble-form-modal ref="modalForm" @ok="modalFormOk" @close="modalFormClose"></assemble-form-modal>
        <bill-detail ref="modalDetail" @ok="modalFormOk" @close="modalFormClose"></bill-detail>
        <bill-excel-iframe ref="billExcelIframe" @ok="modalFormOk" @close="modalFormClose"></bill-excel-iframe>
      </a-card>
    </a-col>
  </a-row>
</template>
<!--power by ji sheng hua-->
<script>
  import AssembleFormModal from './modules/AssembleFormModal'
  import BillDetail from './dialog/BillDetail'
  import BillExcelIframe from '@/components/tools/BillExcelIframe'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import { BillListMixin } from './mixins/BillListMixin'
  import JEllipsis from '@/components/jeecg/JEllipsis'
  import JDate from '@/components/jeecg/JDate'
  import Vue from 'vue'
  export default {
    name: "AssembleList",
    mixins:[JeecgListMixin,BillListMixin],
    components: {
      AssembleFormModal,
      BillDetail,
      BillExcelIframe,
      JEllipsis,
      JDate
    },
    data () {
      return {
        // 查询条件
        queryParam: {
          number: "",
          materialParam: "",
          type: "其它",
          subType: "组装单",
          depotId: undefined,
          creator: undefined,
          status: undefined,
          remark: ""
        },
        prefixNo: 'ZZD',
        urlPath: '/bill/assemble',
        labelCol: {
          span: 5
        },
        wrapperCol: {
          span: 18,
          offset: 1
        },
        // 默认索引
        defDataIndex:['action','number','materialsList','operTimeStr','userName','materialCount','totalPrice','status'],
        // 默认列
        defColumns: [
          {
            title: '操作',
            dataIndex: 'action',
            align:"center", width: 150,
            scopedSlots: { customRender: 'action' },
          },
          { title: '单据编号', dataIndex: 'number',width:160},
          { title: '商品信息', dataIndex: 'materialsList',width:220, ellipsis:true},
          { title: '单据日期', dataIndex: 'operTimeStr',width:145},
          { title: '操作员', dataIndex: 'userName',width:80, ellipsis:true},
          { title: '数量', dataIndex: 'materialCount',width:60},
          { title: '金额合计', dataIndex: 'totalPrice',width:80},
          { title: '备注', dataIndex: 'remark',width:200},
          { title: '状态', dataIndex: 'status', width: 80, align: "center",
            scopedSlots: { customRender: 'customRenderStatus' }
          }
        ],
        url: {
          list: "/depotHead/list",
          delete: "/depotHead/delete",
          deleteBatch: "/depotHead/deleteBatch",
          batchSetStatusUrl: "/depotHead/batchSetStatus"
        }
      }
    },
    computed: {
    },
    created() {
      this.initSystemConfig()
      this.getDepotData()
      this.initUser()
    },
    methods: {
      // 自定义导出方法，使用/depotHead/export接口
      handleExport() {
        // 导入downFile函数
        const { downFile } = require('@/api/manage')
        
        // 获取与列表接口相同的查询参数（除了分页）
        let sqp = {}
        if(this.superQueryParams){
          sqp['superQueryParams']=encodeURI(this.superQueryParams)
          sqp['superQueryMatchType'] = this.superQueryMatchType
        }
        let searchObj = {}
        // 使用queryParam中原始的type和subType配置
        searchObj.search = JSON.stringify(this.queryParam);
        var param = Object.assign(sqp, searchObj, this.isorter, this.filters);
        param.field = this.getQueryField();
        
        // 如果有选中的行，则只导出选中的数据
        if(this.selectedRowKeys && this.selectedRowKeys.length>0){
          param['selections'] = this.selectedRowKeys.join(",")
        }
        
        console.log("组装单导出参数", param)
        
        // 调用导出接口
        downFile('/depotHead/export', param).then((data)=> {
          if (!data) {
            this.$message.warning("文件下载失败")
            return
          }
          if (typeof window.navigator.msSaveBlob !== 'undefined') {
            window.navigator.msSaveBlob(new Blob([data],{type: 'application/vnd.ms-excel'}), '组装单列表导出.xls')
          }else{
            let url = window.URL.createObjectURL(new Blob([data],{type: 'application/vnd.ms-excel'}))
            let link = document.createElement('a')
            link.style.display = 'none'
            link.href = url
            link.setAttribute('download', '组装单列表导出_' + new Date().getTime() + '.xls')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link); //下载完成移除元素
            window.URL.revokeObjectURL(url); //释放掉blob对象
          }
        }).catch(() => {
          this.$message.error("导出失败")
        })
      },
      // 使用编辑组件以只读模式查看详情
      handleDetailModal(record) {
        // 查询单条单据信息
        const { findBillDetailByNumber } = require('@/api/api')
        findBillDetailByNumber({ number: record.number }).then((res) => {
          if (res && res.code === 200) {
            let item = res.data
            this.$refs.modalForm.action = "edit";
            this.$refs.modalForm.billType = '其它'
            this.$refs.modalForm.billSubType = '组装单'
            this.$refs.modalForm.prefixNo = 'ZZD'
            this.$refs.modalForm.disableSubmit = true; // 禁用保存按钮
            this.$refs.modalForm.rowCanEdit = false;  // 禁用编辑
            this.$refs.modalForm.title = "组装单-查看";
            this.$refs.modalForm.edit(item);
          } else {
            this.$message.error('获取单据详情失败')
          }
        }).catch(() => {
          this.$message.error('获取单据详情失败')
        })
      },
      // 一键拆解功能
      handleQuickDisassemble() {
        if (this.selectedRowKeys.length !== 1) {
          this.$message.warning('请选择一条记录进行拆解！')
          return
        }
        
        const selectedRecord = this.selectionRows[0]
        if (selectedRecord.status !== '0') {
          this.$message.warning('只有未审核的单据才能进行拆解！')
          return
        }
        
        this.disassembleLoading = true
        const { getBomList } = require('@/api/api')
        
        // 获取选中记录的详情，找到组合件条码
        this.findBillDetailForDisassemble(selectedRecord).then(billDetail => {
          if (!billDetail || !billDetail.depotItemJsonList || billDetail.depotItemJsonList.length === 0) {
            this.$message.warning('该单据没有商品信息，无法拆解！')
            this.disassembleLoading = false
            return
          }
          
          // 查找第一个有BOM的组合件
          let hasBomItem = billDetail.depotItemJsonList.find(item => 
            item.barCode && (item.hasBom === '1' || item.hasBom === 1)
          )
          
          if (!hasBomItem) {
            this.$message.warning('该单据中没有可拆解的组合件！')
            this.disassembleLoading = false
            return
          }
          
          const mainBarCode = hasBomItem.barCode
          
          // 调用拆解接口
          getBomList({ barCode: mainBarCode }).then((res) => {
            if (res && res.code === 200) {
              const bomData = res.data.rows || res.data
              if (!bomData || bomData.length === 0) {
                this.$message.warning('该组合件暂无BOM子件信息！')
                return
              }
              
              // 将拆解数据添加到表格
              this.addDisassembledDataToTable(bomData, selectedRecord)
            } else {
              this.$message.warning(res.message || '拆解失败！')
            }
          }).catch((error) => {
            this.$message.error('拆解接口调用失败：' + (error.message || '未知错误'))
          }).finally(() => {
            this.disassembleLoading = false
          })
        }).catch((error) => {
          this.$message.error('获取单据详情失败：' + (error.message || '未知错误'))
          this.disassembleLoading = false
        })
      },
      // 查询单据详情用于拆解
      findBillDetailForDisassemble(record) {
        return new Promise((resolve, reject) => {
          const { findBillDetailByNumber } = require('@/api/api')
          findBillDetailByNumber({ number: record.number }).then((res) => {
            if (res && res.code === 200) {
              resolve(res.data)
            } else {
              reject(new Error(res.message || '获取单据详情失败'))
            }
          }).catch((error) => {
            reject(error)
          })
        })
      },
      // 将拆解后的数据添加到表格
      addDisassembledDataToTable(bomData, selectedRecord) {
        try {
          // 获取默认仓库ID
          this.getDefaultDepotId().then(defaultDepotId => {
            // 将BOM数据转换为表格行格式
            const newRows = bomData.map(item => {
              const operNumber = item.operNumber || item.num || 1
              const unitPrice = item.unitPrice || item.billPrice || item.purchaseDecimal || 0
              const spcPrice = item.spcPrice || 0
              
              return {
                id: Date.now() + Math.random(), // 临时ID
                number: selectedRecord.number, // 使用原单据编号
                materialsList: `${item.mBarCode || item.barCode || ''} ${item.name || ''} ${item.standard || ''} ${item.model || ''}`,
                operTimeStr: selectedRecord.operTimeStr,
                userName: selectedRecord.userName,
                materialCount: 1, // 每行一个商品
                totalPrice: (operNumber * unitPrice + spcPrice).toFixed(2),
                remark: item.remark || selectedRecord.remark || '',
                status: selectedRecord.status,
                // 详细信息（用于展开显示）
                depotName: this.getDepotNameById(defaultDepotId),
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
                stock: item.stock || 0,
                unit: item.unit || item.commodityUnit || '',
                sku: item.sku || '',
                operNumber: operNumber,
                unitPrice: unitPrice,
                spcPrice: spcPrice,
                allPrice: (operNumber * unitPrice + spcPrice).toFixed(2),
                position: item.position || '',
                hasBom: item.hasBom || 0
              }
            })
            
            // 将新行添加到数据源
            this.dataSource = [...this.dataSource, ...newRows]
            this.$message.success(`拆解成功，共添加 ${newRows.length} 条子件到表格！`)
          }).catch(error => {
            this.$message.error('获取默认仓库失败：' + error.message)
          })
        } catch (error) {
          this.$message.error('数据处理失败：' + error.message)
        }
      },
      // 获取默认仓库ID
      getDefaultDepotId() {
        return new Promise((resolve, reject) => {
          const { getAction } = require('@/api/manage')
          getAction('/depot/findDepotByCurrentUser').then((res) => {
            if (res && res.code === 200) {
              const depotList = res.data
              if (depotList.length === 1) {
                resolve(depotList[0].id)
              } else {
                const defaultDepot = depotList.find(depot => depot.isDefault)
                resolve(defaultDepot ? defaultDepot.id : (depotList[0] ? depotList[0].id : ''))
              }
            } else {
              reject(new Error('获取仓库列表失败'))
            }
          }).catch(error => {
            reject(error)
          })
        })
      },
      // 根据仓库ID获取仓库名称
      getDepotNameById(depotId) {
        if (!this.depotList || !depotId) return ''
        const depot = this.depotList.find(item => item.id === depotId)
        return depot ? depot.depotName : ''
      }
    }
  }
</script>
<style scoped>
  @import '~@assets/less/common.less'
</style>