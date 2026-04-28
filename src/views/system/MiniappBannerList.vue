<template>
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :bordered="false">
        <!-- 查询区域 -->
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="标题" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入标题查询" v-model="queryParam.title"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="状态" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-select v-model="queryParam.status" placeholder="请选择状态" allow-clear>
                    <a-select-option :value="1">启用</a-select-option>
                    <a-select-option :value="0">停用</a-select-option>
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

        <!-- 操作按钮区域 -->
        <div class="table-operator">
          <a-button @click="handleAdd" type="primary" icon="plus">新增</a-button>
          <a-button
            v-if="selectedRowKeys.length > 0"
            type="danger"
            icon="delete"
            @click="batchDel"
          >批量删除</a-button>
        </div>

        <!-- 列表区域 -->
        <a-table
          ref="table"
          size="middle"
          :scroll="{ x: 1000 }"
          bordered
          rowKey="id"
          :columns="columns"
          :dataSource="dataSource"
          :pagination="ipagination"
          :loading="loading"
          :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
          @change="handleTableChange"
        >
          <!-- 图片列 -->
          <template slot="imageUrl" slot-scope="text">
            <span v-if="!text || text === ''">-</span>
            <a-image
              v-else
              :src="getImageSrc(text)"
              :width="60"
              :height="60"
              style="object-fit:cover;border-radius:4px;"
            />
          </template>

          <!-- 跳转链接列 -->
          <template slot="linkUrl" slot-scope="text">
            <a-tooltip v-if="text" :title="text">
              <span style="max-width:120px;display:inline-block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">{{ text }}</span>
            </a-tooltip>
            <span v-else>-</span>
          </template>

          <!-- 状态列 -->
          <template slot="status" slot-scope="text">
            <a-tag :color="text === 1 ? 'green' : 'red'">{{ text === 1 ? '启用' : '停用' }}</a-tag>
          </template>

          <!-- 操作列 -->
          <span slot="action" slot-scope="text, record">
            <a @click="handleEdit(record)">编辑</a>
            <a-divider type="vertical" />
            <a-popconfirm title="确认删除？" @confirm="handleDelete(record)">
              <a style="color:#f5222d;">删除</a>
            </a-popconfirm>
          </span>
        </a-table>
      </a-card>
    </a-col>

    <!-- 新增/编辑弹窗 -->
    <miniapp-banner-modal ref="modalForm" @ok="modalFormOk"></miniapp-banner-modal>
  </a-row>
</template>

<script>
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import MiniappBannerModal from './modules/MiniappBannerModal'

  export default {
    name: 'MiniappBannerList',
    mixins: [JeecgListMixin],
    components: { MiniappBannerModal },
    data() {
      return {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        description: '小程序Banner管理',
        queryParam: {
          title: '',
          status: undefined
        },
        columns: [
          {
            title: '#',
            dataIndex: '',
            key: 'rowIndex',
            width: 60,
            align: 'center',
            customRender: (t, r, index) => parseInt(index) + 1
          },
          {
            title: '标题',
            dataIndex: 'title',
            width: 160,
            align: 'center',
            customRender: (text) => text || '-'
          },
          {
            title: '图片',
            dataIndex: 'imageUrl',
            width: 100,
            align: 'center',
            scopedSlots: { customRender: 'imageUrl' }
          },
          {
            title: '跳转链接',
            dataIndex: 'linkUrl',
            width: 160,
            align: 'center',
            scopedSlots: { customRender: 'linkUrl' }
          },
          {
            title: '排序',
            dataIndex: 'sortNum',
            width: 80,
            align: 'center'
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            align: 'center',
            scopedSlots: { customRender: 'status' }
          },
          {
            title: '创建时间',
            dataIndex: 'createTime',
            width: 160,
            align: 'center',
            customRender: (text) => text ? text.replace('T', ' ').substring(0, 19) : '-'
          },
          {
            title: '操作',
            dataIndex: 'action',
            width: 120,
            align: 'center',
            scopedSlots: { customRender: 'action' }
          }
        ],
        url: {
          list: '/miniappBanner/list',
          delete: '/miniappBanner/delete',
          deleteBatch: '/miniappBanner/deleteBatch'
        }
      }
    },
    methods: {
      handleAdd() {
        this.$refs.modalForm.add()
        this.$refs.modalForm.title = '新增Banner'
      },
      handleEdit(record) {
        this.$refs.modalForm.edit(record)
        this.$refs.modalForm.title = '编辑Banner'
      },
      getImageSrc(url) {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        return (window._CONFIG && window._CONFIG['domianURL'] ? window._CONFIG['domianURL'] : '') + url
      }
    }
  }
</script>
