<template>
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :style="cardStyle" :bordered="false">
        <!-- 查询区域 -->
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="字典名称">
                  <a-input placeholder="请输入字典名称查询" v-model="queryParam.dictName"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="字典类型">
                  <a-input placeholder="请输入字典类型查询" v-model="queryParam.dictType"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="状态">
                  <a-select placeholder="请选择状态" v-model="queryParam.status" allowClear>
                    <a-select-option value="0">正常</a-select-option>
                    <a-select-option value="1">停用</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
                <a-col :md="6" :sm="24">
                  <a-button type="primary" @click="searchQuery">查询</a-button>
                  <a-button style="margin-left: 8px" @click="searchReset">重置</a-button>
                </a-col>
              </span>
            </a-row>
          </a-form>
        </div>
        <!-- 操作按钮区域 -->
        <div class="table-operator" style="margin-top: 5px">
          <a-button @click="handleAdd" type="primary" icon="plus">新增</a-button>
          <a-button @click="batchDel" icon="delete">删除</a-button>
        </div>
        <!-- table区域 -->
        <div>
          <a-table
            ref="table"
            size="middle"
            bordered
            rowKey="dictId"
            :columns="columns"
            :components="handleDrag(columns)"
            :dataSource="dataSource"
            :pagination="ipagination"
            :scroll="{ x: 1110 }"
            :loading="loading"
            :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
            @change="handleTableChange">
            <span slot="action" slot-scope="text, record">
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a @click="handleDictData(record)">字典数据</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除吗?" @confirm="() => handleDelete(record.dictId)">
                <a>删除</a>
              </a-popconfirm>
            </span>
            <template slot="statusSlot" slot-scope="status">
              <a-tag v-if="status === '0'" color="green">正常</a-tag>
              <a-tag v-else color="orange">停用</a-tag>
            </template>
          </a-table>
        </div>
        <!-- 字典类型表单 -->
        <dict-type-modal ref="modalForm" @ok="modalFormOk"></dict-type-modal>
      </a-card>
    </a-col>

    <!-- 字典数据弹窗 -->
    <a-modal
      :title="'字典数据 - ' + dictDataContext.dictName + ' (' + dictDataContext.dictType + ')'"
      :width="1000"
      :visible="dictDataVisible"
      :footer="null"
      :maskClosable="false"
      @cancel="closeDictDataModal"
      style="top:5%;">
      <div v-if="dictDataVisible">
        <!-- 搜索区域 -->
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="loadDictData(1)">
            <a-row :gutter="24">
              <a-col :md="8" :sm="24">
                <a-form-item label="字典标签">
                  <a-input placeholder="请输入字典标签查询" v-model="dictDataQuery.dictLabel"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="状态">
                  <a-select placeholder="请选择状态" v-model="dictDataQuery.status" allowClear style="width: 120px;">
                    <a-select-option value="1">正常</a-select-option>
                    <a-select-option value="0">停用</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
                <a-button type="primary" @click="loadDictData(1)">查询</a-button>
                <a-button style="margin-left: 8px" @click="resetDictDataQuery">重置</a-button>
              </span>
            </a-row>
          </a-form>
        </div>
        <!-- 操作按钮 -->
        <div class="table-operator" style="margin-top: 5px">
          <a-button @click="handleDictDataAdd" type="primary" icon="plus">新增</a-button>
          <a-button @click="batchDelDictData" icon="delete">删除</a-button>
        </div>
        <!-- 数据表格 -->
        <a-table
          size="middle"
          bordered
          rowKey="dictCode"
          :columns="dictDataColumns"
          :components="handleDrag(dictDataColumns)"
          :dataSource="dictDataList"
          :scroll="{ x: 1520 }"
          :pagination="dictDataPagination"
          :loading="dictDataLoading"
          :rowSelection="{selectedRowKeys: dictDataSelectedKeys, onChange: onDictDataSelectChange}"
          @change="handleDictDataTableChange">
          <span slot="action" slot-scope="text, record">
            <a @click="handleDictDataEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm title="确定删除吗?" @confirm="() => handleDictDataDelete(record.dictCode)">
              <a>删除</a>
            </a-popconfirm>
          </span>
          <template slot="ddStatusSlot" slot-scope="status">
            <a-tag v-if="status === '1'" color="green">正常</a-tag>
            <a-tag v-else color="orange">停用</a-tag>
          </template>
          <template slot="ddDefaultSlot" slot-scope="isDefault">
            <a-tag v-if="isDefault === 'Y'" color="blue">是</a-tag>
            <a-tag v-else>否</a-tag>
          </template>
        </a-table>
        <!-- 字典数据表单 -->
        <dict-data-modal ref="dictDataForm" @ok="onDictDataFormOk"></dict-data-modal>
      </div>
    </a-modal>
  </a-row>
</template>
<script>
  import DictTypeModal from './modules/DictTypeModal'
  import DictDataModal from './modules/DictDataModal'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import { deleteAction, getAction } from '@/api/manage'
  export default {
    name: "DictTypeList",
    mixins: [JeecgListMixin],
    components: { DictTypeModal, DictDataModal },
    data () {
      return {
        description: '字典类型管理页面',
        urlPath: '/system/dict/type',
        queryParam: {
          dictName: '',
          dictType: '',
          status: ''
        },
        columns: [
          {
            title: '#',
            dataIndex: '',
            key: 'rowIndex',
            width: 50,
            align: "center",
            customRender: function (t, r, index) {
              return parseInt(index) + 1;
            }
          },
          {
            title: '操作',
            dataIndex: 'action',
            align: "center",
            width: 220,
            scopedSlots: { customRender: 'action' },
          },
          { title: '字典名称', align: "left", dataIndex: 'dictName', width: 200 },
          { title: '字典类型', align: "left", dataIndex: 'dictType', width: 200 },
          {
            title: '状态', dataIndex: 'status', width: 80, align: "center",
            scopedSlots: { customRender: 'statusSlot' }
          },
          { title: '备注', align: "left", dataIndex: 'remark', width: 200 },
          { title: '创建时间', align: "left", dataIndex: 'createTime', width: 160 }
        ],
        url: {
          list: "/system/dict/type/list",
          deleteBatch: "/system/dict/type/delete"
        },
        // 字典数据弹窗状态
        dictDataVisible: false,
        dictDataContext: { dictType: '', dictName: '' },
        dictDataQuery: { dictLabel: '', status: '' },
        dictDataList: [],
        dictDataLoading: false,
        dictDataSelectedKeys: [],
        dictDataPagination: {
          current: 1,
          pageSize: 10,
          pageSizeOptions: ['10', '20', '30', '50', '100'],
          showTotal: (total, range) => range[0] + "-" + range[1] + " 共" + total + "条",
          showQuickJumper: true,
          showSizeChanger: true,
          total: 0
        },
        dictDataColumns: [
          {
            title: '#',
            dataIndex: '',
            key: 'rowIndex',
            width: 50,
            align: "center",
            customRender: function (t, r, index) {
              return parseInt(index) + 1;
            }
          },
          {
            title: '操作',
            dataIndex: 'action',
            align: "center",
            width: 120,
            scopedSlots: { customRender: 'action' },
          },
          { title: '字典标签', align: "left", dataIndex: 'dictLabel', width: 150 },
          { title: '字典键值', align: "left", dataIndex: 'dictValue', width: 150 },
          { title: '字典排序', align: "center", dataIndex: 'dictSort', width: 80 },
          {
            title: '是否默认', dataIndex: 'isDefault', width: 80, align: "center",
            scopedSlots: { customRender: 'ddDefaultSlot' }
          },
          {
            title: '状态', dataIndex: 'status', width: 80, align: "center",
            scopedSlots: { customRender: 'ddStatusSlot' }
          },
          { title: '备注', align: "left", dataIndex: 'remark', width: 200 },
          { title: '扩展字段1', align: "left", dataIndex: 'otherField1', width: 150 },
          { title: '扩展字段2', align: "left", dataIndex: 'otherField2', width: 150 },
          { title: '扩展字段3', align: "left", dataIndex: 'otherField3', width: 150 },
          { title: '创建时间', align: "left", dataIndex: 'createTime', width: 160 }
        ]
      }
    },
    methods: {
      getQueryParams() {
        var param = {}
        if (this.queryParam.dictName) {
          param.dictName = this.queryParam.dictName
        }
        if (this.queryParam.dictType) {
          param.dictType = this.queryParam.dictType
        }
        if (this.queryParam.status) {
          param.status = this.queryParam.status
        }
        param.pageNo = this.ipagination.current
        param.pageSize = this.ipagination.pageSize
        return param
      },
      handleDelete(id) {
        var that = this
        deleteAction(this.url.deleteBatch, { ids: id }).then((res) => {
          if (res.code === 200) {
            that.loadData()
          } else {
            that.$message.warning(res.data.message)
          }
        })
      },
      handleAdd() {
        this.$refs.modalForm.add();
        this.$refs.modalForm.title = "新增字典类型";
        this.$refs.modalForm.disableSubmit = false;
      },
      handleEdit(record) {
        this.$refs.modalForm.edit(record);
        this.$refs.modalForm.title = "编辑字典类型";
        this.$refs.modalForm.disableSubmit = false;
      },
      // 字典数据弹窗
      handleDictData(record) {
        this.dictDataContext = { dictType: record.dictType, dictName: record.dictName }
        this.dictDataQuery = { dictLabel: '', status: '' }
        this.dictDataSelectedKeys = []
        this.dictDataPagination.current = 1
        this.dictDataVisible = true
        this.$nextTick(() => {
          this.loadDictData()
        })
      },
      closeDictDataModal() {
        this.dictDataVisible = false
        this.dictDataList = []
      },
      loadDictData(page) {
        if (page === 1) {
          this.dictDataPagination.current = 1
        }
        var params = {
          dictType: this.dictDataContext.dictType,
          pageNo: this.dictDataPagination.current,
          pageSize: this.dictDataPagination.pageSize
        }
        if (this.dictDataQuery.dictLabel) {
          params.dictLabel = this.dictDataQuery.dictLabel
        }
        if (this.dictDataQuery.status) {
          params.status = this.dictDataQuery.status
        }
        this.dictDataLoading = true
        getAction('/system/dict/data/list', params).then((res) => {
          if (res.code === 200) {
            this.dictDataList = res.data.rows
            this.dictDataPagination.total = res.data.total
          } else {
            this.$message.warning(res.data.message)
          }
        }).finally(() => {
          this.dictDataLoading = false
        })
      },
      resetDictDataQuery() {
        this.dictDataQuery = { dictLabel: '', status: '' }
        this.loadDictData(1)
      },
      onDictDataSelectChange(keys) {
        this.dictDataSelectedKeys = keys
      },
      handleDictDataTableChange(pagination) {
        if (pagination && pagination.current) {
          this.dictDataPagination = pagination
        }
        this.loadDictData()
      },
      handleDictDataAdd() {
        this.$refs.dictDataForm.add(this.dictDataContext.dictType)
        this.$refs.dictDataForm.title = "新增字典数据"
        this.$refs.dictDataForm.disableSubmit = false
      },
      handleDictDataEdit(record) {
        this.$refs.dictDataForm.edit(record)
        this.$refs.dictDataForm.title = "编辑字典数据"
        this.$refs.dictDataForm.disableSubmit = false
      },
      handleDictDataDelete(id) {
        var that = this
        deleteAction('/system/dict/data/delete', { ids: id }).then((res) => {
          if (res.code === 200) {
            that.loadDictData()
          } else {
            that.$message.warning(res.data.message)
          }
        })
      },
      batchDelDictData() {
        if (this.dictDataSelectedKeys.length <= 0) {
          this.$message.warning('请选择一条记录！')
          return
        }
        var that = this
        this.$confirm({
          title: '确认删除',
          content: '是否删除选中数据?',
          onOk: function () {
            var ids = that.dictDataSelectedKeys.join(',')
            that.dictDataLoading = true
            deleteAction('/system/dict/data/delete', { ids: ids }).then((res) => {
              if (res.code === 200) {
                that.loadDictData()
              } else {
                that.$message.warning(res.data.message)
              }
            }).finally(() => {
              that.dictDataLoading = false
            })
          }
        })
      },
      onDictDataFormOk() {
        this.loadDictData()
      }
    }
  }
</script>
<style scoped>
  @import '~@assets/less/common.less'
</style>
