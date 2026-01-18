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
                    <a-select-option value="1">有</a-select-option>
                    <a-select-option value="0">无</a-select-option>
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
              <a-col :md="12" :sm="24">
                <a-form-item label="商品条码">
                  <a-input v-model="selectedMaterial.mBarCode" :read-only="true" style="border: none; box-shadow: none;" />
                </a-form-item>
              </a-col>
              <a-col :md="12" :sm="24">
                <a-form-item label="商品名称">
                  <a-input v-model="selectedMaterial.name" :read-only="true" style="border: none; box-shadow: none;" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
          <a-tabs default-active-key="1">
            <a-tab-pane key="1" tab="1、所需物料">
              <div class="table-operator">
                <a-button @click="handleAdd" type="primary" icon="plus">新增</a-button>
                <a-button @click="handleExportXls('BOM清单')" icon="download">导出</a-button>
                <a-button @click="handleJEditableTableDelete" icon="delete">删除</a-button>
                <a-button @click="handleSave" type="primary" icon="save">保存</a-button>
                <a-button @click="handleImport" icon="import">BOM导入</a-button>
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
  </div>
</template>

<script>
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import { getMpListShort } from "@/utils/util"
  import JEditableTable from '@/components/jeecg/JEditableTable'
  import { FormTypes } from '@/utils/JEditableTableUtil'
  import JSelectMaterialModal from '@/components/jeecgbiz/modal/JSelectMaterialModal'
   import JEllipsis from '@/components/jeecg/JEllipsis'
  import { getAction, postAction } from '@/api/manage'

  export default {
    name: "BomList",
    mixins:[JeecgListMixin],
    components: {
      JEditableTable,
      JSelectMaterialModal,
      JEllipsis
    },
    data () {
      return {
        description: 'BOM管理页面',
        // 左侧商品列表
        columns: [
          { title: 'BOM', dataIndex: 'hasBom', customRender: (text) => text === '1' ? '有' : '无', width: 60 },
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
        bomColumns: [
          {
            title: '#',
            dataIndex: '',
            key: 'rowIndex',
            width: 60,
            align: 'center',
            customRender: function (text, record, index) {
              return parseInt(index) + 1
            }
          },
          { title: '条码', dataIndex: 'barCode', width: 120 },
          { title: '名称', dataIndex: 'materialName', width: 200, ellipsis: true },
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
        bomSelectedRowKeys: [],
        bomScroll: { x: 1200 },
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
          getVersionList: '/bomList/getVersionList'
        },
        // 版本选择相关
        versionModalVisible: false,
        versionList: [],
        selectedVersion: '1.0',
        pendingBatchData: null,
        // 拖拽相关
        leftWidth: 40, // 左侧面板宽度百分比，默认40%
        isDragging: false
      }
    },
    created() {
      this.initColumnsSetting()
    },
    mounted() {
      this.initBomScroll()
    },
    methods: {
      initColumnsSetting(){
        this.columns = [
          { title: 'BOM', dataIndex: 'hasBom', customRender: (text) => text === '1' ? '有' : '无', width: 60 },
          { title: '条码', dataIndex: 'mBarCode', width: 120 },
          { title: '名称', dataIndex: 'name', width: 160, ellipsis: true },
          { title: '规格', dataIndex: 'standard', width: 100 },
          { title: '型号', dataIndex: 'model', width: 100 },
          { title: '类别', dataIndex: 'categoryName', width: 100 },
          { title: '单位', dataIndex: 'unit', width: 60 }
        ]
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
          this.bomScroll.x = 1200 // 固定横向滚动宽度
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
        this.loadBomData(record.id)
      },
      loadBomData(materialId) {
        this.bomLoading = true
        getAction(this.bomUrl.list, { id: materialId }).then(res => {
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
        // 从数据源中删除选中的行
        this.bomDataSource = this.bomDataSource.filter(item => !this.bomSelectedRowKeys.includes(item.id))
        this.bomSelectedRowKeys = []
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
        this.$message.info('BOM导入功能待开发')
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