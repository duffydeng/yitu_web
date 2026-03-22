<!--  --><template>
  <div class="product-list-container">
    <!-- 左侧类别树 -->
    <div class="category-tree-panel" :class="{ 'collapsed': categoryTreeCollapsed }">
      <div class="category-tree-header" @click="toggleCategoryTree">
        <a-icon :type="categoryTreeCollapsed ? 'right' : 'left'" />
        <span v-if="!categoryTreeCollapsed">类别</span>
      </div>
      <div v-if="!categoryTreeCollapsed" class="category-tree-content">
        <a-tree
          checkable
          :treeData="categoryTree"
          :expandedKeys="categoryExpandedKeys"
          @expand="onCategoryExpand"
          @check="onCategoryTreeCheck"
          :checkedKeys="categoryCheckedKeys"
          :defaultExpandAll="false"
        >
        </a-tree>
      </div>
    </div>
    <!-- 右侧主内容区 -->
    <div class="product-content-panel">
      <a-card :style="cardStyle" :bordered="false">
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="分类名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入分类名称查询" v-model="queryParam.name"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="产品类型" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-select v-model="queryParam.productType" placeholder="请选择产品类型" allow-clear>
                    <a-select-option value="商品">商品</a-select-option>
                    <a-select-option value="分类">分类</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
                  <a-button type="primary" @click="searchQuery">查询</a-button>
                  <a-button style="margin-left: 8px" @click="searchReset">重置</a-button>
                </span>
              </a-col>
            </a-row>
          </a-form>
        </div>

        <div class="table-operator" style="margin-top: 5px">
          <a-button @click="handleAdd" type="primary" icon="plus">新增</a-button>
          <a-button @click="batchDel" icon="delete">删除</a-button>
          <a-button @click="handleAddBarCodeDetail" icon="barcode">新增条码明细</a-button>
          <a-button @click="handleDeepCopy" icon="copy" :loading="copyLoading">一键复制</a-button>
        </div>

        <div>
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
            :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
            @change="handleTableChange">
            <span slot="action" slot-scope="text, record">
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除吗?" @confirm="() => handleDelete(record.id)">
                <a>删除</a>
              </a-popconfirm>
              <a-divider type="vertical" />
              <a @click="handleViewDetail(record)">查看明细</a>
            </span>
            <template slot="customRenderDeleteFlag" slot-scope="deleteFlag">
              <a-tag v-if="deleteFlag == 0 || deleteFlag == '0'" color="green">正常</a-tag>
              <a-tag v-else color="red">已删除</a-tag>
            </template>
            <template slot="customPic" slot-scope="text, record">
              <a-popover placement="right" trigger="click">
                <template slot="content">
                  <img :src="getImgUrl(record.imgUrl)" width="500px" />
                </template>
                <div v-if="record.imgUrl">
                  <img :src="getImgUrl(record.imgUrl)" style="width:40px;height:40px;object-fit:cover;cursor:pointer;" title="查看大图" />
                </div>
              </a-popover>
            </template>
          </a-table>
        </div>

        <product-category-modal ref="modalForm" @ok="modalFormOk"></product-category-modal>
        <j-select-material-modal ref="selectMaterialModal" :multi="true" @ok="selectMaterialOK" />

        <!-- 查看明细弹窗 -->
        <a-modal
          v-model="detailModal.visible"
          :title="detailModal.title"
          width="900px"
          :footer="null"
          destroyOnClose>
          <a-table
            size="middle"
            bordered
            rowKey="id"
            :columns="detailModal.columns"
            :dataSource="detailModal.dataSource"
            :pagination="{ total: detailModal.total, pageSize: detailModal.pageSize, current: detailModal.current, showSizeChanger: true, showTotal: t => '共 ' + t + ' 条' }"
            :loading="detailModal.loading"
            @change="handleDetailTableChange">
            <template slot="detailDeleteFlag" slot-scope="deleteFlag">
              <a-tag v-if="deleteFlag == 0 || deleteFlag == '0'" color="green">正常</a-tag>
              <a-tag v-else color="red">已删除</a-tag>
            </template>
          </a-table>
        </a-modal>
      </a-card>
    </div>
  </div>
</template>

<script>
  import ProductCategoryModal from './modules/ProductCategoryModal'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import { httpAction, getAction, getFileAccessHttpUrl } from '@/api/manage'
  import JSelectMaterialModal from '@/components/jeecgbiz/modal/JSelectMaterialModal'

  export default {
    name: 'ProductCategoryList',
    mixins: [JeecgListMixin],
    components: {
      ProductCategoryModal,
      JSelectMaterialModal
    },
    data () {
      return {
        labelCol: { span: 5 },
        wrapperCol: { span: 18, offset: 1 },
        queryParam: {
          name: '',
          productType: undefined,
          id: undefined
        },
        urlPath: '/product/category',
        columns: [
          {
            title: '#',
            dataIndex: '',
            key: 'rowIndex',
            width: 60,
            align: 'center',
            customRender: function (t, r, index) {
              return parseInt(index) + 1
            }
          },
          {
            title: '操作',
            dataIndex: 'action',
            width: 220,
            align: 'center',
            scopedSlots: { customRender: 'action' }
          },
          { title: '分类名称', dataIndex: 'name', width: 180, align: 'left' },
          { title: '父名称', dataIndex: 'parentName', width: 120, align: 'left' },
          { title: '产品类型', dataIndex: 'productType', width: 100, align: 'center' },
          { title: '价格', dataIndex: 'price', width: 100, align: 'right' },
          { title: '图片', dataIndex: 'imgUrl', width: 80, align: 'center', scopedSlots: { customRender: 'customPic' } },
          { title: '自定义1', dataIndex: 'otherField1', width: 120, align: 'left', ellipsis: true },
          { title: '自定义2', dataIndex: 'otherField2', width: 120, align: 'left', ellipsis: true },
          { title: '自定义3', dataIndex: 'otherField3', width: 120, align: 'left', ellipsis: true },
          { title: '自定义4', dataIndex: 'otherField4', width: 120, align: 'left', ellipsis: true },
          { title: '排序', dataIndex: 'seqNum', width: 80, align: 'center' },
          {
            title: '状态',
            dataIndex: 'deleteFlag',
            width: 100,
            align: 'center',
            scopedSlots: { customRender: 'customRenderDeleteFlag' }
          },
        ],
        url: {
          list: '/product/list',
          delete: '/product/delete',
          deleteBatch: '/product/deleteBatch',
          productTree: '/product/getProductTree'
        },
        currentProductId: '',
        copyLoading: false,
        detailModal: {
          visible: false,
          title: '',
          loading: false,
          dataSource: [],
          columns: [],
          total: 0,
          pageSize: 10,
          current: 1,
          productType: '',
          productId: ''
        },
        // 左侧类别树
        categoryTree: [],
        categoryTreeCollapsed: false,
        categoryExpandedKeys: [],
        categoryCheckedKeys: []
      }
    },
    created () {
      this.loadCategoryTree()
    },
    methods: {
      // 加载产品类别树（数据格式同 materialCategory/getMaterialCategoryTree）
      loadCategoryTree () {
        let that = this
        getAction(this.url.productTree, { id: '' }).then(res => {
          if (res) {
            that.categoryTree = []
            for (let i = 0; i < res.length; i++) {
              let temp = JSON.parse(JSON.stringify(res[i]))
              that.categoryTree.push(temp)
            }
          }
        })
      },
      // 类别树展开/折叠
      toggleCategoryTree () {
        this.categoryTreeCollapsed = !this.categoryTreeCollapsed
      },
      // 类别树展开事件
      onCategoryExpand (expandedKeys) {
        this.categoryExpandedKeys = expandedKeys
      },
      // 类别树勾选事件（多选），勾选后自动查询
      onCategoryTreeCheck (checkedKeys) {
        let keys = Array.isArray(checkedKeys) ? checkedKeys : checkedKeys.checked
        this.categoryCheckedKeys = keys
        if (keys && keys.length > 0) {
          this.queryParam.id = keys.join(',')
        } else {
          this.queryParam.id = undefined
        }
        this.loadData(1)
      },
      getImgUrl (imgUrl) {
        if (imgUrl && imgUrl.split(',')[0]) {
          return getFileAccessHttpUrl('systemConfig/static/' + imgUrl.split(',')[0])
        }
        return ''
      },
      // 重写 searchReset，同时清除树选中
      searchReset () {
        this.queryParam = { name: '', productType: undefined, id: undefined }
        this.categoryCheckedKeys = []
        this.loadData(1)
      },
      handleDeepCopy () {
        if (!this.selectedRowKeys || this.selectedRowKeys.length !== 1) {
          this.$message.warning('请选择一条产品记录！')
          return
        }
        let parentId = this.selectedRowKeys[0]
        this.copyLoading = true
        httpAction('/product/deepCopyByParentId?parentId=' + parentId, {}, 'get').then((res) => {
          if (res && res.code === 200) {
            this.$message.success((res.message || res.data && res.data.message) || '复制成功')
            this.loadData()
          } else {
            this.$message.warning((res && res.message) || '复制失败')
          }
        }).finally(() => {
          this.copyLoading = false
        })
      },
      handleAddBarCodeDetail () {
        if (!this.selectedRowKeys || this.selectedRowKeys.length !== 1) {
          this.$message.warning('请选择一条产品记录！')
          return
        }
        this.currentProductId = this.selectedRowKeys[0]
        if (this.$refs.selectMaterialModal && typeof this.$refs.selectMaterialModal.showModal === 'function') {
          this.$refs.selectMaterialModal.showModal()
        }
      },
      handleViewDetail (record) {
        let productType = record.productType
        if (productType !== '商品' && productType !== '分类') {
          this.$message.warning('产品类型须为"商品"或"分类"！')
          return
        }
        this.detailModal.productId = record.id
        this.detailModal.productType = productType
        this.detailModal.current = 1
        if (productType === '商品') {
          this.detailModal.title = '商品明细'
          this.detailModal.columns = [
            { title: '#', key: 'rowIndex', width: 60, align: 'center', customRender: (t, r, index) => parseInt(index) + 1 },
            { title: '名称', dataIndex: 'name', align: 'left' },
            { title: '产品类型', dataIndex: 'productType', width: 100, align: 'center' },
            { title: '状态', dataIndex: 'deleteFlag', width: 80, align: 'center', scopedSlots: { customRender: 'detailDeleteFlag' } }
          ]
        } else {
          this.detailModal.title = '分类关联明细'
          this.detailModal.columns = [
            { title: '#', key: 'rowIndex', width: 60, align: 'center', customRender: (t, r, index) => parseInt(index) + 1 },
            { title: '产品名称', dataIndex: 'productName', align: 'left' },
            { title: '物料名称', dataIndex: 'materialName', align: 'left' },
            { title: '条码', dataIndex: 'barCode', width: 150, align: 'center' },
            { title: '小程序描述', dataIndex: 'otherField1', align: 'left' },
            { title: '状态', dataIndex: 'deleteFlag', width: 80, align: 'center', scopedSlots: { customRender: 'detailDeleteFlag' } }
          ]
        }
        this.detailModal.visible = true
        this.loadDetailData()
      },
      loadDetailData () {
        let { productId, productType, current, pageSize } = this.detailModal
        let baseUrl = productType === '商品' ? '/product/detailProductList' : '/product/detailRelationList'
        let url = baseUrl + '?id=' + productId
        let params = { pageNo: current, pageSize }
        this.detailModal.loading = true
        httpAction(url, params, 'get').then((res) => {
          if (res && res.code === 200) {
            this.detailModal.dataSource = (res.data && res.data.rows) || []
            this.detailModal.total = parseInt((res.data && res.data.total) || 0)
          } else {
            this.$message.warning((res && res.message) || '获取明细失败')
          }
        }).finally(() => {
          this.detailModal.loading = false
        })
      },
      handleDetailTableChange (pagination) {
        this.detailModal.current = pagination.current
        this.detailModal.pageSize = pagination.pageSize
        this.loadDetailData()
      },
      selectMaterialOK (rows) {
        if (!this.currentProductId) {
          this.$message.warning('请先选择一条产品记录！')
          return
        }
        if (!rows || !Array.isArray(rows) || rows.length === 0) {
          this.$message.warning('请选择物料明细！')
          return
        }
        let materialIds = rows.map(r => r.id).filter(id => id)
        materialIds = Array.from(new Set(materialIds))
        let params = {
          productId: this.currentProductId,
          materialIds: materialIds
        }
        httpAction('/productMaterialRelation/batchAdd', params, 'post').then((res) => {
          if (res && res.code === 200) {
            this.$message.success((res.data && res.data.message) || '成功')
          } else {
            this.$message.warning((res && res.data && res.data.message) || (res && res.message) || '保存失败')
          }
        })
      }
    }
  }
</script>

<style scoped>
  @import '~@assets/less/common.less';

  .product-list-container {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
  }

  .category-tree-panel {
    width: 220px;
    min-width: 220px;
    background: #fff;
    border-right: 1px solid #e8e8e8;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
  }

  .category-tree-panel.collapsed {
    width: 40px;
    min-width: 40px;
  }

  .category-tree-header {
    height: 48px;
    line-height: 48px;
    padding: 0 12px;
    border-bottom: 1px solid #e8e8e8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    user-select: none;
    background: #fafafa;
  }

  .category-tree-header:hover {
    background: #f0f0f0;
  }

  .category-tree-header i {
    font-size: 16px;
    color: #666;
  }

  .category-tree-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .category-tree-panel.collapsed .category-tree-content {
    display: none;
  }

  .product-content-panel {
    flex: 1;
    min-width: 0;
    overflow: auto;
  }
</style>
