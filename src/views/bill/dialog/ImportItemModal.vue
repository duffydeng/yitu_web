<template>
  <a-modal
    :title="title"
    :width="500"
    :visible="visible"
    :confirmLoading="confirmLoading"
    :maskStyle="{'top':'93px','left':'154px'}"
    @cancel="handleCancel"
    cancelText="关闭"
    wrapClassName="ant-modal-cust-warp"
    style="top:20%;height: 55%;overflow-y: hidden">
    <template slot="footer">
      <a-button key="back" @click="handleCancel">
        关闭
      </a-button>
    </template>
    <a-spin :spinning="confirmLoading">
      <a-form :form="form">
        <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="模板">
          <a-button type="link" icon="download" @click="handleDownloadTemplate">
            <b>明细Excel模板[下载]</b>
          </a-button>
        </a-form-item>
        <a-form-item :labelCol="labelCol" :wrapperCol="wrapperCol" label="文件">
          <a-upload name="file" :showUploadList="false" :multiple="false" :headers="tokenHeader"
                    :data="setFileData" :action="importExcelUrl" @change="handleImportExcel">
            <a-button type="primary" icon="import">导入</a-button>
          </a-upload>
        </a-form-item>
      </a-form>
    </a-spin>
  </a-modal>
</template>

<script>
  import { ACCESS_TOKEN } from '@/store/mutation-types'
  import Vue from 'vue'

  export default {
    name: "ImportItemModal",
    components: {
    },
    data () {
      return {
        title:"导入明细",
        visible: false,
        prefixNo: '',
        tmpUrl: '',
        model: {},
        tokenHeader: {'X-Access-Token': Vue.ls.get(ACCESS_TOKEN)},
        labelCol: {
          xs: { span: 24 },
          sm: { span: 5 },
        },
        wrapperCol: {
          xs: { span: 24 },
          sm: { span: 16 },
        },
        confirmLoading: false,
        form: this.$form.createForm(this),
        url: {
          importExcelUrl: "/depotItem/importItemExcel",
        }
      }
    },
    created () {
    },
    computed: {
      importExcelUrl: function () {
        return `${window._CONFIG['domianURL']}${this.url.importExcelUrl}`;
      }
    },
    methods: {
      add (prefixNo) {
        this.prefixNo = prefixNo
        if(prefixNo === 'QGD') {
          this.tmpUrl = '/doc/apply_item_template.xls'
        } else if(prefixNo === 'CGDD' || prefixNo === 'XSDD') {
          this.tmpUrl = '/doc/order_item_template.xls'
        } else if(prefixNo === 'CGRK' || prefixNo === 'XSCK') {
          this.tmpUrl = '/doc/buy_sale_item_template.xls'
        } else if(prefixNo === 'QTRK' || prefixNo === 'QTCK') {
          this.tmpUrl = '/doc/in_out_item_template.xls'
        } else if(prefixNo === 'PD') {
          this.tmpUrl = '/doc/stock_taking_template.xls'
        }
        this.form.resetFields()
        this.model = Object.assign({}, {})
        this.visible = true
      },
      close () {
        this.$emit('close');
        this.visible = false;
      },
      handleCancel () {
        this.close()
      },
      //下载模板
      handleDownloadTemplate() {
        if (!this.tmpUrl) {
          this.$message.warning('模板文件路径未配置')
          return
        }
        // 从路径中提取文件名
        const fileName = this.tmpUrl.split('/').pop()
        // 根据文件扩展名确定 MIME 类型
        const mimeType = fileName.endsWith('.xlsx') 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/vnd.ms-excel'
        
        // 使用 fetch 获取文件并下载
        fetch(this.tmpUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error('文件不存在或无法访问')
            }
            return response.arrayBuffer()
          })
          .then(buffer => {
            // 创建 Blob，指定正确的 MIME 类型
            const blob = new Blob([buffer], { type: mimeType })
            // 创建 Blob URL
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.style.display = 'none'
            link.href = url
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            // 释放 URL 对象
            window.URL.revokeObjectURL(url)
            this.$message.success('模板下载成功')
          })
          .catch(error => {
            console.error('下载失败:', error)
            this.$message.error('模板下载失败，请检查文件是否存在')
          })
      },
      //导入
      handleImportExcel(info){
        if (info.file.status !== 'uploading') {
          console.log(info.file, info.fileList);
        }
        if (info.file.status === 'done') {
          if (info.file.response) {
            if (info.file.response.code === 200) {
              this.$message.success('导入成功' + info.file.response.data.rows.length + '条')
              this.$emit('ok', info.file.response.data.rows);
              this.close()
            } else if (info.file.response.code === 500) {
              this.$message.warn(info.file.response.data.message)
            }
          } else {
            this.$message.error(`${info.file.name} ${info.file.response.data}.`);
          }
        } else if (info.file.status === 'error') {
          this.$message.error(`文件导入失败: ${info.file.msg} `);
        }
      },
      setFileData() {
        return {
          'prefixNo': this.prefixNo
        }
      }
    }
  }
</script>
<style scoped>

</style>