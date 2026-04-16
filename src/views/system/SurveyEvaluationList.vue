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
                  <a-input placeholder="请输入订单编号" v-model="queryParam.orderNumber"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="用户名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入用户名称" v-model="queryParam.userName"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="手机号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入手机号" v-model="queryParam.userPhone"></a-input>
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
                  <a-form-item label="审核状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select v-model="queryParam.status" placeholder="请选择审核状态" allow-clear>
                      <a-select-option :value="0">待审核</a-select-option>
                      <a-select-option :value="1">已通过</a-select-option>
                      <a-select-option :value="2">已拒绝</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="是否匿名" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select v-model="queryParam.anonymous" placeholder="请选择" allow-clear>
                      <a-select-option :value="0">否</a-select-option>
                      <a-select-option :value="1">是</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="问卷标题" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input placeholder="请输入问卷标题" v-model="queryParam.surveyTitle"></a-input>
                  </a-form-item>
                </a-col>
              </a-row>
            </template>
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
            <!-- 审核状态 -->
            <template slot="statusRender" slot-scope="status">
              <a-tag v-if="status === 0" color="blue">待审核</a-tag>
              <a-tag v-else-if="status === 1" color="green">已通过</a-tag>
              <a-tag v-else-if="status === 2" color="red">已拒绝</a-tag>
              <span v-else>-</span>
            </template>
            <!-- 综合评分 -->
            <template slot="scoreRender" slot-scope="score">
              <a-rate :value="score" disabled allow-half style="font-size:14px;" />
            </template>
            <!-- 是否匿名 -->
            <template slot="anonymousRender" slot-scope="val">
              <a-tag v-if="val === 1" color="orange">匿名</a-tag>
              <span v-else>实名</span>
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
          title="问卷评价详情"
          :footer="null"
          width="680px"
          style="top:60px;">
          <a-descriptions v-if="detailModal.record" bordered :column="2" size="small">
            <a-descriptions-item label="订单编号" :span="2">{{ detailModal.record.orderNumber || '-' }}</a-descriptions-item>
            <a-descriptions-item label="用户名称">{{ detailModal.record.anonymous === 1 ? '匿名' : (detailModal.record.userName || '-') }}</a-descriptions-item>
            <a-descriptions-item label="用户手机号">{{ detailModal.record.anonymous === 1 ? '***' : (detailModal.record.userPhone || '-') }}</a-descriptions-item>
            <a-descriptions-item label="问卷标题" :span="2">{{ detailModal.record.surveyTitle || '-' }}</a-descriptions-item>
            <a-descriptions-item label="综合评分">
              <a-rate :value="detailModal.record.overallScore" disabled allow-half style="font-size:14px;" />
            </a-descriptions-item>
            <a-descriptions-item label="产品质量">
              <a-rate :value="detailModal.record.qualityScore" disabled allow-half style="font-size:14px;" />
            </a-descriptions-item>
            <a-descriptions-item label="物流配送">
              <a-rate :value="detailModal.record.deliveryScore" disabled allow-half style="font-size:14px;" />
            </a-descriptions-item>
            <a-descriptions-item label="售后服务">
              <a-rate :value="detailModal.record.afterSalesScore" disabled allow-half style="font-size:14px;" />
            </a-descriptions-item>
            <a-descriptions-item label="评价内容" :span="2">{{ detailModal.record.content || '-' }}</a-descriptions-item>
            <a-descriptions-item label="使用场景">{{ detailModal.record.extField1 || '-' }}</a-descriptions-item>
            <a-descriptions-item label="改进建议">{{ detailModal.record.extField2 || '-' }}</a-descriptions-item>
            <a-descriptions-item label="是否推荐">{{ detailModal.record.extField3 || '-' }}</a-descriptions-item>
            <a-descriptions-item label="购买渠道">{{ detailModal.record.extField4 || '-' }}</a-descriptions-item>
            <a-descriptions-item label="图片" :span="2">
              <template v-if="detailModal.record.extField5">
                <template v-for="(imgUrl, idx) in (detailModal.record.extField5 || '').split(',').filter(Boolean)">
                  <a :key="idx" :href="imgUrl" target="_blank" style="margin-right:8px;">图片{{ idx + 1 }}</a>
                </template>
              </template>
              <span v-else>-</span>
            </a-descriptions-item>
            <a-descriptions-item label="审核状态">
              <a-tag v-if="detailModal.record.status === 0" color="blue">待审核</a-tag>
              <a-tag v-else-if="detailModal.record.status === 1" color="green">已通过</a-tag>
              <a-tag v-else-if="detailModal.record.status === 2" color="red">已拒绝</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="是否匿名">{{ detailModal.record.anonymous === 1 ? '是' : '否' }}</a-descriptions-item>
            <a-descriptions-item label="审核人">{{ detailModal.record.auditor || '-' }}</a-descriptions-item>
            <a-descriptions-item label="审核时间">{{ formatDate(detailModal.record.auditTime) }}</a-descriptions-item>
            <a-descriptions-item label="审核备注" :span="2">{{ detailModal.record.auditRemark || '-' }}</a-descriptions-item>
            <a-descriptions-item label="提交时间" :span="2">{{ formatDate(detailModal.record.createTime) }}</a-descriptions-item>
          </a-descriptions>
        </a-modal>
      </a-card>
    </a-col>
  </a-row>
</template>

<script>
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'

  export default {
    name: 'SurveyEvaluationList',
    mixins: [JeecgListMixin],
    data() {
      return {
        queryParam: {
          orderNumber: '',
          userName: '',
          userPhone: '',
          surveyTitle: '',
          status: undefined,
          anonymous: undefined
        },
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        scroll: { x: 1800 },
        columns: [
          { title: '订单编号', dataIndex: 'orderNumber', width: 180 },
          { title: '用户名称', dataIndex: 'userName', width: 100, ellipsis: true,
            customRender: (text, record) => record.anonymous === 1 ? '匿名' : (text || '-')
          },
          { title: '手机号', dataIndex: 'userPhone', width: 130,
            customRender: (text, record) => record.anonymous === 1 ? '***' : (text || '-')
          },
          { title: '问卷标题', dataIndex: 'surveyTitle', width: 180, ellipsis: true },
          { title: '综合评分', dataIndex: 'overallScore', width: 130, align: 'center',
            scopedSlots: { customRender: 'scoreRender' }
          },
          { title: '质量评分', dataIndex: 'qualityScore', width: 100, align: 'center',
            customRender: text => text != null ? `${text}分` : '-'
          },
          { title: '物流评分', dataIndex: 'deliveryScore', width: 100, align: 'center',
            customRender: text => text != null ? `${text}分` : '-'
          },
          { title: '售后评分', dataIndex: 'afterSalesScore', width: 100, align: 'center',
            customRender: text => text != null ? `${text}分` : '-'
          },
          { title: '评价内容', dataIndex: 'content', width: 200, ellipsis: true,
            customRender: text => text || '-'
          },
          { title: '是否匿名', dataIndex: 'anonymous', width: 90, align: 'center',
            scopedSlots: { customRender: 'anonymousRender' }
          },
          { title: '审核状态', dataIndex: 'status', width: 100, align: 'center',
            scopedSlots: { customRender: 'statusRender' }
          },
          { title: '审核人', dataIndex: 'auditor', width: 100,
            customRender: text => text || '-'
          },
          { title: '审核时间', dataIndex: 'auditTime', width: 150,
            customRender: text => this.formatDate(text)
          },
          { title: '提交时间', dataIndex: 'createTime', width: 150,
            customRender: text => this.formatDate(text)
          },
          { title: '操作', key: 'action', width: 90, align: 'center', fixed: 'right',
            scopedSlots: { customRender: 'action' }
          }
        ],
        detailModal: {
          visible: false,
          record: null
        },
        url: {
          list: '/surveyEvaluation/list'
        }
      }
    },
    methods: {
      handleDetail(record) {
        this.detailModal.record = record
        this.detailModal.visible = true
      },
      formatDate(val) {
        if (!val) return '-'
        const str = typeof val === 'string' ? val : new Date(val).toISOString()
        return str.substring(0, 10)
      }
    }
  }
</script>

<style scoped>
  @import '~@assets/less/common.less';
</style>
