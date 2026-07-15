<template>
  <a-row :gutter="24">
    <a-col :md="24">
      <a-card :bordered="false">
        <div class="table-page-search-wrapper">
          <a-form layout="inline" @keyup.enter.native="searchQuery">
            <a-row :gutter="24">
              <a-col :md="6" :sm="24">
                <a-form-item label="昵称" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入昵称查询" v-model="queryParam.nickname"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="手机号" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-input placeholder="请输入手机号查询" v-model="queryParam.phone"></a-input>
                </a-form-item>
              </a-col>
              <a-col :md="6" :sm="24">
                <a-form-item label="角色" :labelCol="labelCol" :wrapperCol="wrapperCol">
                  <a-select v-model="queryParam.role" placeholder="请选择角色" allow-clear>
                    <a-select-option :value="1">普通用户</a-select-option>
                    <a-select-option :value="2">经销商</a-select-option>
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

        <div class="table-operator">
          <a-button @click="handleAdd" type="primary" icon="plus">新增</a-button>
          <a-button
            v-if="selectedRowKeys.length > 0"
            type="danger"
            icon="delete"
            @click="batchDel"
          >批量删除</a-button>
        </div>

        <a-table
          ref="table"
          size="middle"
          :scroll="{ x: 1340 }"
          bordered
          rowKey="id"
          :columns="columns"
          :dataSource="dataSource"
          :pagination="ipagination"
          :loading="loading"
          :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
          @change="handleTableChange"
        >
          <template slot="role" slot-scope="text">
            <a-tag :color="text === 2 ? 'blue' : 'green'">{{ text === 2 ? '经销商' : '普通用户' }}</a-tag>
          </template>

          <template slot="gender" slot-scope="text">
            <span v-if="text === 1">男</span>
            <span v-else-if="text === 2">女</span>
            <span v-else>-</span>
          </template>

          <template slot="avatarUrl" slot-scope="text">
            <span v-if="!text">-</span>
            <a-image
              v-else
              :src="text"
              :width="40"
              :height="40"
              style="object-fit:cover;border-radius:50%;"
            />
          </template>

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

    <wechat-user-modal ref="modalForm" @ok="modalFormOk"></wechat-user-modal>
  </a-row>
</template>

<script>
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import WechatUserModal from './modules/WechatUserModal'

  export default {
    name: 'WechatUserList',
    mixins: [JeecgListMixin],
    components: { WechatUserModal },
    data() {
      return {
        labelCol: { span: 6 },
        wrapperCol: { span: 18 },
        description: '微信用户管理',
        queryParam: {
          nickname: '',
          phone: '',
          role: undefined
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
            title: '头像',
            dataIndex: 'avatarUrl',
            width: 80,
            align: 'center',
            scopedSlots: { customRender: 'avatarUrl' }
          },
          {
            title: '昵称',
            dataIndex: 'nickname',
            width: 120,
            align: 'center',
            customRender: (text) => text || '-'
          },
          {
            title: '真实姓名',
            dataIndex: 'realName',
            width: 100,
            align: 'center',
            customRender: (text) => text || '-'
          },
          {
            title: '手机号',
            dataIndex: 'phone',
            width: 130,
            align: 'center',
            customRender: (text) => text || '-'
          },
          {
            title: '角色',
            dataIndex: 'role',
            width: 100,
            align: 'center',
            scopedSlots: { customRender: 'role' }
          },
          {
            title: '代理',
            dataIndex: 'dealerName',
            width: 140,
            align: 'center',
            customRender: (text) => text || '-'
          },
          {
            title: '性别',
            dataIndex: 'gender',
            width: 60,
            align: 'center',
            scopedSlots: { customRender: 'gender' }
          },
          {
            title: '年龄',
            dataIndex: 'age',
            width: 60,
            align: 'center',
            customRender: (text) => text || '-'
          },
          {
            title: '身高(cm)',
            dataIndex: 'heightCm',
            width: 90,
            align: 'center',
            customRender: (text) => text || '-'
          },
          {
            title: '体重(kg)',
            dataIndex: 'weightKg',
            width: 90,
            align: 'center',
            customRender: (text) => text || '-'
          },
          {
            title: '创建时间',
            dataIndex: 'createdAt',
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
          list: '/wechatUser/list',
          delete: '/wechatUser/delete',
          deleteBatch: '/wechatUser/deleteBatch'
        }
      }
    },
    methods: {
      handleAdd() {
        this.$refs.modalForm.add()
        this.$refs.modalForm.title = '新增微信用户'
      },
      handleEdit(record) {
        this.$refs.modalForm.edit(record)
        this.$refs.modalForm.title = '编辑微信用户'
      }
    }
  }
</script>
