<template>
  <div class="bom-list-container">
    <div class="bom-left-panel" :style="{ width: leftWidth + '%' }">
      <a-card :style="cardStyle" :bordered="false" title="第一步：单击行选择商品">
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="12" :sm="24">
                <a-form-item label="商品信息">
                  <a-input placeholder="条码/名称/规格/型号" v-model="queryParam.materialParam"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="12" :sm="24">
                <a-form-item label="有无BOM">
                  <a-select v-model="queryParam.hasBom" placeholder="请选择" allow-clear>
                    <a-select-option :value="1">有</a-select-option>
                    <a-select-option :value="0">无</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="24">
              <a-col :md="24" :sm="24">
                <span class="table-page-search-submitButtons" style="float: right; margin-bottom: 10px;">
                  <a-button type="primary" @click="searchQuery">查询</a-button>
                  <a-button style="margin-left: 8px" @click="searchReset">重置</a-button>
                </span>
              </a-col>
            </a-row>
          </a-form>
        </div>

        <a-table
          ref="table"
          size="middle"
          bordered
          rowKey="id"
          :columns="columns"
          :dataSource="dataSource"
          :pagination="ipagination"
          :scroll="scroll"
          :loading="loading"
          :row-selection="{selectedRowKeys: selectedRowKeys, type: 'radio', onChange: onSelectChange}"
          @change="handleTableChange"
          :customRow="customRow"
        >
        </a-table>
      </a-card>
    </div>
    <div class="bom-resizer" @mousedown="handleDragStart"></div>
    <div class="bom-right-panel" :style="{ width: (100 - leftWidth) + '%' }">
      <a-card :style="cardStyle" :bordered="false" title="第二步：为选中的商品设置物料及工序">
        <div v-if="selectedMaterial && selectedMaterial.id">
          <a-form layout="inline">
            <a-row :gutter="24">
              <a-col :md="8" :sm="24">
                <a-form-item label="商品条码">
                  <a-input v-model="selectedMaterial.mBarCode" :read-only="true" style="border: none; box-shadow: none;" />
                </a-form-item>
              </a-col>
              <a-col :md="16" :sm="24">
                <a-form-item label="商品名称">
                  <a-tooltip :title="selectedMaterial.name" placement="topLeft" :autoAdjustOverflow="true">
                    <a-input v-model="selectedMaterial.name" :read-only="true" style="border: none; box-shadow: none; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width:100%;" />
                  </a-tooltip>
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
          <a-tabs default-active-key="1">
            <a-tab-pane key="1" tab="1、所需物料">
              <div style="margin-bottom: 16px;">
                <a-form layout="inline">
                  <a-form-item label="版本号">
                    <a-select
                      v-model="bomQueryVersion"
                      placeholder="请选择版本号"
                      allow-clear
                      showSearch
                      optionFilterProp="children"
                      style="width: 200px"
                      @change="handleVersionFilterChange"
                    >
                      <a-select-option v-for="version in bomVersionList" :key="version" :value="version">
                        {{ version }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-form>
              </div>
              <div class="table-operator">
                <a-button @click="handleAdd" type="primary" icon="plus">新增</a-button>
                <a-button @click="handleCopy" icon="copy">复制</a-button>
                <a-button @click="handleBomExportXls('BOM清单')" icon="download">导出</a-button>
                <a-button @click="handleJEditableTableDelete" icon="delete">删除</a-button>
                <a-button @click="handleSave" type="primary" icon="save">保存</a-button>
                <a-button @click="handleImport" icon="import">BOM导入</a-button>
                <a-popover trigger="click" placement="right">
                  <template slot="content">
                    <a-checkbox-group @change="onBomColChange" v-model="bomSettingDataIndex">
                      <a-row style="width: 400px">
                        <template v-for="(item,index) in bomDefColumns">
                          <a-col :span="12" :key="index">
                            <a-checkbox :value="item.dataIndex">
                              {{ item.title }}
                            </a-checkbox>
                          </a-col>
                        </template>
                      </a-row>
                      <a-row style="padding-top: 10px;">
                        <a-col>
                          恢复默认列配置：<a-button @click="handleRestBomDefault" type="link" size="small">恢复默认</a-button>
                        </a-col>
                      </a-row>
                    </a-checkbox-group>
                  </template>
                  <a-button icon="setting">列设置</a-button>
                </a-popover>
              </div>
              <a-table
                ref="bomTable"
                size="middle"
                bordered
                rowKey="id"
                :columns="bomColumns"
                :dataSource="bomDataSource"
                :pagination="bomPagination"
                :scroll="bomScroll"
                :loading="bomLoading"
                :components="handleDrag(bomColumns)"
                :row-selection="{selectedRowKeys: bomSelectedRowKeys, onChange: onBomSelectChange}"
                @change="handleBomTableChange"
              >
                <template slot="qtyRender" slot-scope="text, record">
                  <a-input-number
                    :value="text"
                    :min="0"
                    :precision="0"
                    style="width: 100%"
                    @change="(value) => handleQtyChange(value, record)"
                  />
                </template>
                <template slot="barCodeRender" slot-scope="text, record">
                  <a-input
                    v-model="record.barCode"
                    :disabled="!record.isNew"
                    style="width: 100%"
                    placeholder="请输入条码"
                    @blur="(e) => handleBarCodeBlur(e.target.value, record)"
                    @pressEnter="(e) => handleBarCodeBlur(e.target.value, record)"
                  />
                </template>
                <template slot="materialNameRender" slot-scope="text, record">
                  <a-tooltip :title="text" placement="topLeft" :autoAdjustOverflow="true">
                    <a @click="handleMaterialNameClick(record)" style="color: #1890ff; cursor: pointer;">{{ text }}</a>
                  </a-tooltip>
                </template>
              </a-table>
            </a-tab-pane>
            <a-tab-pane key="2" tab="2、生产工序" force-render>
              <p>生产工序功能待开发</p>
            </a-tab-pane>
          </a-tabs>
        </div>
        <div v-else>
          <a-empty description="请在左侧选择一个商品" />
        </div>
      </a-card>
    </div>
    <j-select-material-modal ref="selectMaterialModal" :multi="true" @ok="selectMaterialOK" />
    <import-file-modal ref="bomImportModal" @ok="bomImportOk"></import-file-modal>
    <!-- 版本选择模态框 -->
    <a-modal
      title="选择版本号"
      :visible="versionModalVisible"
      :width="400"
      @ok="handleVersionConfirm"
      @cancel="handleVersionCancel"
      okText="确定"
      cancelText="取消"
      :maskClosable="false"
    >
      <a-form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="版本号">
          <a-select
            v-model="selectedVersion"
            placeholder="请选择版本号"
            showSearch
            optionFilterProp="children"
            style="width: 100%"
          >
            <a-select-option v-for="version in versionList" :key="version" :value="version">
              {{ version }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
    <!-- BOM详情弹窗 -->
    <a-modal
      title="详情"
      :visible="bomDetailModalVisible"
      :width="1000"
      @ok="handleBomDetailConfirm"
      @cancel="handleBomDetailCancel"
      okText="确定"
      cancelText="关闭"
      :maskClosable="false"
    >
      <a-form :form="bomDetailForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="条码">
              <a-input v-decorator="['barCode']" read-only style="border: none; box-shadow: none;" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="名称">
              <a-input v-decorator="['name']" read-only style="border: none; box-shadow: none;" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="单位">
              <a-input v-decorator="['unit']" read-only style="border: none; box-shadow: none;" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="采购价">
              <a-input v-decorator="['purchaseDecimal']" read-only style="border: none; box-shadow: none;" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="*数量">
              <a-input-number
                v-decorator="['qty', { rules: [{ required: true, message: '请输入数量' }], initialValue: 1 }]"
                :min="0"
                :precision="0"
                style="width: 100%"
                @change="handleDetailQtyChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="费用">
              <a-input v-decorator="['totalPrice']" read-only style="border: none; box-shadow: none;" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item label="备注">
              <a-input v-decorator="['remark']" placeholder="请输入备注" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
      <a-table
        :columns="bomDetailColumns"
        :dataSource="bomDetailDataSource"
        :pagination="bomDetailPagination"
        :scroll="bomDetailScroll"
        size="middle"
        bordered
        rowKey="id"
        @change="handleBomDetailTableChange"
      >
        <template slot="emptyText">
          <a-empty description="暂无数据" />
        </template>
        <template slot="detailQtyRender" slot-scope="text, record">
          <a-input-number
            :value="text"
            :min="0"
            :precision="0"
            style="width: 100%"
            @change="(value) => handleDetailTableQtyChange(value, record)"
          />
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script>
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import { getMpListShort } from "@/utils/util"
  import JEditableTable from '@/components/jeecg/JEditableTable'
  import { FormTypes } from '@/utils/JEditableTableUtil'
  import JSelectMaterialModal from '@/components/jeecgbiz/modal/JSelectMaterialModal'
  import JEllipsis from '@/components/jeecg/JEllipsis'
  import ImportFileModal from '@/components/tools/ImportFileModal'
  import { getAction, postAction, downFile, deleteAction } from '@/api/manage'

  export default {
    name: "BomList",
    mixins:[JeecgListMixin],
    components: {
      JEditableTable,
      JSelectMaterialModal,
      JEllipsis,
      ImportFileModal
    },
    data () {
      return {
        description: 'BOM管理页面',
        // 左侧商品列表
        columns: [
          { title: 'BOM', dataIndex: 'hasBom', customRender: (text) => text == 1 ? '有' : '无', width: 60 },
          { title: '条码', dataIndex: 'mBarCode', width: 120 },
          { title: '名称', dataIndex: 'name', width: 160, ellipsis: true },
          { title: '规格', dataIndex: 'standard', width: 100 },
          { title: '型号', dataIndex: 'model', width: 100 },
          { title: '类别', dataIndex: 'categoryName', width: 100 },
          { title: '单位', dataIndex: 'unit', width: 60 }
        ],
        queryParam: {
          materialParam: '',
          hasBom: undefined,
          // mpList: getMpListShort(Vue.ls.get('materialPropertyList')),
          mpList: []
        },
        urlPath: '/material/bom',
        url: {
          list: "/material/list",
          delete: "/material/delete",
          deleteBatch: "/material/deleteBatch",
          exportXlsUrl: "/material/exportXls",
          importExcelUrl: "material/importExcel",
        },
        // 右侧BOM列表
        selectedMaterial: {},
        bomLoading: false,
        bomDataSource: [],
        // 默认显示的BOM列索引（规格、型号、单位默认不显示）
        bomSettingDataIndex: ['rowIndex', 'barCode', 'materialName', 'wholesaleDecimal', 'purchaseDecimal', 'qty', 'totalPrice', 'version', 'remark'],
        // 所有可选的BOM列
        bomDefColumns: [
          {
            title: '#',
            dataIndex: 'rowIndex',
            key: 'rowIndex',
            width: 60,
            align: 'center',
            customRender: function (text, record, index) {
              return parseInt(index) + 1
            }
          },
          { title: '条码', dataIndex: 'barCode', width: 120, scopedSlots: { customRender: 'barCodeRender' } },
          { title: '名称', dataIndex: 'materialName', width: 300, ellipsis: true, scopedSlots: { customRender: 'materialNameRender' } },
          { title: '规格', dataIndex: 'standard', width: 120 },
          { title: '型号', dataIndex: 'model', width: 120 },
          { title: '单位', dataIndex: 'unit', width: 80 },
          { title: '销售单价', dataIndex: 'wholesaleDecimal', width: 100 },
          { title: '采购单价', dataIndex: 'purchaseDecimal', width: 100 },
          { title: '数量', dataIndex: 'qty', width: 100, scopedSlots: { customRender: 'qtyRender' } },
          { title: '成本', dataIndex: 'totalPrice', width: 100 },
          { title: '版本号', dataIndex: 'version', width: 100 },
          { title: '备注', dataIndex: 'remark', width: 150 }
        ],
        bomColumns: [],
        bomSelectedRowKeys: [],
        bomScroll: { x: 1300 },
        bomPagination: {
          current: 1,
          pageSize: 10,
          pageSizeOptions: ['10', '20', '30', '50'],
          showTotal: (total, range) => {
            return range[0] + '-' + range[1] + ' 共' + total + '条'
          },
          showQuickJumper: true,
          showSizeChanger: true,
          total: 0
        },
        bomUrl: {
          list: '/bomList/list',
          add: '/bomList/add',
          batchAdd: '/bomList/batchAdd',
          delete: '/bomList/delete',
          deleteBatch: '/bomList/deleteBatch',
          getVersionList: '/bomList/getVersionList',
          exportExcel: '/bomList/exportExcel',
          importExcel: '/bomList/importExcel'
        },
        // 版本选择相关
        versionModalVisible: false,
        versionList: [],
        selectedVersion: '1.0',
        pendingBatchData: null,
        // BOM列表查询版本号相关
        bomQueryVersion: undefined,
        bomVersionList: [],
        // BOM详情弹窗相关
        bomDetailModalVisible: false,
        bomDetailForm: {},
        bomDetailData: {},
        bomDetailDataSource: [],
        bomDetailColumns: [
          { title: '条码', dataIndex: 'barCode', width: 120 },
          { title: '名称', dataIndex: 'materialName', width: 300, ellipsis: true },
          { title: '规格', dataIndex: 'standard', width: 120 },
          { title: '型号', dataIndex: 'model', width: 120 },
          { title: '单位', dataIndex: 'unit', width: 80 },
          { title: '销售单价', dataIndex: 'wholesaleDecimal', width: 100 },
          { title: '采购单价', dataIndex: 'purchaseDecimal', width: 100 },
          { title: '数量', dataIndex: 'qty', width: 100, scopedSlots: { customRender: 'detailQtyRender' } },
          { title: '成本', dataIndex: 'totalPrice', width: 100 },
          { title: '版本号', dataIndex: 'version', width: 100 },
          { title: '备注', dataIndex: 'remark', width: 150 }
        ],
        bomDetailScroll: { x: 1300 },
        bomDetailPagination: {
          current: 1,
          pageSize: 10,
          pageSizeOptions: ['10', '20', '30', '50'],
          showTotal: (total, range) => {
            return range[0] + '-' + range[1] + ' 共' + total + '条'
          },
          showQuickJumper: true,
          showSizeChanger: true,
          total: 0
        },
        // 拖拽相关
        leftWidth: 40, // 左侧面板宽度百分比，默认40%
        isDragging: false
      }
    },
    created() {
      this.initColumnsSetting()
      this.initBomColumnsSetting()
      this.bomDetailForm = this.$form.createForm(this)
    },
    mounted() {
      this.initBomScroll()
    },
    methods: {
      initColumnsSetting(){
        this.columns = [
          { title: 'BOM', dataIndex: 'hasBom', customRender: (text) => text == 1 ? '有' : '无', width: 60 },
          { title: '条码', dataIndex: 'mBarCode', width: 120 },
          { title: '名称', dataIndex: 'name', width: 160, ellipsis: true },
          { title: '规格', dataIndex: 'standard', width: 100 },
          { title: '型号', dataIndex: 'model', width: 100 },
          { title: '类别', dataIndex: 'categoryName', width: 100 },
          { title: '单位', dataIndex: 'unit', width: 60 }
        ]
      },
      // 初始化BOM列表的列设置
      initBomColumnsSetting() {
        // 从localStorage读取用户保存的列配置
        const savedSetting = localStorage.getItem('bomColumnsSetting')
        if (savedSetting) {
          try {
            this.bomSettingDataIndex = JSON.parse(savedSetting)
          } catch (e) {
            // 解析失败使用默认配置
            this.bomSettingDataIndex = ['rowIndex', 'barCode', 'materialName', 'wholesaleDecimal', 'purchaseDecimal', 'qty', 'totalPrice', 'version', 'remark']
          }
        }
        // 根据选中的列生成实际显示的列配置
        this.updateBomColumns()
      },
      // 更新BOM列配置
      updateBomColumns() {
        this.bomColumns = this.bomDefColumns.filter(col => {
          const dataIndex = col.dataIndex || col.key
          return this.bomSettingDataIndex.includes(dataIndex)
        })
      },
      // BOM列设置变化
      onBomColChange(checkedValues) {
        this.bomSettingDataIndex = checkedValues
        this.updateBomColumns()
        // 保存到localStorage
        localStorage.setItem('bomColumnsSetting', JSON.stringify(checkedValues))
      },
      // 恢复BOM列默认配置
      handleRestBomDefault() {
        this.bomSettingDataIndex = ['rowIndex', 'barCode', 'materialName', 'wholesaleDecimal', 'purchaseDecimal', 'qty', 'totalPrice', 'version', 'remark']
        this.updateBomColumns()
        localStorage.setItem('bomColumnsSetting', JSON.stringify(this.bomSettingDataIndex))
        this.$message.success('已恢复默认列配置')
      },
      // 初始化右侧BOM列表的滚动配置
      initBomScroll() {
        if (this.isMobile()) {
          this.bomScroll.y = ''
        } else {
          let basicWidth = 150
          let basicLength = 274
          let searchWrapperDomLen = 0
          let operatorDomLen = 0
          // 操作按钮区域
          let operatorDom = document.getElementsByClassName('table-operator')
          if (operatorDom && operatorDom[0]) {
            operatorDomLen = operatorDom[0].offsetHeight + 10
          }
          // 计算右侧面板的可用宽度
          const rightPanel = this.$el.querySelector('.bom-right-panel')
          const panelWidth = rightPanel ? rightPanel.offsetWidth : document.documentElement.clientWidth * (100 - this.leftWidth) / 100
          this.bomScroll.x = 1300 // 固定横向滚动宽度
          this.bomScroll.y = document.documentElement.clientHeight - operatorDomLen - basicLength - 100
        }
      },

      onSelectChange(selectedRowKeys, selectedRows) {
        this.selectedRowKeys = selectedRowKeys;
        this.selectionRows = selectedRows;
        if (selectedRows.length > 0) {
          this.handleRowClick(selectedRows[0])
        }
      },
      customRow(record) {
        return {
          style: {
            'cursor': 'pointer'
          },
          on: {
            click: (e) => {
              this.handleRowClick(record)
            }
          }
        }
      },
      handleRowClick(record) {
        this.selectedRowKeys = [record.id]
        this.selectionRows = [record]
        this.selectedMaterial = record
        this.bomQueryVersion = undefined // 重置版本查询条件
        this.loadBomVersionList()
        this.loadBomData(record.id)
      },
      // 加载BOM列表的版本号下拉选项
      loadBomVersionList() {
        if (!this.selectedMaterial || !this.selectedMaterial.id) {
          this.bomVersionList = []
          return
        }
        getAction(this.bomUrl.getVersionList, { id: this.selectedMaterial.id }).then(res => {
          if (res.code === 200) {
            // 接口返回的数据可能是 {versionList: [...]} 格式，优先取versionList字段
            this.bomVersionList = (res.data && res.data.versionList) ? res.data.versionList : (res.data || [])
          } else {
            this.bomVersionList = []
          }
        }).catch(() => {
          this.bomVersionList = []
        })
      },
      // 版本号过滤变化
      handleVersionFilterChange() {
        this.loadBomData(this.selectedMaterial.id)
      },
      loadBomData(materialId) {
        this.bomLoading = true
        let search = {
          id: materialId,
          pageNo: this.bomPagination.current,
          pageSize: this.bomPagination.pageSize
        }
        // 如果选择了版本号查询条件，添加version参数
        if (this.bomQueryVersion) {
          search.version = this.bomQueryVersion
        }
        let params = { search: search }
        getAction(this.bomUrl.list, params).then(res => {
          if (res.code === 200) {
            let data = res.data.rows || res.data
            // 后端已返回所有字段，无需额外计算
            if (Array.isArray(data)) {
              this.bomDataSource = data
              this.bomPagination.total = res.data.total || data.length
            } else {
              this.bomDataSource = []
              this.bomPagination.total = 0
            }
          } else {
            this.$message.warning(res.data)
            this.bomDataSource = []
            this.bomPagination.total = 0
          }
        }).finally(() => {
          this.bomLoading = false
        })
      },
      handleAdd() {
        if (!this.selectedMaterial.id) {
          this.$message.warning('请先在左侧选择一个商品！')
          return
        }
        this.$refs.selectMaterialModal.showModal()
      },
      handleCopy() {
        if (!this.selectedMaterial.id) {
          this.$message.warning('请先在左侧选择一个商品！')
          return
        }
        if (this.bomSelectedRowKeys.length === 0) {
          this.$message.warning('请选择要复制的物料')
          return
        }
        // 获取选中的行
        const selectedRows = this.bomDataSource.filter(item => 
          this.bomSelectedRowKeys.includes(item.id)
        )
        // 复制选中的行，不包含id，生成新的临时id
        const copiedRows = selectedRows.map(row => {
          const newRow = {
            ...row,
            id: 'new_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000),
            isNew: true, // 标记为新行，用于条码可编辑判断
            barCode: row.barCode || '', // 保留条码用于编辑
            materialId: undefined // 清空materialId，等待条码编辑后重新赋值
          }
          return newRow
        })
        // 添加到数据源
        this.bomDataSource.push(...copiedRows)
        this.$message.success(`已复制 ${copiedRows.length} 条数据，请编辑条码后查询商品信息`)
        // 清空选中状态
        this.bomSelectedRowKeys = []
      },
      // 条码输入框失焦或回车时查询商品信息
      handleBarCodeBlur(barCode, record) {
        if (!barCode || !barCode.trim()) {
          this.$message.warning('请输入条码')
          return
        }
        if (!record.isNew) {
          return // 非新复制的行不处理
        }
        
        if (!this.selectedMaterial || !this.selectedMaterial.id) {
          this.$message.warning('请先选择商品')
          return
        }
        
        const trimmedBarCode = barCode.trim()
        // 如果条码没有变化，不重复查询
        if (record.lastQueriedBarCode === trimmedBarCode && record.materialId) {
          return
        }
        
        // 调用商品查询接口，传入bomId（即选中的商品ID）和条码
        this.bomLoading = true
        getAction('/material/queryByBarCode', { 
          bomId: this.selectedMaterial.id,
          barCode: trimmedBarCode 
        }).then(res => {
          if (res.code === 200 && res.data) {
            // 使用返回的结果完整替换当前行内容
            const index = this.bomDataSource.findIndex(item => item.id === record.id)
            if (index !== -1) {
              const oldId = record.id // 保留原来的临时ID
              const oldQty = record.qty // 保留原来的数量
              const oldRemark = record.remark // 保留原来的备注
              
              // 完整替换当前行，使用接口返回的数据
              this.$set(this.bomDataSource, index, {
                ...res.data, // 使用返回的所有字段
                id: oldId, // 保留临时ID
                qty: oldQty || res.data.qty || 1, // 优先使用原数量
                remark: oldRemark || res.data.remark || '', // 优先使用原备注
                lastQueriedBarCode: trimmedBarCode, // 记录已查询的条码
                isNew: false // 查询成功后取消新行标记，条码变为不可编辑
              })
              this.$message.success('已查询到商品信息')
            }
          } else {
            this.$message.warning(res.data || '未查询到该条码的商品信息，请检查条码是否正确')
          }
        }).catch(err => {
          console.error('查询商品信息失败:', err)
          this.$message.error('查询商品信息失败，请重试')
        }).finally(() => {
          this.bomLoading = false
        })
      },
      selectMaterialOK(rows, ids) {
        // 由于弹窗已设置为多选模式(:multi="true")，先弹出版本选择框
        if (rows && Array.isArray(rows) && rows.length > 0) {
          if (!this.selectedMaterial.id) {
            this.$message.warning('请先在左侧选择一个商品！')
            return
          }
          // 从 rows 中提取商品 id 数组
          let idsArray = rows.map(row => row.id).filter(id => id)
          if (idsArray.length === 0) {
            this.$message.warning('请选择要添加的商品！')
            return
          }
          // 暂存待添加的数据
          this.pendingBatchData = {
            materialId: this.selectedMaterial.id,
            ids: idsArray
          }
          // 弹出版本选择框
          this.selectedVersion = '1.0'
          this.loadVersionList()
          this.versionModalVisible = true
          return
        }
        // 保留原有的逐个添加逻辑（兼容性处理）
        let selectedMaterials = rows.map(row => ({
          id: 'new_' + new Date().getTime() + Math.floor(Math.random()*1000),
          materialId: row.id,
          barCode: row.mBarCode,
          name: row.name,
          standard: row.standard,
          model: row.model,
          unit: row.unit,
          purchaseDecimal: row.purchaseDecimal || 0,
          number: 1,
          cost: (1 * (row.purchaseDecimal || 0)).toFixed(2),
          remark: ''
        }))
        // 过滤掉已经存在的物料
        selectedMaterials = selectedMaterials.filter(item =>
          !this.bomDataSource.some(existing => existing.materialId === item.materialId)
        )
        this.bomDataSource.push(...selectedMaterials)
      },
      handleJEditableTableDelete() {
        if(!this.selectedMaterial.id){
          this.$message.warning('请先在左侧选择一个商品！')
          return
        }
        if (this.bomSelectedRowKeys.length === 0) {
          this.$message.warning('请选择要删除的物料')
          return
        }
        // 将选中的id用逗号拼接
        let ids = this.bomSelectedRowKeys.join(',')
        let that = this
        this.$confirm({
          title: '确认删除',
          content: '确定要删除所选中的 ' + this.bomSelectedRowKeys.length + ' 条数据吗?',
          onOk: function () {
            that.bomLoading = true
            deleteAction(that.bomUrl.deleteBatch, {ids: ids}).then((res) => {
              if (res.code == 200) {
                that.$message.success(res.data.message || '删除成功')
                that.loadBomData(that.selectedMaterial.id)
                that.bomSelectedRowKeys = []
              } else {
                that.$message.warning(res.data.message || '删除失败')
              }
            }).finally(() => {
              that.bomLoading = false
            })
          }
        })
      },
      handleSave() {
        if(!this.selectedMaterial.id){
          this.$message.warning('请先在左侧选择一个商品！')
          return
        }
        if (!this.bomDataSource || this.bomDataSource.length === 0) {
          this.$message.warning('没有可保存的数据！')
          return
        }
        // 提取 id、qty 和计算后的成本 totalPrice，批量传入
        let rows = this.bomDataSource.map(item => ({
          id: item.id,
          qty: item.qty || 1,
          totalPrice: item.totalPrice || 0
        }))
        let params = {
          rows: JSON.stringify(rows)
        }
        this.bomLoading = true
        postAction(this.bomUrl.add, params).then(res => {
          if (res.code === 200) {
            let message = res.data && res.data.message ? res.data.message : (res.data || '保存成功')
            this.$message.success(message)
            this.loadBomData(this.selectedMaterial.id)
            this.searchQuery() // 刷新左侧列表的BOM状态
          } else {
            let errorMsg = res.data && res.data.message ? res.data.message : (res.data || '保存失败')
            this.$message.error(errorMsg)
          }
        }).finally(() => {
          this.bomLoading = false
        })
      },
      handleImport() {
        if(!this.selectedMaterial.id){
          this.$message.warning('请先在左侧选择一个商品！')
          return
        }
        this.$refs.bomImportModal.initModal(
          this.bomUrl.importExcel,
          '/doc/bomList_template.xls',
          'BOM导入模板'
        )
      },
      bomImportOk() {
        // 导入成功后刷新数据
        this.loadBomData(this.selectedMaterial.id)
        this.searchQuery() // 刷新左侧列表的BOM状态
      },
      // 重写导出方法，使用BOM的导出接口
      handleBomExportXls(fileName) {
        if(!this.selectedMaterial.id){
          this.$message.warning('请先在左侧选择一个商品！')
          return
        }
        if (!fileName || typeof fileName != "string") {
          fileName = "BOM清单"
        }
        let param = {
          id: this.selectedMaterial.id
        }
        downFile(this.bomUrl.exportExcel, param).then((data) => {
          if (!data) {
            this.$message.warning("文件下载失败")
            return
          }
          if (typeof window.navigator.msSaveBlob !== 'undefined') {
            window.navigator.msSaveBlob(new Blob([data],{type: 'application/vnd.ms-excel'}), fileName+'.xls')
          } else {
            let url = window.URL.createObjectURL(new Blob([data],{type: 'application/vnd.ms-excel'}))
            let link = document.createElement('a')
            link.style.display = 'none'
            link.href = url
            link.setAttribute('download', fileName + '_' + new Date().getTime()+'.xls')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }
        })
      },
      onBomSelectChange(selectedRowKeys) {
        this.bomSelectedRowKeys = selectedRowKeys
      },
      handleQtyChange(value, record) {
        // 当数量变化时，使用采购单价计算总价（成本）
        let totalPrice = (value * (record.purchaseDecimal || 0)).toFixed(2)
        // 更新数据源中的数量和总价
        const index = this.bomDataSource.findIndex(item => item.id === record.id)
        if (index !== -1) {
          this.$set(this.bomDataSource[index], 'qty', value)
          this.$set(this.bomDataSource[index], 'totalPrice', totalPrice)
        }
      },
      // 点击名称打开详情弹窗
      handleMaterialNameClick(record) {
        // 使用materialId查询详情,如果没有materialId则使用id
        const materialId = record.materialId || record.id
        if (!materialId) {
          this.$message.warning('商品ID不存在')
          return
        }
        // 重置详情表格分页为第1页
        this.bomDetailPagination.current = 1
        this.bomDetailModalVisible = true
        this.bomDetailData = record
        // 设置表单初始值
        this.$nextTick(() => {
          this.bomDetailForm.setFieldsValue({
            barCode: record.barCode || '',
            name: record.materialName || '',
            unit: record.unit || '',
            purchaseDecimal: record.purchaseDecimal || 0,
            qty: record.qty || 1,
            totalPrice: record.totalPrice || 0,
            remark: record.remark || ''
          })
        })
        // 加载详情列表,使用 /bomList/list 接口
        this.loadBomDetailList(materialId)
      },
      // 加载BOM详情列表
      loadBomDetailList(materialId) {
        let search = {
          id: materialId,
          pageNo: this.bomDetailPagination.current,
          pageSize: this.bomDetailPagination.pageSize
        }
        let params = { search: search }
        getAction(this.bomUrl.list, params).then(res => {
          if (res.code === 200) {
            let data = res.data.rows || res.data
            this.bomDetailDataSource = Array.isArray(data) ? data : []
            this.bomDetailPagination.total = res.data.total || (Array.isArray(data) ? data.length : 0)
          } else {
            this.$message.warning(res.data || '获取详情失败')
            this.bomDetailDataSource = []
            this.bomDetailPagination.total = 0
          }
        }).catch(() => {
          this.bomDetailDataSource = []
          this.bomDetailPagination.total = 0
        })
      },
      // 详情弹窗数量变化
      handleDetailQtyChange(value) {
        const purchaseDecimal = this.bomDetailForm.getFieldValue('purchaseDecimal') || 0
        const totalPrice = (value * purchaseDecimal).toFixed(2)
        this.bomDetailForm.setFieldsValue({
          totalPrice: totalPrice
        })
      },
      // 详情弹窗确认（与列表保存按钮逻辑一致）
      handleBomDetailConfirm() {
        if(!this.bomDetailData.materialId && !this.bomDetailData.id){
          this.$message.warning('商品ID不存在！')
          return
        }
        const materialId = this.bomDetailData.materialId || this.bomDetailData.id
        if (!this.bomDetailDataSource || this.bomDetailDataSource.length === 0) {
          this.$message.warning('没有可保存的数据！')
          return
        }
        // 提取 id、qty 和计算后的成本 totalPrice，批量传入（与handleSave逻辑一致）
        let rows = this.bomDetailDataSource.map(item => ({
          id: item.id,
          qty: item.qty || 1,
          totalPrice: item.totalPrice || 0
        }))
        let params = {
          rows: JSON.stringify(rows)
        }
        this.bomLoading = true
        postAction(this.bomUrl.add, params).then(res => {
          if (res.code === 200) {
            let message = res.data && res.data.message ? res.data.message : (res.data || '保存成功')
            this.$message.success(message)
            // 关闭弹窗并刷新列表
            this.bomDetailModalVisible = false
            this.loadBomData(this.selectedMaterial.id)
            this.loadBomDetailList(materialId) // 如果弹窗还打开，刷新详情列表
          } else {
            let errorMsg = res.data && res.data.message ? res.data.message : (res.data || '保存失败')
            this.$message.error(errorMsg)
          }
        }).finally(() => {
          this.bomLoading = false
        })
      },
      // 详情弹窗表格中数量变化
      handleDetailTableQtyChange(value, record) {
        // 当数量变化时，使用采购单价计算总价（成本）
        let totalPrice = (value * (record.purchaseDecimal || 0)).toFixed(2)
        // 更新数据源中的数量和总价
        const index = this.bomDetailDataSource.findIndex(item => item.id === record.id)
        if (index !== -1) {
          this.$set(this.bomDetailDataSource[index], 'qty', value)
          this.$set(this.bomDetailDataSource[index], 'totalPrice', totalPrice)
        }
      },
      // 详情弹窗取消
      handleBomDetailCancel() {
        this.bomDetailModalVisible = false
        this.bomDetailForm.resetFields()
        this.bomDetailDataSource = []
      },
      // 主BOM表格分页变化处理
      handleBomTableChange(pagination, filters, sorter) {
        this.bomPagination.current = pagination.current
        this.bomPagination.pageSize = pagination.pageSize
        this.loadBomData(this.selectedMaterial.id)
      },
      // 详情表格分页变化处理
      handleBomDetailTableChange(pagination, filters, sorter) {
        this.bomDetailPagination.current = pagination.current
        this.bomDetailPagination.pageSize = pagination.pageSize
        const materialId = this.bomDetailData.materialId || this.bomDetailData.id
        this.loadBomDetailList(materialId)
      },
      searchReset() {
        this.queryParam = {
          materialParam: '',
          hasBom: undefined,
          mpList: getMpListShort(Vue.ls.get('materialPropertyList'))
        }
        this.loadData(1);
      },
      // 加载版本列表
      loadVersionList() {
        if (!this.selectedMaterial || !this.selectedMaterial.id) {
          this.$message.warning('请先选择商品！')
          return
        }
        getAction(this.bomUrl.getVersionList, { id: this.selectedMaterial.id }).then(res => {
          if (res.code === 200) {
            this.versionList = res.data || []
            // 如果版本列表中包含 1.0，确保默认选中
            if (this.versionList.length > 0 && !this.versionList.includes('1.0')) {
              // 如果列表中没有 1.0，但需要默认值，可以添加到列表或选择第一个
              this.selectedVersion = this.versionList[0]
            }
          } else {
            this.$message.warning(res.data || '获取版本列表失败')
            this.versionList = []
          }
        }).catch(() => {
          this.$message.error('获取版本列表失败')
          this.versionList = []
        })
      },
      // 版本确认
      handleVersionConfirm() {
        if (!this.selectedVersion) {
          this.$message.warning('请选择版本号！')
          return
        }
        if (!this.pendingBatchData) {
          this.$message.warning('数据异常，请重新操作！')
          this.versionModalVisible = false
          return
        }
        // 调用批量添加接口，传递版本号
        let params = {
          materialId: this.pendingBatchData.materialId,
          ids: this.pendingBatchData.ids,
          version: this.selectedVersion
        }
        this.bomLoading = true
        postAction(this.bomUrl.batchAdd, params).then(res => {
          if (res.code === 200) {
            this.$message.success(res.data || '批量添加成功')
            this.loadBomData(this.pendingBatchData.materialId)
            this.searchQuery() // 刷新左侧列表的BOM状态
            this.versionModalVisible = false
            this.pendingBatchData = null
          } else {
            this.$message.error(res.data || '批量添加失败')
          }
        }).finally(() => {
          this.bomLoading = false
        })
      },
      // 版本取消
      handleVersionCancel() {
        this.versionModalVisible = false
        this.pendingBatchData = null
        this.selectedVersion = '1.0'
      },
      // 拖拽开始
      handleDragStart(e) {
        this.isDragging = true
        // 使用箭头函数保持this上下文
        this.handleDragMove = (e) => {
          if (!this.isDragging) return
          const container = this.$el.querySelector('.bom-list-container')
          if (!container) return
          const containerRect = container.getBoundingClientRect()
          const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
          // 限制宽度范围在20%-80%之间
          if (newLeftWidth >= 20 && newLeftWidth <= 80) {
            this.leftWidth = newLeftWidth
          }
        }
        this.handleDragMoveEnd = () => {
          this.isDragging = false
          document.removeEventListener('mousemove', this.handleDragMove)
          document.removeEventListener('mouseup', this.handleDragMoveEnd)
        }
        document.addEventListener('mousemove', this.handleDragMove)
        document.addEventListener('mouseup', this.handleDragMoveEnd)
        e.preventDefault()
        e.stopPropagation()
      }
    },
    beforeDestroy() {
      // 组件销毁前移除事件监听
      if (this.handleDragMove) {
        document.removeEventListener('mousemove', this.handleDragMove)
      }
      if (this.handleDragMoveEnd) {
        document.removeEventListener('mouseup', this.handleDragMoveEnd)
      }
    }
  }
</script>
<style scoped>
  @import '~@assets/less/common.less';

  .bom-list-container {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
  }

  .bom-left-panel {
    flex-shrink: 0;
    padding-right: 12px;
  }

  .bom-right-panel {
    flex-shrink: 0;
    padding-left: 12px;
  }

  .bom-resizer {
    width: 4px;
    flex-shrink: 0;
    background-color: #f0f0f0;
    cursor: col-resize;
    position: relative;
    z-index: 10;
    transition: background-color 0.2s;
    user-select: none;
    -webkit-user-select: none;
  }

  .bom-resizer:hover {
    background-color: #1890ff;
  }

  .bom-resizer::before {
    content: '';
    position: absolute;
    left: -4px;
    top: 0;
    width: 12px;
    height: 100%;
    cursor: col-resize;
    z-index: 11;
  }
</style>