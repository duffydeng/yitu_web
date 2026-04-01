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
        <j-select-product-modal ref="selectProductModal" :multi="true" @ok="onSelectProductOK" />

        <!-- 查看明细弹窗 -->
        <a-modal
          v-model="detailModal.visible"
          :width="detailModal.fullscreen ? '100%' : '960px'"
          :style="detailModal.fullscreen ? 'top:0;padding:0;max-width:100vw;' : 'top:40px;'"
          :footer="null"
          :bodyStyle="detailModal.fullscreen ? { height: 'calc(100vh - 55px)', overflowY: 'auto' } : {}"
          :wrapClassName="detailModal.fullscreen ? 'detail-modal-fullscreen' : ''"
          destroyOnClose>
          <span slot="title" class="detail-modal-title">
            {{ detailModal.title }}
            <a-icon
              :type="detailModal.fullscreen ? 'fullscreen-exit' : 'fullscreen'"
              class="detail-modal-fullscreen-btn"
              @click.stop="toggleDetailFullscreen"
            />
          </span>
          <!-- 工具栏 -->
          <div style="margin-bottom:8px;">
            <a-button type="primary" icon="plus" size="small" @click="handleDetailAdd">新增</a-button>
          </div>
          <a-table
            size="middle"
            bordered
            rowKey="id"
            :columns="detailModal.columns"
            :dataSource="detailModal.dataSource"
            :pagination="{ total: detailModal.total, pageSize: detailModal.pageSize, current: detailModal.current, showSizeChanger: true, showTotal: t => '共 ' + t + ' 条' }"
            :loading="detailModal.loading"
            @change="handleDetailTableChange">
            <span slot="detailDeleteFlag" slot-scope="deleteFlag">
              <a-tag v-if="deleteFlag == 0 || deleteFlag == '0'" color="green">正常</a-tag>
              <a-tag v-else color="red">已删除</a-tag>
            </span>
            <!-- 关联明细行内编辑字段 -->
            <span slot="editBarCode" slot-scope="text, record">
              <a-input
                v-if="detailModal.editingId === record.id"
                v-model="detailModal.editingRecord.barCode"
                size="small"
                style="width:130px;"
              />
              <span v-else>{{ text }}</span>
            </span>
            <span slot="editOtherField1" slot-scope="text, record">
              <a-input
                v-if="detailModal.editingId === record.id"
                v-model="detailModal.editingRecord.otherField1"
                size="small"
              />
              <span v-else>{{ text }}</span>
            </span>
            <!-- 商品明细行内编辑字段 -->
            <span slot="editProductName" slot-scope="text, record">
              <a-input
                v-if="detailModal.editingId === record.id"
                v-model="detailModal.editingRecord.name"
                size="small"
              />
              <span v-else>{{ text }}</span>
            </span>
            <span slot="editProductType" slot-scope="text, record">
              <a-select
                v-if="detailModal.editingId === record.id"
                v-model="detailModal.editingRecord.productType"
                size="small"
                style="width:90px;"
              >
                <a-select-option value="商品">商品</a-select-option>
                <a-select-option value="分类">分类</a-select-option>
              </a-select>
              <span v-else>{{ text }}</span>
            </span>
            <!-- 操作列 -->
            <span slot="detailAction" slot-scope="text, record">
              <span v-if="detailModal.editingId === record.id">
                <a @click="handleDetailSave(record)">保存</a>
                <a-divider type="vertical" />
                <a @click="handleDetailCancel">取消</a>
              </span>
              <span v-else>
                <a @click="handleDetailEdit(record)">编辑</a>
                <a-divider type="vertical" />
                <a-popconfirm title="确定删除吗?" @confirm="handleDetailDelete(record)">
                  <a style="color:#f5222d;">删除</a>
                </a-popconfirm>
                <span v-if="detailModal.productType === '分类'">
                  <a-divider type="vertical" />
                  <a @click="handleBindBarCode(record)">关联条码</a>
                  <a-divider type="vertical" />
                  <a @click="handleOpenRelationDetail(record)">联动明细</a>
                </span>
              </span>
            </span>
          </a-table>
        </a-modal>

        <!-- 联动明细弹窗 -->
        <a-modal
          v-model="relationDetailModal.visible"
          width="860px"
          :title="relationDetailModal.title"
          :footer="null"
          style="top:60px;"
          destroyOnClose>
          <a-table
            size="middle"
            bordered
            rowKey="id"
            :columns="relationDetailModal.columns"
            :dataSource="relationDetailModal.dataSource"
            :pagination="{ total: relationDetailModal.total, pageSize: relationDetailModal.pageSize, current: relationDetailModal.current, showSizeChanger: true, showTotal: t => '共 ' + t + ' 条' }"
            :loading="relationDetailModal.loading"
            @change="handleRelationDetailTableChange">
            <span slot="editSunBarCode" slot-scope="text, record">
              <a-input
                v-if="relationDetailModal.editingId === record.id"
                v-model="relationDetailModal.editingRecord.sunBarCode"
                size="small"
                style="width:140px;"
              />
              <span v-else>{{ text }}</span>
            </span>
            <span slot="relationAction" slot-scope="text, record">
              <span v-if="relationDetailModal.editingId === record.id">
                <a @click="handleRelationSave(record)">保存</a>
                <a-divider type="vertical" />
                <a @click="handleRelationCancel">取消</a>
              </span>
              <span v-else>
                <a @click="handleRelationEdit(record)">编辑</a>
                <a-divider type="vertical" />
                <a-popconfirm title="确定删除吗?" @confirm="handleRelationDelete(record)">
                  <a style="color:#f5222d;">删除</a>
                </a-popconfirm>
              </span>
            </span>
          </a-table>
        </a-modal>
      </a-card>
    </div>
  </div>
</template>

<script>
  import ProductCategoryModal from './modules/ProductCategoryModal'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import { httpAction, getAction, deleteAction, getFileAccessHttpUrl } from '@/api/manage'
  import JSelectMaterialModal from '@/components/jeecgbiz/modal/JSelectMaterialModal'
  import JSelectProductModal from '@/components/jeecgbiz/modal/JSelectProductModal'

  export default {
    name: 'ProductCategoryList',
    mixins: [JeecgListMixin],
    components: {
      ProductCategoryModal,
      JSelectMaterialModal,
      JSelectProductModal
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
          productId: '',
          fullscreen: false,
          editingId: '',
          editingRecord: {}
        },
        detailAddMode: false,
        bindBarCodeRow: null,
        relationDetailModal: {
          visible: false,
          title: '',
          loading: false,
          dataSource: [],
          total: 0,
          pageSize: 10,
          current: 1,
          productMaterialId: '',
          editingId: '',
          editingRecord: {},
          columns: [
            { title: '#', key: 'rowIndex', width: 60, align: 'center', customRender: (t, r, index) => parseInt(index) + 1 },
            { title: '子条码', dataIndex: 'sunBarCode', width: 160, align: 'center', scopedSlots: { customRender: 'editSunBarCode' } },
            { title: '子条码名称', dataIndex: 'sunBarName', align: 'left', ellipsis: true },
            { title: '操作', key: 'action', width: 130, align: 'center', scopedSlots: { customRender: 'relationAction' } }
          ]
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
      // 重写 modalFormOk，新增/修改成功后同时刷新类别树和列表
      modalFormOk() {
        this.loadData()
        this.loadCategoryTree()
      },
      // 重写 handleDelete，删除成功后同时刷新类别树和列表
      handleDelete(id) {
        var that = this
        this.$confirm({
          title: "确认删除",
          content: "确定删除该条记录吗?",
          okText: "确认",
          cancelText: "取消",
          onOk: function() {
            deleteAction(that.url.delete, {id: id}).then((res) => {
              if(res.code === 200){
                that.loadData()
                that.loadCategoryTree()
              } else {
                that.$message.warning(res.message)
              }
            });
          }
        })
      },
      // 重写 batchDel，批量删除成功后同时刷新类别树和列表
      batchDel() {
        if(!this.url.deleteBatch){
          this.$message.error("请设置url.deleteBatch属性!")
          return
        }
        if (this.selectedRowKeys.length <= 0) {
          this.$message.warning('请选择一条记录！');
          return;
        }
        var that = this
        this.$confirm({
          title: "确认删除",
          content: "确定删除选中的记录吗?",
          okText: "确认",
          cancelText: "取消",
          onOk: function() {
            deleteAction(that.url.deleteBatch, {ids: that.selectedRowKeys.join(',')}).then((res) => {
              if(res.code === 200){
                that.loadData()
                that.loadCategoryTree()
              } else {
                that.$message.warning(res.message)
              }
            });
          }
        })
      },
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
        this.detailAddMode = false
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
        this.detailModal.fullscreen = false
        this.detailModal.editingId = ''
        this.detailModal.editingRecord = {}
        if (productType === '商品') {
          this.detailModal.title = '商品明细'
          this.detailModal.columns = [
            { title: '#', key: 'rowIndex', width: 60, align: 'center', customRender: (t, r, index) => parseInt(index) + 1 },
            { title: '名称', dataIndex: 'name', align: 'left', scopedSlots: { customRender: 'editProductName' } },
            { title: '产品类型', dataIndex: 'productType', width: 110, align: 'center', scopedSlots: { customRender: 'editProductType' } },
            { title: '状态', dataIndex: 'deleteFlag', width: 80, align: 'center', scopedSlots: { customRender: 'detailDeleteFlag' } },
            { title: '操作', key: 'action', width: 120, align: 'center', scopedSlots: { customRender: 'detailAction' } }
          ]
        } else {
          this.detailModal.title = '分类关联明细'
          this.detailModal.columns = [
            { title: '#', key: 'rowIndex', width: 60, align: 'center', customRender: (t, r, index) => parseInt(index) + 1 },
            { title: '产品名称', dataIndex: 'productName', align: 'left' },
            { title: '物料名称', dataIndex: 'materialName', align: 'left' },
            { title: '条码', dataIndex: 'barCode', width: 150, align: 'center', scopedSlots: { customRender: 'editBarCode' } },
            { title: '小程序描述', dataIndex: 'otherField1', align: 'left', scopedSlots: { customRender: 'editOtherField1' } },
            { title: '状态', dataIndex: 'deleteFlag', width: 80, align: 'center', scopedSlots: { customRender: 'detailDeleteFlag' } },
            { title: '操作', key: 'action', width: 120, align: 'center', scopedSlots: { customRender: 'detailAction' } }
          ]
        }
        this.detailModal.visible = true
        this.loadDetailData()
      },
      loadDetailData () {
        let { productId, productType, current, pageSize } = this.detailModal
        let baseUrl = productType === '商品' ? '/product/detailProductList' : '/product/detailRelationList'
        let url = baseUrl + '?id=' + productId+'&current='+current+'&pageSize='+pageSize
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
        let productId = this.detailAddMode ? this.detailModal.productId : this.currentProductId
        if (!productId) {
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
          productId: productId,
          materialIds: materialIds
        }
        httpAction('/productMaterialRelation/add', params, 'post').then((res) => {
          if (res && res.code === 200) {
            this.$message.success((res.data && res.data.message) || '成功')
            if (this.detailAddMode) {
              this.loadDetailData()
            }
          } else {
            this.$message.warning((res && res.data && res.data.message) || (res && res.message) || '保存失败')
          }
        })
      },
      // 明细弹窗全屏切换
      toggleDetailFullscreen () {
        this.detailModal.fullscreen = !this.detailModal.fullscreen
      },
      // 明细弹窗新增
      handleDetailAdd () {
        if (this.detailModal.productType === '分类') {
          this.detailAddMode = true
          if (this.$refs.selectMaterialModal && typeof this.$refs.selectMaterialModal.showModal === 'function') {
            this.$refs.selectMaterialModal.showModal()
          }
        } else {
          // 商品明细新增：打开 ProductCategoryModal，parentId 默认设置为当前产品
          let defaultRecord = { parentId: this.detailModal.productId, productType: '商品' }
          this.$refs.modalForm.edit(defaultRecord)
          this.$refs.modalForm.$once('ok', () => {
            this.loadDetailData()
          })
        }
      },
      // 明细行内编辑开始
      handleDetailEdit (record) {
        this.detailModal.editingId = record.id
        this.detailModal.editingRecord = Object.assign({}, record)
      },
      // 明细行内编辑保存
      handleDetailSave (record) {
        let editRec = this.detailModal.editingRecord
        let url, method, params
        if (this.detailModal.productType === '商品') {
          url = '/product/edit'
          method = 'put'
          params = Object.assign({}, record, { name: editRec.name, productType: editRec.productType })
        } else {
          url = '/productMaterialRelation/update'
          method = 'put'
          params = Object.assign({}, record, { barCode: editRec.barCode, otherField1: editRec.otherField1 })
        }
        httpAction(url, params, method).then((res) => {
          if (res && res.code === 200) {
            this.$message.success('保存成功')
            this.detailModal.editingId = ''
            this.detailModal.editingRecord = {}
            this.loadDetailData()
          } else {
            this.$message.warning((res && res.message) || '保存失败')
          }
        })
      },
      // 明细行内编辑取消
      handleDetailCancel () {
        this.detailModal.editingId = ''
        this.detailModal.editingRecord = {}
      },
      // 明细删除
      handleDetailDelete (record) {
        let url, method
        if (this.detailModal.productType === '商品') {
          url = '/product/delete?id=' + record.id
          method = 'delete'
        } else {
          url = '/productMaterialRelation/delete?id=' + record.id
          method = 'delete'
        }
        httpAction(url, {}, method).then((res) => {
          if (res && res.code === 200) {
            this.$message.success('删除成功')
            this.loadDetailData()
          } else {
            this.$message.warning((res && res.message) || '删除失败')
          }
        })
      },
      // 打开联动商品弹窗
      handleBindBarCode (record) {
        this.bindBarCodeRow = record
        if (this.$refs.selectProductModal && typeof this.$refs.selectProductModal.showModal === 'function') {
          this.$refs.selectProductModal.showModal()
        }
      },
      // 联动商品选择回调
      onSelectProductOK (rows) {
        if (!this.bindBarCodeRow) {
          this.$message.warning('请先选择明细行！')
          return
        }
        if (!rows || rows.length === 0) {
          this.$message.warning('请选择商品！')
          return
        }
        let sunBarCodes = rows.map(r => r.mBarCode).filter(c => c)
        if (sunBarCodes.length === 0) {
          this.$message.warning('所选商品暂无条码数据！')
          return
        }
        let params = {
          productMaterialId: this.bindBarCodeRow.id,
          sunBarCodes: sunBarCodes
        }
        httpAction('/materialRelation/bindBarCodes', params, 'post').then((res) => {
          if (res && res.code === 200) {
            this.$message.success((res.message || (res.data && res.data.message)) || '联动成功')
            this.bindBarCodeRow = null
          } else {
            this.$message.warning((res && res.message) || '联动失败')
          }
        })
      },
      // 打开联动明细弹窗
      handleOpenRelationDetail (record) {
        this.relationDetailModal.productMaterialId = record.id
        this.relationDetailModal.title = '联动明细 - ' + (record.barCode || record.materialName || record.id)
        this.relationDetailModal.current = 1
        this.relationDetailModal.editingId = ''
        this.relationDetailModal.editingRecord = {}
        this.relationDetailModal.visible = true
        this.loadRelationDetailData()
      },
      // 加载联动明细数据
      loadRelationDetailData () {
        let { productMaterialId, current, pageSize } = this.relationDetailModal
        this.relationDetailModal.loading = true
        getAction('/materialRelation/list', {
          search: JSON.stringify({ productMaterialId }),
          currentPage: current,
          pageSize
        }).then((res) => {
          if (res && res.code === 200) {
            let data = res.data
            this.relationDetailModal.dataSource = (data && data.rows) || []
            this.relationDetailModal.total = parseInt((data && data.total) || 0)
          } else {
            this.$message.warning((res && res.message) || '获取联动明细失败')
          }
        }).finally(() => {
          this.relationDetailModal.loading = false
        })
      },
      // 联动明细分页
      handleRelationDetailTableChange (pagination) {
        this.relationDetailModal.current = pagination.current
        this.relationDetailModal.pageSize = pagination.pageSize
        this.loadRelationDetailData()
      },
      // 联动明细行内编辑开始
      handleRelationEdit (record) {
        this.relationDetailModal.editingId = record.id
        this.relationDetailModal.editingRecord = Object.assign({}, record)
      },
      // 联动明细行内编辑保存
      handleRelationSave (record) {
        let editRec = this.relationDetailModal.editingRecord
        let params = Object.assign({}, record, {
          sunBarCode: editRec.sunBarCode
        })
        httpAction('/materialRelation/update', params, 'put').then((res) => {
          if (res && res.code === 200) {
            this.$message.success('保存成功')
            this.relationDetailModal.editingId = ''
            this.relationDetailModal.editingRecord = {}
            this.loadRelationDetailData()
          } else {
            this.$message.warning((res && res.message) || '保存失败')
          }
        })
      },
      // 联动明细行内编辑取消
      handleRelationCancel () {
        this.relationDetailModal.editingId = ''
        this.relationDetailModal.editingRecord = {}
      },
      // 联动明细删除
      handleRelationDelete (record) {
        httpAction('/materialRelation/delete?id=' + record.id, {}, 'delete').then((res) => {
          if (res && res.code === 200) {
            this.$message.success('删除成功')
            this.loadRelationDetailData()
          } else {
            this.$message.warning((res && res.message) || '删除失败')
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

  .detail-modal-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-right: 24px;
  }

  .detail-modal-fullscreen-btn {
    font-size: 16px;
    color: #666;
    cursor: pointer;
    transition: color 0.2s;
  }

  .detail-modal-fullscreen-btn:hover {
    color: #1890ff;
  }

  .detail-modal-fullscreen >>> .ant-modal {
    max-width: 100vw;
    margin: 0;
  }

  .detail-modal-fullscreen >>> .ant-modal-content {
    height: 100vh;
    border-radius: 0;
  }

  .detail-modal-fullscreen >>> .ant-modal-body {
    height: calc(100vh - 55px);
    overflow-y: auto;
  }
</style>
