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
                <a-form-item label="经销商姓名" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入经销商姓名查询" v-model="queryParam.name"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="手机号码" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入手机号码查询" v-model="queryParam.phonenum"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-select v-model="queryParam.status" placeholder="请选择状态" allow-clear>
                    <a-select-option :value="0">正常</a-select-option>
                    <a-select-option :value="2">封禁</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
                  <a-button type="primary" @click="searchQuery">查询</a-button>
                  <a-button style="margin-left: 8px" @click="searchReset">重置</a-button>
                  <a @click="handleToggleSearch" style="margin-left: 8px">
                    {{ toggleSearchStatus ? '收起' : '展开' }}
                    <a-icon :type="toggleSearchStatus ? 'up' : 'down'"/>
                  </a>
                </span>
              </a-col>
            </a-row>
            <template v-if="toggleSearchStatus">
              <a-row :gutter="24">
                <a-col :md="6" :sm="24">
                  <a-form-item label="是否二级经销商" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select v-model="queryParam.twoLevelDealerIs" placeholder="请选择" allow-clear>
                      <a-select-option :value="0">否</a-select-option>
                      <a-select-option :value="1">是</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="登录用户名" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input placeholder="请输入登录用户名查询" v-model="queryParam.loginName"></a-input>
                  </a-form-item>
                </a-col>
              </a-row>
            </template>
          </a-form>
        </div>
        
        <!-- 操作按钮区域 -->
        <div class="table-operator" style="margin-top: 5px">
          <a-button @click="handleAdd" type="primary" icon="plus">新增</a-button>
          <a-button @click="batchDel" icon="delete">删除</a-button>
          <a-button @click="batchSetStatus(0)" icon="check-square">启用</a-button>
          <a-button @click="batchSetStatus(2)" icon="close-square">封禁</a-button>
          <a-button @click="handleImportXls()" icon="import">导入</a-button>
          <a-button @click="handleExportXls('经销商信息')" icon="download">导出</a-button>
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
            :pagination="ipagination"
            :scroll="scroll"
            :loading="loading"
            :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}"
            @change="handleTableChange">
            <span slot="action" slot-scope="text, record">
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a @click="handleManageMaterial(record)">商品明细</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除吗?" @confirm="() => handleDelete(record.id)">
                <a>删除</a>
              </a-popconfirm>
            </span>
            <!-- 状态渲染模板 -->
            <template slot="customRenderStatus" slot-scope="status">
              <a-tag v-if="status === 0" color="green">正常</a-tag>
              <a-tag v-if="status === 2" color="orange">封禁</a-tag>
            </template>
            <!-- 二级经销商渲染模板 -->
            <template slot="customRenderTwoLevel" slot-scope="twoLevelDealerIs">
              <a-tag v-if="twoLevelDealerIs === 0" color="blue">否</a-tag>
              <a-tag v-if="twoLevelDealerIs === 1" color="purple">是</a-tag>
            </template>
            <!-- 提成比例渲染模板 -->
            <template slot="customRenderCommission" slot-scope="text">
              {{ text || 0 }}%
            </template>
          </a-table>
        </div>
        <!-- table区域-end -->
        
        <!-- 表单区域 -->
        <dealer-modal ref="modalForm" @ok="modalFormOk"></dealer-modal>
        <dealer-material-modal ref="dealerMaterialModal"></dealer-material-modal>
        <import-file-modal ref="modalImportForm" @ok="modalFormOk"></import-file-modal>
      </a-card>
    </a-col>
  </a-row>
</template>

<script>
  import DealerModal from './modules/DealerModal'
  import DealerMaterialModal from './modules/DealerMaterialModal'
  import ImportFileModal from '@/components/tools/ImportFileModal'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import { getAction, postAction, deleteAction } from '@/api/manage'

  export default {
    name: "DealerList",
    mixins:[JeecgListMixin],
    components: {
      DealerModal,
      DealerMaterialModal,
      ImportFileModal
    },
    data () {
      return {
        labelCol: {
          span: 5
        },
        wrapperCol: {
          span: 18,
          offset: 1
        },
        // 查询条件
        queryParam: {
          name: '',
          phonenum: '',
          status: undefined,
          twoLevelDealerIs: undefined,
          loginName: ''
        },
        urlPath: '/system/dealer',
        // 表头
        columns: [
          {
            title: '#',
            dataIndex: '',
            key:'rowIndex',
            width:60,
            align:"center",
            customRender:function (t,r,index) {
              return parseInt(index)+1;
            }
          },
          {
            title: '操作',
            dataIndex: 'action',
            width: 180,
            align:"center",
            scopedSlots: { customRender: 'action' },
          },
          { title: '经销商姓名', dataIndex: 'name', width: 120, align:"left"},
          { title: '登录用户名', dataIndex: 'loginName', width: 120, align:"left"},
          { title: '手机号码', dataIndex: 'phonenum', width: 120, align:"left"},
          { title: '提成比例(%)', dataIndex: 'commissionDecimal', width: 100, align:"left",
            scopedSlots: { customRender: 'customRenderCommission' }
          },
          { title: '状态', dataIndex: 'status', width: 80, align:"center",
            scopedSlots: { customRender: 'customRenderStatus' }
          },
          { title: '是否二级经销商', dataIndex: 'twoLevelDealerIs', width: 120, align:"center",
            scopedSlots: { customRender: 'customRenderTwoLevel' }
          },
          { title: '经销商特色', dataIndex: 'feature', width: 200, ellipsis: true, align:"left"},
          { title: '创建时间', dataIndex: 'createTime', width: 150, align:"center"}
        ],
        url: {
          list: "/dealer/list",
          delete: "/dealer/delete",
          deleteBatch: "/dealer/deleteBatch",
          importExcelUrl: "/dealer/importExcel",
          exportXlsUrl: "/dealer/exportExcel",
          batchSetStatusUrl: "/dealer/batchSetStatus"
        }
      }
    },
    computed: {
      importExcelUrl: function () {
        return `${window._CONFIG['domianURL']}${this.url.importExcelUrl}`;
      }
    },
    methods: {
      searchQuery() {
        this.loadData(1);
      },
      searchReset() {
        this.queryParam = {};
        this.loadData(1);
      },
      handleImportXls() {
        let importExcelUrl = this.url.importExcelUrl
        let templateUrl = '/doc/dealer_template.xls'
        let templateName = '经销商Excel模板[下载]'
        this.$refs.modalImportForm.initModal(importExcelUrl, templateUrl, templateName);
        this.$refs.modalImportForm.title = "经销商导入";
      },
      handleEdit: function (record) {
        this.$refs.modalForm.edit(record);
        this.$refs.modalForm.title = "编辑经销商";
        this.$refs.modalForm.disableSubmit = false;
        if(this.btnEnableList.indexOf(1)===-1) {
          this.$refs.modalForm.isReadOnly = true
        }
      },
      handleManageMaterial(record) {
        this.$refs.dealerMaterialModal.edit(record);
        this.$refs.dealerMaterialModal.title = `管理商品明细 - ${record.name}`;
        this.$refs.dealerMaterialModal.disableSubmit = false;
      },
      batchSetStatus(status) {
        if (this.selectedRowKeys.length <= 0) {
          this.$message.warning('请选择一条记录！');
          return;
        }
        let that = this;
        let statusText = status === 0 ? '启用' : '封禁';
        this.$confirm({
          title: '确认操作',
          content: `是否确定要${statusText}选中的 ${this.selectedRowKeys.length} 条记录?`,
          onOk: function () {
            let params = {
              ids: that.selectedRowKeys.join(','),
              status: status
            }
            postAction(that.url.batchSetStatusUrl, params).then((res) => {
              if (res.success) {
                that.$message.success(res.message);
                that.loadData();
                that.onClearSelected();
              } else {
                that.$message.warning(res.message);
              }
            });
          }
        });
      }
    }
  }
</script>

<style scoped>
  @import '~@assets/less/common.less'
</style>