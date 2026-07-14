import axios from 'axios'
import { ElMessage } from 'element-plus'
import { saveAs } from 'file-saver'
import { getToken } from '@ruoyi/core/utils/auth'
import { ErrorCode } from '@ruoyi/core/constant/errorCode'
import { blobValidate } from '@ruoyi/core/utils/ruoyi'

const baseURL = import.meta.env.VITE_APP_BASE_API

export default {
  name(name: string, isDelete = true) {
    let url = baseURL + "/file/download?fileName=" + encodeURIComponent(name) + "&delete=" + isDelete
    axios({
      method: 'get',
      url: url,
      responseType: 'blob',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    }).then(async (res) => {
      const isLogin = await blobValidate(res.data);
      if (isLogin) {
        const blob = new Blob([res.data])
        this.saveAs(blob, decodeURIComponent(res.headers['download-filename']), undefined)
      } else {
        this.printErrMsg(res.data);
      }
    })
  },
  resource(resource: string) {
    let url = baseURL + "/file/download/resource?resource=" + encodeURIComponent(resource);
    axios({
      method: 'get',
      url: url,
      responseType: 'blob',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    }).then(async (res) => {
      const isLogin = await blobValidate(res.data);
      if (isLogin) {
        const blob = new Blob([res.data])
        this.saveAs(blob, decodeURIComponent(res.headers['download-filename']), undefined)
      } else {
        this.printErrMsg(res.data);
      }
    })
  },
  zip(url: string, name: string) {
    axios({
      method: 'get',
      url: baseURL + url,
      responseType: 'blob',
      headers: { 'Authorization': 'Bearer ' + getToken() }
    }).then(async (res) => {
      const isLogin = await blobValidate(res.data);
      if (isLogin) {
        const blob = new Blob([res.data], { type: 'application/zip' })
        this.saveAs(blob, name, undefined)
      } else {
        this.printErrMsg(res.data);
      }
    })
  },
  saveAs(text: string | Blob, name: string, opts: any) {
    saveAs(text, name, opts);
  },
  async printErrMsg(data: Blob) {
    const resText = await data.text();
    const rspObj = JSON.parse(resText);
    const errMsg = ErrorCode[rspObj.code] || rspObj.msg || ErrorCode['default']
    ElMessage.error(errMsg);
  }
}

