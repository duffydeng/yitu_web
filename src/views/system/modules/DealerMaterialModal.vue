<template>
  <div ref="container">
    <a-modal
      :title="title"
      :width="1200"
      :visible="visible"
      :confirmLoading="confirmLoading"
      :getContainer="() => $refs.container"
      :maskStyle="{'top':'93px','left':'154px'}"
      :wrapClassName="wrapClassNameInfo()"
      :mask="isDesktop()"
      :maskClosable="false"
      @ok="handleOk"
      @cancel="handleCancel"
      cancelText="取消"
      okText="保存"
      style="top:5%;height: 90%;">
      <a-spin :spinning="confirmLoading">
        <!-- 经销商基本信息 -->
        <a-form layout="inline" style="margin-bottom: 16px;">
          <a-row :gutter="24">
            <a-col :md="12" :sm="24">
              <a-form-item label="经销商">
                <a-input v-model="dealerInfo.name" :read-only="true" style="border: none; box-shadow: none;" />
              </a-form-item>
            </a-col>
            <a-col :md="12" :sm="24">
              <a-form-item label="手机号">
                <a-input v-model="dealerInfo.phonenum" :read-only="true" style="border: none; box-shadow: none;" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
        
        <!-- 操作按钮 -->
        <div class="table-operator" style="margin-bottom: 16px;">
          <a-select
            v-model="selectedProductId"
            placeholder="请选择商品"
            style="width: 300px; margin-right: 8px;"
            show-search
            option-filter-prop="children"
            allow-clear
            @dropdownVisibleChange="onProductDropdownOpen"
          >
            <a-select-option v-for="item in productList" :key="item.id" :value="item.id">
              {{ item.name }}
            </a-select-option>
          </a-select>
          <a-button @click="handleAddMaterial" type="primary" icon="plus">添加商品</a-button>
          <a-button @click="handleBatchDelete" icon="delete" style="margin-left: 8px;">批量删除</a-button>
        </div>

        <!-- 商品明细列表 -->
        <a-table
          ref="materialTable"
          size="middle"
          bordered
          rowKey="id"
          :columns="materialColumns"
          :dataSource="materialDataSource"
          :pagination="materialPagination"
          :scroll="materialScroll"
          :loading="materialLoading"
          :row-selection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
          @change="handleTableChange"
        >
          <span slot="productName" slot-scope="text, record">
            <a-tooltip :title="text" placement="topLeft" :autoAdjustOverflow="true">
              {{ text }}
            </a-tooltip>
          </span>
        </a-table>
      </a-spin>
    </a-modal>
  </div>
</template>

<script>
  import { getAction, postAction, deleteAction } from '@/api/manage'

  export default {
    name: "DealerMaterialModal",
    components: {},
    data () {
      return {
        title: "商品明细管理",
        visible: false,
        confirmLoading: false,
        dealerInfo: {},
        isReadOnly: false,
        materialLoading: false,
        materialDataSource: [],
        selectedRowKeys: [],
        productList: [],
        selectedProductId: undefined,
        materialColumns: [
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
          { title: '产品名称', dataIndex: 'productName', ellipsis: true, scopedSlots: { customRender: 'productName' } }
        ],
        materialScroll: { x: true },
        materialPagination: {
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
        url: {
          list: '/dealerMaterial/listByDealerId',
          add: '/dealerMaterial/add',
          deleteMaterials: '/dealer/deleteMaterials'
        }
      }
    },
    methods: {
      edit (record) {
        this.dealerInfo = record
        this.visible = true
        this.selectedRowKeys = []
        this.selectedProductId = undefined
        this.loadMaterialData(record.id)
        this.loadProductList()
      },
      close () {
        this.$emit('close');
        this.visible = false;
      },
      handleOk () {
        this.close()
      },
      handleCancel () {
        this.close()
      },
      loadMaterialData(dealerId) {
        this.materialLoading = true
        let params = {
          dealerId: dealerId,
          pageNo: this.materialPagination.current,
          pageSize: this.materialPagination.pageSize
        }
        getAction(this.url.list, params).then(res => {
          if (res.code === 200) {
            let data = res.data
            let rows = (data && data.rows) || []
            this.materialDataSource = Array.isArray(rows) ? rows : []
            this.materialPagination.total = parseInt((data && data.total) || 0)
          } else {
            this.$message.warning(res.data || '获取数据失败')
            this.materialDataSource = []
            this.materialPagination.total = 0
          }
        }).catch(() => {
          this.materialDataSource = []
          this.materialPagination.total = 0
        }).finally(() => {
          this.materialLoading = false
        })
      },
      handleAddMaterial() {
        if (!this.selectedProductId) {
          this.$message.warning('请先选择商品！')
          return
        }
        const selectedProduct = this.productList.find(item => item.id === this.selectedProductId)
        this.confirmLoading = true
        let params = {
          dealerId: this.dealerInfo.id,
          bomId: this.selectedProductId,
          productName: selectedProduct ? selectedProduct.name : ''
        }
        postAction(this.url.add, params).then(res => {
          if (res.code === 200) {
            this.$message.success((res.data && res.data.message) || '添加成功')
            this.selectedProductId = undefined
            this.loadMaterialData(this.dealerInfo.id)
          } else {
            this.$message.error((res.data && res.data.message) || res.message || '添加失败')
          }
        }).finally(() => {
          this.confirmLoading = false
        })
      },
      onProductDropdownOpen(open) {
        if (open && this.productList.length === 0) {
          this.loadProductList()
        }
      },
      loadProductList() {
        getAction('/product/getParentList', {}).then(res => {
          if (res && res.code === 200) {
            let data = res.data
            if (Array.isArray(data)) {
              this.productList = data
            } else if (data && Array.isArray(data.rows)) {
              this.productList = data.rows
            } else {
              this.productList = []
            }
          } else {
            this.productList = []
          }
        }).catch(() => {
          this.productList = []
        })
      },
      handleBatchDelete() {
        if (this.selectedRowKeys.length === 0) {
          this.$message.warning('请选择要删除的商品！')
          return
        }
        
        let that = this
        this.$confirm({
          title: '确认删除',
          content: '确定要删除选中的 ' + this.selectedRowKeys.length + ' 条商品明细吗？',
          onOk: function () {
            that.confirmLoading = true
            let params = {
              ids: that.selectedRowKeys.join(',')
            }
            
            deleteAction(that.url.deleteMaterials, params).then((res) => {
              if (res.code === 200) {
                that.$message.success(res.data.message || '删除成功')
                that.loadMaterialData(that.dealerInfo.id)
                that.selectedRowKeys = []
              } else {
                that.$message.error(res.data.message || '删除失败')
              }
            }).finally(() => {
              that.confirmLoading = false
            })
          }
        })
      },
      onSelectChange(selectedRowKeys) {
        this.selectedRowKeys = selectedRowKeys
      },
      handleTableChange(pagination, filters, sorter) {
        this.materialPagination.current = pagination.current
        this.materialPagination.pageSize = pagination.pageSize
        this.loadMaterialData(this.dealerInfo.id)
      },
      isDesktop() {
        return window.innerWidth > 992;
      },
      wrapClassNameInfo() {
        return this.isDesktop() ? 'jeecg-modal-custom-info' : '';
      }
    }
  }
</script>

<style scoped>
  .table-operator {
    margin-bottom: 16px;
  }
</style>
