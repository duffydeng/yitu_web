<template>
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :style="cardStyle" :bordered="false">
        <!-- 查询区域 -->
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="题目编码" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入题目编码查询" v-model="queryParam.questionCode"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="题目名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入题目名称查询" v-model="queryParam.questionName"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="题目类型" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-select v-model="queryParam.questionType" placeholder="请选择题目类型" allow-clear>
                    <a-select-option :value="1">单选</a-select-option>
                    <a-select-option :value="2">多选</a-select-option>
                    <a-select-option :value="3">文本</a-select-option>
                    <a-select-option :value="4">评分</a-select-option>
                    <a-select-option :value="5">日期</a-select-option>
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
            <template v-if="toggleSearchStatus">
              <a-row :gutter="24">
                <a-col :md="6" :sm="24">
                  <a-form-item label="状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select v-model="queryParam.status" placeholder="请选择状态" allow-clear>
                      <a-select-option :value="1">启用</a-select-option>
                      <a-select-option :value="0">禁用</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="是否必填" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select v-model="queryParam.isRequired" placeholder="请选择" allow-clear>
                      <a-select-option :value="1">是</a-select-option>
                      <a-select-option :value="0">否</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
            </template>
            <a-row>
              <a-col :md="24">
                <a @click="handleToggleSearch" style="margin-left: 8px">
                  {{ toggleSearchStatus ? '收起' : '展开' }}
                  <a-icon :type="toggleSearchStatus ? 'up' : 'down'" />
                </a>
              </a-col>
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
            rowKey="id"
            :columns="columns"
            :dataSource="dataSource"
            :pagination="ipagination"
            :scroll="scroll"
            :loading="loading"
            :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            @change="handleTableChange">
            <!-- 题目类型 -->
            <template slot="questionTypeRender" slot-scope="val">
              <a-tag v-if="val === 1" color="blue">单选</a-tag>
              <a-tag v-else-if="val === 2" color="purple">多选</a-tag>
              <a-tag v-else-if="val === 3" color="cyan">文本</a-tag>
              <a-tag v-else-if="val === 4" color="gold">评分</a-tag>
              <a-tag v-else-if="val === 5" color="lime">日期</a-tag>
              <span v-else>-</span>
            </template>
            <!-- 状态 -->
            <template slot="statusRender" slot-scope="val">
              <a-tag v-if="val === 1 || val === '1'" color="green">启用</a-tag>
              <a-tag v-else color="orange">禁用</a-tag>
            </template>
            <!-- 是否必填 -->
            <template slot="isRequiredRender" slot-scope="val">
              <a-tag v-if="val === 1 || val === '1'" color="red">必填</a-tag>
              <span v-else>否</span>
            </template>
            <!-- 选项配置 -->
            <template slot="optionsRender" slot-scope="val, record">
              <template v-if="record.questionType === 1 || record.questionType === 2">
                <template v-if="parseOptions(val).length > 0">
                  <a-tag v-for="(opt, idx) in parseOptions(val)" :key="idx" style="margin-bottom:2px;">{{ opt }}</a-tag>
                </template>
                <span v-else>-</span>
              </template>
              <span v-else>-</span>
            </template>
            <!-- 操作列 -->
            <span slot="action" slot-scope="text, record">
              <a @click="handleEdit(record)">编辑</a>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除吗?" @confirm="() => handleDelete(record.id)">
                <a>删除</a>
              </a-popconfirm>
            </span>
          </a-table>
        </div>

        <!-- 新增/编辑弹窗 -->
        <survey-question-modal ref="modalForm" @ok="modalFormOk"></survey-question-modal>
      </a-card>
    </a-col>
  </a-row>
</template>

<script>
  import SurveyQuestionModal from './modules/SurveyQuestionModal'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'

  export default {
    name: 'SurveyQuestionList',
    mixins: [JeecgListMixin],
    components: {
      SurveyQuestionModal
    },
    data() {
      return {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        scroll: { x: 1200 },
        queryParam: {
          questionCode: '',
          questionName: '',
          questionType: undefined,
          status: undefined,
          isRequired: undefined
        },
        columns: [
          {
            title: '#',
            key: 'rowIndex',
            width: 50,
            align: 'center',
            customRender: (t, r, index) => parseInt(index) + 1
          },
          {
            title: '题目编码',
            dataIndex: 'questionCode',
            width: 100,
            align: 'center'
          },
          {
            title: '题目名称',
            dataIndex: 'questionName',
            width: 200,
            ellipsis: true
          },
          {
            title: '题目类型',
            dataIndex: 'questionType',
            width: 90,
            align: 'center',
            scopedSlots: { customRender: 'questionTypeRender' }
          },
          {
            title: '选项配置',
            dataIndex: 'options',
            width: 260,
            scopedSlots: { customRender: 'optionsRender' }
          },
          {
            title: '显示顺序',
            dataIndex: 'sortOrder',
            width: 90,
            align: 'center'
          },
          {
            title: '是否必填',
            dataIndex: 'isRequired',
            width: 90,
            align: 'center',
            scopedSlots: { customRender: 'isRequiredRender' }
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            align: 'center',
            scopedSlots: { customRender: 'statusRender' }
          },
          {
            title: '操作',
            key: 'action',
            width: 120,
            align: 'center',
            fixed: 'right',
            scopedSlots: { customRender: 'action' }
          }
        ],
        url: {
          list: '/surveyQuestion/list',
          delete: '/surveyQuestion/delete',
          deleteBatch: '/surveyQuestion/deleteBatch'
        }
      }
    },
    methods: {
      handleEdit(record) {
        this.$refs.modalForm.edit(record)
        this.$refs.modalForm.title = '编辑问卷调查项'
        this.$refs.modalForm.disableSubmit = false
      },
      parseOptions(val) {
        if (!val) return []
        try {
          const arr = typeof val === 'string' ? JSON.parse(val) : val
          return Array.isArray(arr) ? arr : []
        } catch (e) {
          return []
        }
      }
    }
  }
</script>

<style scoped>
  @import '~@assets/less/common.less';
</style>
