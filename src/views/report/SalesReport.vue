<template>
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :style="cardStyle" :bordered="false">
        <!-- 查询区域 -->
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="开始日期" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-date-picker style="width: 100%" v-model="queryParam.beginTime" placeholder="请选择开始日期" />
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="结束日期" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-date-picker style="width: 100%" v-model="queryParam.endTime" placeholder="请选择结束日期" />
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
                  <a-button type="primary" @click="searchQuery">查询</a-button>
                  <a-button style="margin-left: 8px" v-print="'#reportPrint'" icon="printer">打印</a-button>
                  <a-button style="margin-left: 8px" @click="exportExcel" icon="download">导出</a-button>
                </span>
              </a-col>
            </a-row>
          </a-form>
        </div>
        <!-- table区域 -->
        <section ref="print" id="reportPrint">
          <a-table
            bordered
            ref="table"
            size="middle"
            rowKey="productName"
            :columns="columns"
            :components="handleDrag(columns)"
            :dataSource="dataSource"
            :pagination="false"
            :scroll="{x: 1000}"
            :loading="loading">
          </a-table>
        </section>
        <div style="text-align: center; margin-top: 16px;">
          <a-pagination
            showSizeChanger
            showQuickJumper
            :pageSizeOptions="pageSizeOptions"
            :showTotal="total => `共 ${total} 条`"
            :total="total"
            :pageSize="pageSize"
            :current="currentPage"
            @change="pageChange"
            @showSizeChange="pageSizeChange" />
        </div>
      </a-card>
    </a-col>
  </a-row>
</template>

<script>
  import { getAction, downFilePost } from '@/api/manage'
  import { formatDate, getNowFormatStr } from '@/utils/util'
  import VueDraggableResizable from 'vue-draggable-resizable'

  export default {
    name: 'SalesReport',
    components: {
      VueDraggableResizable
    },
    data() {
      return {
        cardStyle: { margin: '-24px -24px 0px' },
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        loading: false,
        dataSource: [],
        total: 0,
        pageSize: 20,
        currentPage: 1,
        pageSizeOptions: ['10', '20', '30', '50'],
        queryParam: {
          beginTime: '',
          endTime: ''
        },
        columns: [
          { title: '序号', dataIndex: 'rowIndex', width: 60, align: 'center',
            customRender: (text, record, index) => (this.currentPage - 1) * this.pageSize + index + 1 },
          { title: '车型', dataIndex: 'productName', width: 180 },
          { title: '销售台数', dataIndex: 'totalQuantity', width: 100, align: 'right' },
          { title: '各代理商销量', dataIndex: 'dealerBreakdown', width: 350 },
          { title: '销售总金额', dataIndex: 'totalAmount', width: 150, align: 'right',
            customRender: (text) => {
              return text ? text.toFixed(2) : '0.00'
            }
          }
        ]
      }
    },
    created() {
      this.searchQuery()
    },
    methods: {
      handleDrag(column){
        return {
          header: {
            cell: (h, props, children) => {
              const { key, ...restProps } = props
              const col = column.find((col) => {
                const k = col.dataIndex || col.key
                return k === key
              })
              if (!col || !col.width) {
                return h('th', { ...restProps }, children)
              }
              const dragProps = {
                key: col.dataIndex || col.key,
                class: 'table-draggable-handle',
                attrs: {
                  w: 10,
                  x: col.width,
                  z: 1,
                  axis: 'x',
                  draggable: true,
                  resizable: false,
                },
                on: {
                  dragging: (x, y) => {
                    col.width = Math.max(x, 1)
                  },
                },
              }
              const drag = h(VueDraggableResizable, { ...dragProps })
              return h('th', { ...restProps, class: 'resize-table-th' }, [children, drag])
            },
          }
        }
      },
      searchQuery() {
        if (!this.queryParam.beginTime || !this.queryParam.endTime) {
          this.$message.warning('请选择日期区间！')
          return
        }
        this.currentPage = 1
        this.loadData()
      },
      loadData() {
        this.loading = true
        let params = {
          beginTime: formatDate(this.queryParam.beginTime),
          endTime: formatDate(this.queryParam.endTime)
        }
        getAction('/depotItem/salesReport', params).then(res => {
          if (res.code === 200) {
            this.dataSource = res.data.rows || []
            this.total = res.data.total || 0
          } else {
            this.$message.error(res.data || '获取数据失败')
          }
        }).finally(() => {
          this.loading = false
        })
      },
      pageChange(page) {
        this.currentPage = page
      },
      pageSizeChange(current, size) {
        this.pageSize = size
        this.currentPage = 1
      },
      exportExcel() {
        if (!this.dataSource.length) {
          this.$message.warning('暂无数据可导出')
          return
        }
        let list = []
        let head = '车型,销售台数,各代理商销量,销售总金额'
        for (let i = 0; i < this.dataSource.length; i++) {
          let ds = this.dataSource[i]
          list.push([ds.productName, ds.totalQuantity, ds.dealerBreakdown, ds.totalAmount ? ds.totalAmount.toFixed(2) : '0.00'])
        }
        let tip = '日期区间：' + formatDate(this.queryParam.beginTime) + '~' + formatDate(this.queryParam.endTime)
        this.handleExportXlsPost('销售报表', '销售报表', head, tip, list)
      },
      handleExportXlsPost(fileName, title, head, tip, list) {
        if (!fileName || typeof fileName !== 'string') {
          fileName = '导出文件'
        }
        let paramObj = { title: title, head: head, tip: tip, list: list }
        downFilePost(paramObj).then((data) => {
          if (!data) {
            this.$message.warning('文件下载失败')
            return
          }
          if (typeof window.navigator.msSaveBlob !== 'undefined') {
            window.navigator.msSaveBlob(new Blob([data], { type: 'application/vnd.ms-excel' }), fileName + '.xls')
          } else {
            let url = window.URL.createObjectURL(new Blob([data], { type: 'application/vnd.ms-excel' }))
            let link = document.createElement('a')
            link.style.display = 'none'
            link.href = url
            link.setAttribute('download', fileName + '_' + getNowFormatStr() + '.xls')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
          }
        })
      }
    }
  }
</script>

<style scoped>
  @import '~@assets/less/common.less';
</style>
