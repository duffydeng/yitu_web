<template>
  <a-modal
    :width="1000"
    :visible="visible"
    :title="title"
    :wrapClassName="wrapClassNameInfo()"
    @ok="handleSubmit"
    @cancel="close"
    cancelText="关闭(ESC)"
    style="top:20px;height: 95%;"
  >
    <a-row :gutter="10" style="padding: 10px; margin: -10px">
      <a-col :md="24" :sm="24">
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="onSearch">
            <a-row :gutter="24">
              <a-col :md="8" :sm="24">
                <a-form-item label="关键词" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input ref="keyword" placeholder="请输入名称查询" v-model="queryParam.name"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <a-form-item label="类型" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-select v-model="queryParam.productType" placeholder="请选择" allow-clear>
                    <a-select-option value="商品">商品</a-select-option>
                    <a-select-option value="分类">分类</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="8" :sm="24">
                <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
                  <a-button type="primary" @click="loadData(1)">查询</a-button>
                  <a-button style="margin-left: 8px" @click="searchReset">重置</a-button>
                </span>
              </a-col>
            </a-row>
          </a-form>
        </div>
        <a-table
          ref="table"
          size="middle"
          rowKey="id"
          :columns="columns"
          :dataSource="dataSource"
          :pagination="ipagination"
          :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange, type: getType}"
          :loading="loading"
          @change="handleTableChange">
        </a-table>
      </a-col>
    </a-row>
  </a-modal>
</template>

<script>
  import { getAction } from '@/api/manage'
  import { mixinDevice } from '@/utils/mixin'

  export default {
    name: 'JSelectProductModal',
    mixins: [mixinDevice],
    props: ['multi'],
    data () {
      return {
        visible: false,
        title: '选择商品(产品列表)',
        loading: false,
        queryParam: {
          name: '',
          productType: undefined
        },
        labelCol: { span: 5 },
        wrapperCol: { span: 18, offset: 1 },
        columns: [
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
          { title: '产品名称', dataIndex: 'name', width: 260, ellipsis: true },
          { title: '类型', dataIndex: 'productType', width: 100, align: 'center' },
          { title: '父级ID', dataIndex: 'parentId', width: 120, align: 'center' }
        ],
        dataSource: [],
        selectedRowKeys: [],
        selectionRows: [],
        ipagination: {
          current: 1,
          pageSize: 10,
          pageSizeOptions: ['10', '20', '30', '50', '100'],
          showTotal: (total, range) => {
            return range[0] + '-' + range[1] + ' 共' + total + '条'
          },
          showQuickJumper: true,
          showSizeChanger: true,
          total: 0
        }
      }
    },
    computed: {
      getType: function () {
        return this.multi == true ? 'checkbox' : 'radio'
      }
    },
    methods: {
      showModal () {
        this.visible = true
        this.$nextTick(() => this.$refs.keyword && this.$refs.keyword.focus())
        this.loadData(1)
      },
      close () {
        this.visible = false
        this.onClearSelected()
      },
      onClearSelected () {
        this.selectedRowKeys = []
        this.selectionRows = []
      },
      onSelectChange (selectedRowKeys, selectionRows) {
        this.selectedRowKeys = selectedRowKeys
        this.selectionRows = selectionRows
      },
      searchReset () {
        this.queryParam = { name: '', productType: undefined }
        this.loadData(1)
      },
      onSearch () {
        this.loadData(1)
      },
      handleTableChange (pagination) {
        this.ipagination = pagination
        this.loadData()
      },
      loadData (arg) {
        if (arg === 1) {
          this.ipagination.current = 1
        }
        this.loading = true
        let params = {
          pageNo: this.ipagination.current,
          pageSize: this.ipagination.pageSize
        }
        if (this.queryParam.name) {
          params.name = this.queryParam.name
        }
        if (this.queryParam.productType) {
          params.productType = this.queryParam.productType
        }
        getAction('/product/getParentList', params).then((res) => {
          if (res && res.code === 200) {
            let data = res.data
            if (Array.isArray(data)) {
              this.dataSource = data
              this.ipagination.total = data.length
            } else {
              this.dataSource = (data && data.rows) || []
              this.ipagination.total = parseInt((data && data.total) || 0)
            }
          } else {
            this.dataSource = []
            this.ipagination.total = 0
          }
          this.onClearSelected()
        }).finally(() => {
          this.loading = false
        })
      },
      handleSubmit () {
        if (!this.selectionRows || this.selectionRows.length === 0) {
          this.$message.warning('请选择商品！')
          return
        }
        this.$emit('ok', this.selectionRows, this.selectedRowKeys)
        this.close()
      }
    }
  }
</script>
