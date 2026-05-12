<template>
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :bordered="false">
        <!-- 查询区域 -->
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="售后单号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入售后单号" v-model="queryParam.afterSalesNumber"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="订单号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入订单号" v-model="queryParam.orderNumber"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="商品名称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入商品名称" v-model="queryParam.materialName"></a-input>
                </a-form-item>
              </a-col>
              <template v-if="toggleSearchStatus">
                <a-col :md="6" :sm="24">
                  <a-form-item label="售后类型" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="请选择售后类型" allow-clear v-model="queryParam.type">
                      <a-select-option value="商品问题">商品问题</a-select-option>
                      <a-select-option value="物流问题">物流问题</a-select-option>
                      <a-select-option value="其他">其他</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-select placeholder="请选择状态" allow-clear v-model="queryParam.status">
                      <a-select-option value="待处理">待处理</a-select-option>
                      <a-select-option value="处理中">处理中</a-select-option>
                      <a-select-option value="待评价">待评价</a-select-option>
                      <a-select-option value="已完成">已完成</a-select-option>
                      <a-select-option value="已取消">已取消</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="联系人" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-input placeholder="请输入联系人" v-model="queryParam.contactName"></a-input>
                  </a-form-item>
                </a-col>
                <a-col :md="6" :sm="24">
                  <a-form-item label="创建时间" :labelCol="labelCol" :wrapperCol="wrapperCol">
                    <a-range-picker
                      style="width:100%"
                      v-model="queryParam.createTimeRange"
                      format="YYYY-MM-DD"
                      :placeholder="['开始时间', '结束时间']"
                    />
                  </a-form-item>
                </a-col>
              </template>
              <span style="float: left; overflow: hidden;" class="table-page-search-submitButtons">
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
            :loading="loading"
            :scroll="{ x: 1600 }"
            :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
            @change="handleTableChange">
            <template slot="statusRender" slot-scope="status">
              <a-tag v-if="status === '待处理'" color="orange">待处理</a-tag>
              <a-tag v-else-if="status === '处理中'" color="blue">处理中</a-tag>
              <a-tag v-else-if="status === '待评价'" color="purple">待评价</a-tag>
              <a-tag v-else-if="status === '已完成'" color="green">已完成</a-tag>
              <a-tag v-else-if="status === '已取消'" color="grey">已取消</a-tag>
              <span v-else>{{ status }}</span>
            </template>
            <template slot="typeRender" slot-scope="type">
              <a-tag v-if="type === '商品问题'" color="red">商品问题</a-tag>
              <a-tag v-else-if="type === '物流问题'" color="geekblue">物流问题</a-tag>
              <a-tag v-else-if="type === '其他'" color="default">其他</a-tag>
              <span v-else>{{ type }}</span>
            </template>
            <template slot="imagesRender" slot-scope="images">
              <template v-if="images">
                <a @click="previewImages(images)" style="color:#1890ff;">查看图片</a>
              </template>
              <span v-else>-</span>
            </template>
            <span slot="action" slot-scope="text, record">
              <a @click="handleView(record)">查看详情</a>
              <a-divider type="vertical" />
              <a @click="handleEdit(record)">编辑</a>
            </span>
          </a-table>
        </div>

        <!-- 详情弹窗 -->
        <a-modal
          v-model="detailModal.visible"
          title="售后单详情"
          :footer="null"
          width="800px"
          style="top: 40px;">
          <a-spin :spinning="detailModal.loading">
            <template v-if="detailModal.data">
              <a-descriptions bordered :column="2" size="small">
                <a-descriptions-item label="售后单号">{{ detailModal.data.afterSalesNumber }}</a-descriptions-item>
                <a-descriptions-item label="订单号">{{ detailModal.data.orderNumber }}</a-descriptions-item>
                <a-descriptions-item label="商品名称">{{ detailModal.data.materialName }}</a-descriptions-item>
                <a-descriptions-item label="商品规格">{{ detailModal.data.materialModel }}</a-descriptions-item>
                <a-descriptions-item label="商品颜色">{{ detailModal.data.materialColor }}</a-descriptions-item>
                <a-descriptions-item label="售后类型">{{ detailModal.data.type }}</a-descriptions-item>
                <a-descriptions-item label="状态">{{ detailModal.data.status }}</a-descriptions-item>
                <a-descriptions-item label="联系人">{{ detailModal.data.contactName }}</a-descriptions-item>
                <a-descriptions-item label="联系电话">{{ detailModal.data.contactPhone }}</a-descriptions-item>
                <a-descriptions-item label="联系地址" :span="2">{{ detailModal.data.contactAddress }}</a-descriptions-item>
                <a-descriptions-item label="申请原因" :span="2">{{ detailModal.data.reason }}</a-descriptions-item>
                <a-descriptions-item label="处理备注" :span="2">{{ detailModal.data.handlerRemark }}</a-descriptions-item>
                <a-descriptions-item label="处理时间">{{ detailModal.data.handledTime }}</a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ detailModal.data.createTime }}</a-descriptions-item>
              </a-descriptions>
              <template v-if="detailModal.data.images">
                <a-divider>凭证图片</a-divider>
                <div style="display:flex; flex-wrap:wrap; gap:8px;">
                  <a
                    v-for="(img, idx) in detailModal.data.images.split(',')"
                    :key="idx"
                    :href="img"
                    target="_blank">
                    <img :src="img" style="width:120px;height:90px;object-fit:cover;border:1px solid #eee;border-radius:4px;" />
                  </a>
                </div>
              </template>
              <template v-if="detailModal.data.materialImage">
                <a-divider>商品图片</a-divider>
                <a :href="detailModal.data.materialImage" target="_blank">
                  <img :src="detailModal.data.materialImage" style="max-width:200px;max-height:150px;object-fit:cover;border-radius:4px;" />
                </a>
              </template>
            </template>
          </a-spin>
        </a-modal>

        <!-- 图片预览弹窗 -->
        <a-modal
          v-model="previewModal.visible"
          title="查看图片"
          :footer="null"
          width="700px">
          <div style="display:flex; flex-wrap:wrap; gap:10px;">
            <a
              v-for="(img, idx) in previewModal.images"
              :key="idx"
              :href="img"
              target="_blank">
              <img :src="img" style="width:150px;height:120px;object-fit:cover;border:1px solid #eee;border-radius:4px;cursor:pointer;" />
            </a>
          </div>
        </a-modal>

        <!-- 编辑弹窗 -->
        <a-modal
          v-model="editModal.visible"
          title="编辑售后单"
          width="500px"
          :confirmLoading="editModal.loading"
          @ok="handleEditOk"
          @cancel="editModal.visible = false"
          okText="保存"
          cancelText="取消">
          <a-form :form="editForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
            <a-form-item label="售后单号">
              <a-input :value="editModal.record && editModal.record.afterSalesNumber" :readOnly="true" />
            </a-form-item>
            <a-form-item label="状态">
              <a-select v-decorator="['status', { rules: [{ required: true, message: '请选择状态' }] }]" placeholder="请选择状态">
                <a-select-option value="待处理">待处理</a-select-option>
                <a-select-option value="处理中">处理中</a-select-option>
                <a-select-option value="待评价">待评价</a-select-option>
                <a-select-option value="已完成">已完成</a-select-option>
                <a-select-option value="已取消">已取消</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="处理备注">
              <a-textarea
                v-decorator="['handlerRemark']"
                placeholder="请输入处理备注"
                :rows="3" />
            </a-form-item>
            <a-form-item label="处理时间">
              <j-date
                v-decorator="['handledTime']"
                placeholder="请选择处理时间"
                :show-time="true"
                date-format="YYYY-MM-DD HH:mm:ss"
                style="width:100%" />
            </a-form-item>
          </a-form>
        </a-modal>
      </a-card>
    </a-col>
  </a-row>
</template>

<script>
import { getAction, putAction } from '@/api/manage'
import { JeecgListMixin } from '@/mixins/JeecgListMixin'
import JDate from '@/components/jeecg/JDate'

export default {
  name: 'AfterSalesList',
  mixins: [JeecgListMixin],
  components: { JDate },
  data() {
    return {
      queryParam: {
        afterSalesNumber: '',
        orderNumber: '',
        materialName: '',
        type: undefined,
        status: undefined,
        contactName: '',
        createTimeRange: []
      },
      labelCol: { span: 6 },
      wrapperCol: { span: 18 },
      toggleSearchStatus: false,
      columns: [
        {
          title: '操作',
          dataIndex: 'action',
          align: 'center',
          width: 80,
          fixed: 'left',
          scopedSlots: { customRender: 'action' }
        },
        { title: '售后单号', dataIndex: 'afterSalesNumber', width: 180 },
        { title: '订单号', dataIndex: 'orderNumber', width: 180 },
        {
          title: '售后类型',
          dataIndex: 'type',
          width: 100,
          scopedSlots: { customRender: 'typeRender' }
        },
        {
          title: '状态',
          dataIndex: 'status',
          width: 90,
          scopedSlots: { customRender: 'statusRender' }
        },
        { title: '商品名称', dataIndex: 'materialName', width: 160, ellipsis: true },
        { title: '商品规格', dataIndex: 'materialModel', width: 120 },
        { title: '商品颜色', dataIndex: 'materialColor', width: 100 },
        { title: '申请原因', dataIndex: 'reason', width: 180, ellipsis: true },
        { title: '联系人', dataIndex: 'contactName', width: 100 },
        { title: '联系电话', dataIndex: 'contactPhone', width: 120 },
        { title: '联系地址', dataIndex: 'contactAddress', width: 200, ellipsis: true },
        { title: '处理备注', dataIndex: 'handlerRemark', width: 180, ellipsis: true },
        {
          title: '处理时间',
          dataIndex: 'handledTime',
          width: 130,
          customRender: text => (!text ? '' : text.substring(0, 10))
        },
        {
          title: '凭证图片',
          dataIndex: 'images',
          width: 90,
          scopedSlots: { customRender: 'imagesRender' }
        },
        {
          title: '创建时间',
          dataIndex: 'createTime',
          width: 130,
          customRender: text => (!text ? '' : text.substring(0, 10))
        },
        {
          title: '更新时间',
          dataIndex: 'updateTime',
          width: 130,
          customRender: text => (!text ? '' : text.substring(0, 10))
        }
      ],
      detailModal: {
        visible: false,
        loading: false,
        data: null
      },
      previewModal: {
        visible: false,
        images: []
      },
      editModal: {
        visible: false,
        loading: false,
        record: null
      },
      editForm: this.$form.createForm(this),
      url: {
        list: '/afterSales/list',
        update: '/afterSales/update'
      }
    }
  },
  methods: {
    loadData(arg) {
      if (!this.url.list) {
        this.$message.error('请设置url.list属性!')
        return
      }
      if (arg === 1) {
        this.ipagination.current = 1
      }
      const params = this.getQueryParams()
      this.loading = true
      getAction(this.url.list, params).then(res => {
        if (res && res.code === 200) {
          this.dataSource = (res.data && res.data.rows) || res.data || []
          this.ipagination.total = (res.data && res.data.total) ? parseInt(res.data.total) : (this.dataSource.length || 0)
        } else {
          this.$message.warning((res && res.message) || '查询失败')
        }
      }).finally(() => {
        this.loading = false
      })
    },
    getQueryParams() {
      const search = { ...this.queryParam }
      // 处理时间范围
      if (search.createTimeRange && search.createTimeRange.length === 2) {
        search.createTimeBegin = search.createTimeRange[0] ? search.createTimeRange[0].format('YYYY-MM-DD') : ''
        search.createTimeEnd = search.createTimeRange[1] ? search.createTimeRange[1].format('YYYY-MM-DD') : ''
      }
      delete search.createTimeRange
      return {
        search: JSON.stringify(search),
        currentPage: this.ipagination.current,
        pageSize: this.ipagination.pageSize
      }
    },
    searchQuery() {
      this.loadData(1)
    },
    searchReset() {
      this.queryParam = {
        afterSalesNumber: '',
        orderNumber: '',
        materialName: '',
        type: undefined,
        status: undefined,
        contactName: '',
        createTimeRange: []
      }
      this.loadData(1)
    },
    handleToggleSearch() {
      this.toggleSearchStatus = !this.toggleSearchStatus
    },
    handleView(record) {
      this.detailModal.visible = true
      this.detailModal.data = null
      this.detailModal.loading = true
      getAction('/afterSales/info', { id: record.id }).then(res => {
        if (res && res.code === 200) {
          this.detailModal.data = res.data || null
        } else {
          this.$message.warning((res && res.message) || '获取详情失败')
        }
      }).finally(() => {
        this.detailModal.loading = false
      })
    },
    previewImages(images) {
      this.previewModal.images = images.split(',').filter(Boolean)
      this.previewModal.visible = true
    },
    handleEdit(record) {
      this.editModal.record = record
      this.editModal.visible = true
      this.$nextTick(() => {
        this.editForm.setFieldsValue({
          status: record.status,
          handlerRemark: record.handlerRemark || '',
          handledTime: record.handledTime || undefined
        })
      })
    },
    handleEditOk() {
      this.editForm.validateFields((err, values) => {
        if (err) return
        this.editModal.loading = true
        const params = {
          id: this.editModal.record.id,
          status: values.status,
          handlerRemark: values.handlerRemark,
          handledTime: values.handledTime
        }
        putAction(this.url.update, params).then(res => {
          if (res && res.code === 200) {
            this.$message.success('保存成功')
            this.editModal.visible = false
            this.loadData()
          } else {
            this.$message.warning((res && res.message) || '保存失败')
          }
        }).finally(() => {
          this.editModal.loading = false
        })
      })
    }
  }
}
</script>

<style scoped>
@import '~@assets/less/common.less';
</style>
