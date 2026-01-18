<!-- by 7527189 2 0 -->
<template>
  <div class="material-list-container">
    <!-- 左侧类别树 -->
    <div class="category-tree-panel" :class="{ 'collapsed': categoryTreeCollapsed }">
      <div class="category-tree-header" @click="toggleCategoryTree">
        <a-icon :type="categoryTreeCollapsed ? 'right' : 'left'" />
        <span v-if="!categoryTreeCollapsed">类别</span>
      </div>
      <div v-if="!categoryTreeCollapsed" class="category-tree-content">
        <a-tree
          :treeData="categoryTreeForSelect"
          :expandedKeys="categoryExpandedKeys"
          @expand="onCategoryExpand"
          @select="onCategoryTreeSelect"
          :selectedKeys="categorySelectedKeys"
          :defaultExpandAll="false"
        >
        </a-tree>
      </div>
    </div>
    <!-- 右侧主内容区 -->
    <div class="material-content-panel">
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :style="cardStyle" :bordered="false">
        <!-- 查询区域 -->
        <div class="table-page-search-wrapper">
          <!-- 搜索区域 -->
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="类别" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-tree-select style="width:100%" :dropdownStyle="{maxHeight:'200px',overflow:'auto'}" allow-clear
                   :treeData="categoryTree" v-model="queryParam.categoryId" placeholder="请选择类别">
                  </a-tree-select>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="关键词" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入条码、名称、助记码等查询" v-model="queryParam.materialParam"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="规格" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入规格查询" v-model="queryParam.standard"></a-input>
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
                  <a-form-item label="型号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input placeholder="请输入型号查询" v-model="queryParam.model"></a-input>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="请选择状态" v-model="queryParam.enabled">
                      <a-select-option value="1">启用</a-select-option>
                      <a-select-option value="0">禁用</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="序列号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="有无序列号" v-model="queryParam.enableSerialNumber">
                      <a-select-option value="1">有</a-select-option>
                      <a-select-option value="0">无</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="批号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="有无批号" v-model="queryParam.enableBatchNumber">
                      <a-select-option value="1">有</a-select-option>
                      <a-select-option value="0">无</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="仓位货架" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input style="width: 100%" placeholder="请输入仓位货架查询" v-model="queryParam.position"></a-input>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="基础重量" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input-number style="width: 100%" placeholder="请输入基础重量查询" v-model="queryParam.weight"></a-input-number>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="保质期" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input-number style="width: 100%" placeholder="请输入保质期查询" v-model="queryParam.expiryNum"></a-input-number>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="备注" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input placeholder="请输入备注查询" v-model="queryParam.remark"></a-input>
                  </a-form-item>
                </a-col>
              </a-row>
            </template>
          </a-form>
        </div>
        <!-- 操作按钮区域 -->
        <div class="table-operator"  style="margin-top: 5px">
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="handleAdd" type="primary" icon="plus">新增</a-button>
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="batchDel" icon="delete">删除</a-button>
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="batchSetStatus(true)" icon="check-square">启用</a-button>
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="batchSetStatus(false)" icon="close-square">禁用</a-button>
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="handleImportXls()" icon="import">导入</a-button>
          <a-button v-if="btnEnableList.indexOf(3)>-1" @click="handleExportXls('商品信息')" icon="download">导出</a-button>
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="batchEdit()" icon="edit">批量编辑</a-button>
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="batchSetMaterialCurrentStock()" icon="stock">修正库存</a-button>
          <a-button v-if="btnEnableList.indexOf(1)>-1" @click="batchSetMaterialCurrentUnitPrice()" icon="fund">修正成本</a-button>
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
            :components="handleDrag(columns)"
            :pagination="ipagination"
            :scroll="scroll"
            :loading="loading"
            :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange, columnWidth:'40px'}"
            @change="handleTableChange">
            <span slot="action" slot-scope="text, record">
              <a @click="handleEdit(record)">编辑</a>
              <a-divider v-if="btnEnableList.indexOf(1)>-1" type="vertical" />
              <a v-if="btnEnableList.indexOf(1)>-1" @click="handleCopyAdd(record)">复制</a>
            </span>
            <template slot="customPic" slot-scope="text, record">
              <a-popover placement="right" trigger="click">
                <template slot="content">
                  <img :src="getImgUrl(record.imgName, record.imgLarge)" width="500px" />
                </template>
                <div class="item-info" v-if="record.imgName">
                  <img v-if="record.imgName" :src="getImgUrl(record.imgName, record.imgSmall)" class="item-img" title="查看大图" />
                </div>
              </a-popover>
            </template>
            <template slot="customBarCode" slot-scope="text, record">
              {{record.mBarCode}}
            </template>
            <template slot="customName" slot-scope="text, record">
              {{record.name}}
              <a-tag v-if="record.enableSerialNumber==1" color="orange">序</a-tag>
              <a-tag v-if="record.enableBatchNumber==1" color="orange">批</a-tag>
            </template>
            <template slot="customRenderInitialStock" slot-scope="text, record">
              <a-tooltip :title="record.bigUnitInitialStock">
                {{text}}
              </a-tooltip>
            </template>
            <template slot="customRenderStock" slot-scope="text, record">
              <a-tooltip :title="record.bigUnitStock">
                {{text}}
              </a-tooltip>
            </template>
            <template slot="customRenderEnabled" slot-scope="enabled">
              <a-tag v-if="enabled" color="green">启用</a-tag>
              <a-tag v-if="!enabled" color="orange">禁用</a-tag>
            </template>
          </a-table>
        </div>
        <!-- table区域-end -->
        <!-- 表单区域 -->
        <material-modal ref="modalForm" @ok="modalFormOk"></material-modal>
        <import-file-modal ref="modalImportForm" @ok="modalFormOk"></import-file-modal>
        <batch-set-info-modal ref="batchSetInfoModalForm" @ok="modalFormOk"></batch-set-info-modal>
      </a-card>
    </a-col>
  </a-row>
    </div>
  </div>
</template>
<script>
  import MaterialModal from './modules/MaterialModal'
  import ImportFileModal from '@/components/tools/ImportFileModal'
  import BatchSetInfoModal from './modules/BatchSetInfoModal'
  import { queryMaterialCategoryTreeList } from '@/api/api'
  import { postAction, getFileAccessHttpUrl } from '@/api/manage'
  import { getMpListShort } from '@/utils/util'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import JEllipsis from '@/components/jeecg/JEllipsis'
  import JDate from '@/components/jeecg/JDate'
  import Vue from 'vue'

  export default {
    name: "MaterialList",
    mixins:[JeecgListMixin],
    components: {
      MaterialModal,
      ImportFileModal,
      BatchSetInfoModal,
      JEllipsis,
      JDate
    },
    data () {
      return {
        categoryTree:[],
        categoryTreeForSelect: [],
        categoryTreeCollapsed: false,
        categoryExpandedKeys: [],
        categorySelectedKeys: [],
        mPropertyListShort: '',
        model: {},
        labelCol: {
          span: 5
        },
        wrapperCol: {
          span: 18,
          offset: 1
        },
        queryTitle: {
          mp1: '扩展1',
          mp2: '扩展2',
          mp3: '扩展3'
        },
        // 查询条件
        queryParam: {
          categoryId: undefined,
          materialParam:'',
          standard:'',
          model:'',
          weight:'',
          expiryNum:'',
          enabled: undefined,
          enableSerialNumber: undefined,
          enableBatchNumber: undefined,
          position: '',
          remark:'',
          mpList: getMpListShort(Vue.ls.get('materialPropertyList'))  //扩展属性
        },
        urlPath: '/material/material',
        ipagination:{
          pageSizeOptions: ['10', '20', '30', '50', '100', '200']
        },
        // 实际索引
        settingDataIndex:[],
        // 实际列
        columns:[],
        // 默认索引
        defDataIndex:['action','mBarCode','name','standard','model','color','categoryName','unit', 'stock',
          'purchaseDecimal','commodityDecimal','wholesaleDecimal','lowDecimal','enabled'],
        // 默认列
        defColumns: [
          {
            title: '操作',
            dataIndex: 'action',
            align:"center",
            scopedSlots: { customRender: 'action' },
          },
          {title: '图片', dataIndex: 'pic', scopedSlots: { customRender: 'customPic' }},
          {title: '条码', dataIndex: 'mBarCode'},
          {title: '名称', dataIndex: 'name', scopedSlots: { customRender: 'customName' }},
          {title: '规格', dataIndex: 'standard'},
          {title: '型号', dataIndex: 'model'},
          {title: '颜色', dataIndex: 'color', ellipsis:true},
          {title: '品牌', dataIndex: 'brand', ellipsis:true},
          {title: '助记码', dataIndex: 'mnemonic', ellipsis:true},
          {title: '类别', dataIndex: 'categoryName', ellipsis:true},
          {title: '扩展1', dataIndex: 'otherField1', ellipsis:true},
          {title: '扩展2', dataIndex: 'otherField2', ellipsis:true},
          {title: '扩展3', dataIndex: 'otherField3', ellipsis:true},
          {title: '单位', dataIndex: 'unit', ellipsis:true,
            customRender:function (t,r,index) {
              if (r) {
                let name = t?t:r.unitName
                if(r.sku) {
                  return name + '[SKU]';
                } else {
                  return name;
                }
              }
            }
          },
          {title: '基础重量', dataIndex: 'weight'},
          {title: '保质期', dataIndex: 'expiryNum'},
          {title: '制造商', dataIndex: 'mfrs', ellipsis:true},
          {title: '初始库存', dataIndex: 'initialStock',
            scopedSlots: { customRender: 'customRenderInitialStock' }
          },
          {title: '库存', dataIndex: 'stock',
            scopedSlots: { customRender: 'customRenderStock' }
          },
          {title: '采购价', dataIndex: 'purchaseDecimal'},
          {title: '零售价', dataIndex: 'commodityDecimal'},
          {title: '销售价', dataIndex: 'wholesaleDecimal'},
          {title: '最低售价', dataIndex: 'lowDecimal'},
          {title: '仓位货架', dataIndex: 'position'},
          {title: '备注', dataIndex: 'remark'},
          {title: '状态', dataIndex: 'enabled', align: "center",
            scopedSlots: { customRender: 'customRenderEnabled' }
          }
        ],
        url: {
          list: "/material/list",
          delete: "/material/delete",
          deleteBatch: "/material/deleteBatch",
          importExcelUrl: "/material/importExcel",
          exportXlsUrl: "/material/exportExcel",
          batchSetStatusUrl: "/material/batchSetStatus",
          batchSetMaterialCurrentStockUrl: "/material/batchSetMaterialCurrentStock",
          batchSetMaterialCurrentUnitPriceUrl: "/material/batchSetMaterialCurrentUnitPrice",
        }
      }
    },
    created() {
      this.model = Object.assign({}, {});
      this.initColumnsSetting()
      this.loadTreeData()
      this.handleChangeOtherField(1)
    },
    computed: {
      importExcelUrl: function () {
        return `${window._CONFIG['domianURL']}${this.url.importExcelUrl}`;
      }
    },
    methods: {
      //加载初始化列
      initColumnsSetting(){
        let columnsStr = Vue.ls.get('materialColumns')
        if(columnsStr && columnsStr.indexOf(',')>-1) {
          this.settingDataIndex = columnsStr.split(',')
        } else {
          this.settingDataIndex = this.defDataIndex
        }
        this.columns = this.defColumns.filter(item => {
          return this.settingDataIndex.includes(item.dataIndex)
        })
      },
      //列设置更改事件
      onColChange (checkedValues) {
        this.columns = this.defColumns.filter(item => {
          return checkedValues.includes(item.dataIndex)
        })
        let columnsStr = checkedValues.join()
        Vue.ls.set('materialColumns', columnsStr)
      },
      //恢复默认
      handleRestDefault() {
        Vue.ls.remove('materialColumns')
        this.initColumnsSetting()
      },
      loadTreeData(){
        let that = this;
        let params = {};
        params.id='';
        queryMaterialCategoryTreeList(params).then((res)=>{
          if(res){
            that.categoryTree = [];
            that.categoryTreeForSelect = [];
            // 处理类别树，只显示两级
            for (let i = 0; i < res.length; i++) {
              let temp = JSON.parse(JSON.stringify(res[i])); // 深拷贝
              that.categoryTree.push(temp);
              // 处理用于选择的树，只保留两级
              let formattedNode = that.formatCategoryTreeNode(temp, 1);
              that.categoryTreeForSelect.push(formattedNode);
            }
          }
        })
      },
      // 格式化类别树节点，只显示两级
      formatCategoryTreeNode(node, level) {
        if (!node) return null;
        let formatted = {
          key: node.key || node.id,
          title: node.title || node.name,
          value: node.value || node.id,
          scopedSlots: { title: 'custom' }
        };
        // 只保留两级
        if (level === 1 && node.children && node.children.length > 0) {
          formatted.children = node.children.map(child => this.formatCategoryTreeNode(child, 2));
        } else {
          formatted.children = undefined;
        }
        return formatted;
      },
      // 类别树展开事件
      onCategoryExpand(expandedKeys) {
        this.categoryExpandedKeys = expandedKeys;
      },
      // 类别树选择事件
      onCategoryTreeSelect(selectedKeys, e) {
        if (selectedKeys && selectedKeys.length > 0) {
          this.categorySelectedKeys = selectedKeys;
          // 设置查询条件
          this.queryParam.categoryId = selectedKeys[0];
          // 自动查询
          this.searchQuery();
        } else {
          this.categorySelectedKeys = [];
          this.queryParam.categoryId = undefined;
          this.searchQuery();
        }
      },
      // 切换类别树折叠状态
      toggleCategoryTree() {
        this.categoryTreeCollapsed = !this.categoryTreeCollapsed;
      },
      batchSetMaterialCurrentStock () {
        if (this.selectedRowKeys.length <= 0) {
          this.$message.warning('请选择一条记录！');
        } else {
          let ids = "";
          for (let a = 0; a < this.selectedRowKeys.length; a++) {
            ids += this.selectedRowKeys[a] + ",";
          }
          let that = this;
          this.$confirm({
            title: "确认操作",
            content: "是否操作选中数据?",
            onOk: function () {
              that.loading = true;
              postAction(that.url.batchSetMaterialCurrentStockUrl, {ids: ids}).then((res) => {
                if(res.code === 200){
                  that.$message.info('修正库存成功！');
                  that.loadData();
                  that.onClearSelected();
                } else {
                  that.$message.warning(res.data.message);
                }
              }).finally(() => {
                that.loading = false;
              });
            }
          });
        }
      },
      batchSetMaterialCurrentUnitPrice () {
        if (this.selectedRowKeys.length <= 0) {
          this.$message.warning('请选择一条记录！');
        } else {
          let ids = "";
          for (let a = 0; a < this.selectedRowKeys.length; a++) {
            ids += this.selectedRowKeys[a] + ",";
          }
          let that = this;
          this.$confirm({
            title: "确认操作",
            content: "是否操作选中数据?",
            onOk: function () {
              that.loading = true;
              postAction(that.url.batchSetMaterialCurrentUnitPriceUrl, {ids: ids}).then((res) => {
                if(res.code === 200){
                  that.$message.info('修正成本成功！');
                  that.loadData();
                  that.onClearSelected();
                } else {
                  that.$message.warning(res.data.message);
                }
              }).finally(() => {
                that.loading = false;
              });
            }
          });
        }
      },
      batchEdit() {
        if (this.selectedRowKeys.length <= 0) {
          this.$message.warning('请选择一条记录！');
        } else {
          let ids = "";
          for (let a = 0; a < this.selectedRowKeys.length; a++) {
            if(a === this.selectedRowKeys.length-1) {
              ids += this.selectedRowKeys[a]
            } else {
              ids += this.selectedRowKeys[a] + ','
            }
          }
          this.$refs.batchSetInfoModalForm.edit(ids);
          this.$refs.batchSetInfoModalForm.title = "批量编辑";
        }
      },
      handleAdd: function () {
        this.$refs.modalForm.action = "add";
        this.$refs.modalForm.add();
        this.$refs.modalForm.title = "新增";
        this.$refs.modalForm.disableSubmit = false;
      },
      handleEdit: function (record) {
        this.$refs.modalForm.action = "edit";
        this.$refs.modalForm.edit(record);
        this.$refs.modalForm.title = "编辑";
        this.$refs.modalForm.disableSubmit = false;
        if(this.btnEnableList.indexOf(1)===-1) {
          this.$refs.modalForm.showOkFlag = false
        }
      },
      handleCopyAdd(record) {
        this.$refs.modalForm.action = "copyAdd";
        this.$refs.modalForm.edit(record);
        this.$refs.modalForm.title = "复制新增";
        this.$refs.modalForm.disableSubmit = false;
      },
      getImgUrl(imgName, type) {
        if(imgName && imgName.split(',')) {
          type = type? type + '/':''
          return getFileAccessHttpUrl('systemConfig/static/' + type + imgName.split(',')[0])
        } else {
          return ''
        }
      },
      handleImportXls() {
        let importExcelUrl = this.url.importExcelUrl
        let templateUrl = '/doc/goods_template.xls'
        let templateName = '商品Excel模板[下载]'
        this.$refs.modalImportForm.initModal(importExcelUrl, templateUrl, templateName);
        this.$refs.modalImportForm.title = "商品导入";
      },
      searchReset() {
        this.queryParam = {
          mpList: getMpListShort(Vue.ls.get('materialPropertyList'))  //扩展属性
        }
        this.loadData(1);
      }
    }
  }
</script>
<style scoped>
  @import '~@assets/less/common.less';
  
  .material-list-container {
    display: flex;
    width: 100%;
    height: 100%;
    position: relative;
  }
  
  .category-tree-panel {
    width: 250px;
    min-width: 250px;
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
  
  .material-content-panel {
    flex: 1;
    min-width: 0;
    padding-left: 12px;
  }
  
  .item-info {
    float:left;
    width:38px;
    height:38px;
    margin-left:6px
  }
  .item-img {
    cursor:pointer;
    position: static;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
</style>