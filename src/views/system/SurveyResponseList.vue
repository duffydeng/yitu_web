<template>
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :style="cardStyle" :bordered="false">
        <!-- 查询区域 -->
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="订单编号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入订单编号查询" v-model="queryParam.orderCode"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="用户名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入用户名称查询" v-model="queryParam.userName"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="提交时间" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-range-picker
                    v-model="submitTimeRange"
                    format="YYYY-MM-DD"
                    :placeholder="['开始日期', '结束日期']"
                    style="width:100%"
                    @change="onSubmitTimeChange"
                  />
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
                  <a-button type="primary" @click="searchQuery">查询</a-button>
                  <a-button style="margin-left: 8px" @click="handleSearchReset">重置</a-button>
                </span>
              </a-col>
            </a-row>
          </a-form>
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
            <!-- 提交时间 -->
            <template slot="submitTimeRender" slot-scope="val">
              {{ formatDateTime(val) }}
            </template>
            <!-- 操作列 -->
            <span slot="action" slot-scope="text, record">
              <a @click="handleDetail(record)">查看详情</a>
            </span>
          </a-table>
        </div>

        <!-- 详情弹窗 -->
        <a-modal
          v-model="detailModal.visible"
          title="问卷答卷详情"
          :footer="null"
          width="720px"
          style="top:60px;">
          <template v-if="detailModal.record">
            <a-descriptions bordered :column="2" size="small" style="margin-bottom:16px;">
              <a-descriptions-item label="用户名称">{{ detailModal.record.userName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="订单编号">{{ detailModal.record.orderCode || '-' }}</a-descriptions-item>
              <a-descriptions-item label="提交时间" :span="2">{{ formatDateTime(detailModal.record.submitTime) }}</a-descriptions-item>
              <a-descriptions-item label="IP地址" :span="2">{{ detailModal.record.ipAddress || '-' }}</a-descriptions-item>
            </a-descriptions>

            <div style="font-weight:600;margin-bottom:8px;font-size:14px;">答题内容</div>
            <template v-if="detailModal.answerList.length > 0">
              <a-table
                :columns="answerColumns"
                :dataSource="detailModal.answerList"
                :pagination="false"
                size="small"
                bordered
                rowKey="questionCode">
                <template slot="answerRender" slot-scope="val">
                  <template v-if="Array.isArray(val)">
                    <a-tag v-for="(v, i) in val" :key="i" style="margin-bottom:2px;">{{ v }}</a-tag>
                  </template>
                  <span v-else>{{ val }}</span>
                </template>
              </a-table>
            </template>
            <a-empty v-else description="暂无答题数据" />
          </template>
        </a-modal>
      </a-card>
    </a-col>
  </a-row>
</template>

<script>
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'

  export default {
    name: 'SurveyResponseList',
    mixins: [JeecgListMixin],
    data() {
      return {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        scroll: { x: 1000 },
        submitTimeRange: [],
        queryParam: {
          orderCode: '',
          userName: '',
          submitTimeStart: '',
          submitTimeEnd: ''
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
            title: '用户名称',
            dataIndex: 'userName',
            width: 120,
            customRender: text => text || '-'
          },
          {
            title: '订单编号',
            dataIndex: 'orderCode',
            width: 160
          },
          {
            title: '提交时间',
            dataIndex: 'submitTime',
            width: 160,
            align: 'center',
            scopedSlots: { customRender: 'submitTimeRender' }
          },
          {
            title: 'IP地址',
            dataIndex: 'ipAddress',
            width: 140,
            align: 'center',
            customRender: text => text || '-'
          },
          {
            title: '操作',
            key: 'action',
            width: 90,
            align: 'center',
            fixed: 'right',
            scopedSlots: { customRender: 'action' }
          }
        ],
        answerColumns: [
          { title: '题目编码', dataIndex: 'questionCode', width: 100, align: 'center' },
          { title: '答案', dataIndex: 'answer', scopedSlots: { customRender: 'answerRender' } }
        ],
        detailModal: {
          visible: false,
          record: null,
          answerList: []
        },
        url: {
          list: '/surveyResponse/list',
          delete: '/surveyResponse/delete',
          deleteBatch: '/surveyResponse/deleteBatch'
        }
      }
    },
    methods: {
      handleDetail(record) {
        this.detailModal.record = record
        this.detailModal.answerList = this.parseAnswerJson(record.answerJson)
        this.detailModal.visible = true
      },
      parseAnswerJson(answerJson) {
        if (!answerJson) return []
        try {
          const obj = typeof answerJson === 'string' ? JSON.parse(answerJson) : answerJson
          return Object.keys(obj).map(key => ({
            questionCode: key,
            answer: obj[key]
          }))
        } catch (e) {
          return []
        }
      },
      formatDateTime(val) {
        if (!val) return '-'
        const str = typeof val === 'string' ? val : new Date(val).toISOString()
        return str.replace('T', ' ').substring(0, 19)
      },
      onSubmitTimeChange(dates, dateStrings) {
        this.queryParam.submitTimeStart = dateStrings[0] || ''
        this.queryParam.submitTimeEnd = dateStrings[1] || ''
      },
      handleSearchReset() {
        this.submitTimeRange = []
        this.queryParam.orderCode = ''
        this.queryParam.userName = ''
        this.queryParam.submitTimeStart = ''
        this.queryParam.submitTimeEnd = ''
        this.loadData(1)
      }
    }
  }
</script>

<style scoped>
  @import '~@assets/less/common.less';
</style>
