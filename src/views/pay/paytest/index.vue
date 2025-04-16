<script setup>
import profile from '@/assets/images/profile.jpg'
import { postAction, getAction } from '@/utils/request';
import { ref } from 'vue';
const data = ref('123')
const orderNumber = ref('20240610163141A001')
function getPayUrl() {
    getAction('/pay/wechat/url/' + orderNumber.value).then(res => {
        data.value = res.data
    })
}

const file = ref('')
</script>
<template>
    <div class="app-container">
        <el-row>
            <el-col :span="12">
                <el-form>
                    <el-form-item label="订单号">
                        <el-row>
                            <el-col :span="16"><el-input v-model="orderNumber"></el-input></el-col>
                            <el-col :span="4" :push="4"><el-button @click="getPayUrl">获取支付链接</el-button></el-col>
                        </el-row>

                    </el-form-item>
                    <el-form-item label="支付链接">
                        <el-input v-model="data"></el-input>
                    </el-form-item>
                </el-form>
            </el-col>
            <el-col :span="12">
                <QRCodeView :data="data" :logo="profile"></QRCodeView>
                <JsBarcodeView :data="data"></JsBarcodeView>
            </el-col>
        </el-row>
        <ImageUpload v-model="file"></ImageUpload>
    </div>
</template>