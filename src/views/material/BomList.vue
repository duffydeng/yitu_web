<template>
  <a-row :gutter="24">
    <a-col :md="10" :sm="24">
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
    </a-col>
    <a-col :md="14" :sm="24">
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
              <j-editable-table
                ref="editableTable"
                :loading="bomLoading"
                :columns="bomColumns"
                :dataSource="bomDataSource"
                :rowNumber="true"
                :rowSelection="true"
                :actionButton="false"
                @valueChange="handleValueChange"
              />
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
    </a-col>
    <j-select-material-modal ref="selectMaterialModal" @ok="selectMaterialOK" />
  </a-row>
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
          { title: '条码', key: 'barCode', type: FormTypes.input, disabled: true, width: '15%' },
          { title: '名称', key: 'name', type: FormTypes.input, disabled: true, width: '20%' },
          { title: '规格', key: 'standard', type: FormTypes.input, disabled: true, width: '10%' },
          { title: '型号', key: 'model', type: FormTypes.input, disabled: true, width: '10%' },
          { title: '单位', key: 'unit', type: FormTypes.input, disabled: true, width: '5%' },
          { title: '采购单价', key: 'purchaseDecimal', type: FormTypes.input, disabled: true, width: '8%' },
          { title: '数量', key: 'number', type: FormTypes.inputNumber, defaultValue: 1, validateRules: [{ required: true, message: '${title}不能为空' }], width: '8%' },
          { title: '成本', key: 'cost', type: FormTypes.input, disabled: true, width: '8%' },
          { title: '备注', key: 'remark', type: FormTypes.input, width: '16%' }
        ],
        bomUrl: {
          list: '/bomList/list',
          add: '/bomList/add',
          delete: '/bomList/delete',
          deleteBatch: '/bomList/deleteBatch'
        }
      }
    },
    created() {
      this.initColumnsSetting()
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
            data.forEach(item => {
              item.cost = (item.number * (item.purchaseDecimal || 0)).toFixed(2)
            })
            this.bomDataSource = data
          } else {
            this.$message.warning(res.data)
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
        this.$refs.selectMaterialModal.show()
      },
      selectMaterialOK(rows) {
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
        this.$refs.editableTable.resetScrollTop()
      },
      handleJEditableTableDelete() {
        if(!this.selectedMaterial.id){
          this.$message.warning('请先在左侧选择一个商品！')
          return
        }
        if (this.$refs.editableTable.selectedRowIds.length === 0) {
          this.$message.warning('请选择要删除的物料')
          return
        }
        this.$refs.editableTable.removeSelectedRows()
      },
      handleSave() {
        if(!this.selectedMaterial.id){
          this.$message.warning('请先在左侧选择一个商品！')
          return
        }
        this.$refs.editableTable.getValues((err, values) => {
          if (err === 0) {
            let params = {
              info: JSON.stringify({
                id: this.selectedMaterial.id
              }),
              rows: JSON.stringify(values)
            }
            postAction(this.bomUrl.add, params).then(res => {
              if (res.code === 200) {
                this.$message.success(res.data)
                this.loadBomData(this.selectedMaterial.id)
                this.searchQuery() // 刷新左侧列表的BOM状态
              } else {
                this.$message.error(res.data)
              }
            })
          } else {
            this.$message.error('请检查BOM物料列表输入项!')
          }
        })
      },
      handleImport() {
        this.$message.info('BOM导入功能待开发')
      },
      handleValueChange(event) {
        const { type, row, column, value, target } = event
        if (column.key === 'number') {
          let cost = (value * (row.purchaseDecimal || 0)).toFixed(2)
          target.setValues([{
            rowKey: row.id,
            values: { 'cost': cost }
          }])
        }
      },
      searchReset() {
        this.queryParam = {
          materialParam: '',
          hasBom: undefined,
          mpList: getMpListShort(Vue.ls.get('materialPropertyList'))
        }
        this.loadData(1);
      }
    }
  }
</script>
<style scoped>
  @import '~@assets/less/common.less';
</style>