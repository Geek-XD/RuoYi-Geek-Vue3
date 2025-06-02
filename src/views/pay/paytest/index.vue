<script setup>
import profile from '@/assets/images/profile.jpg'
import { postAction, getAction } from '@/utils/request';
import { ref } from 'vue';
import QRCodeView from '@/components/QRCodeView';

const data = ref('123')
const orderNumber = ref('20240610163141A001')
const payType = ref('wechat');
const payUrl = ref('');
const payLoading = ref(false);

function handlePay() {
    payLoading.value = true;
    payUrl.value = '';
    // 兼容 orderNumber 可能为对象
    const orderNo = typeof orderNumber.value === 'string' ? orderNumber.value : orderNumber.value?.toString() || '';
    getAction(`/pay/${payType.value}/url/${orderNo}`).then(res => {
        if (payType.value === 'alipay' && res.data && res.data.startsWith('<form')) {
            // 支付宝返回form，新的窗口打开并自动提交
            const newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(res.data);
                newWindow.document.close();
                newWindow.document.querySelector('form')?.submit();
            } else {
                // 如果被浏览器拦截，回退到原有方式
                const div = document.createElement('div');
                div.innerHTML = res.data;
                document.body.appendChild(div);
                div.querySelector('form')?.submit();
            }
        } else if (res.msg) {
            payUrl.value = res.data;
        }
    }).finally(() => {
        payLoading.value = false;
    });
}
</script>
<template>
    <div class="app-container">
        <el-row>
            <el-col :span="12">
                <el-form>
                    <el-form-item label="订单号">
                        <el-input v-model="orderNumber"></el-input>
                    </el-form-item>
                    <el-form-item label="支付链接">
                        <el-input v-model="payUrl" disabled></el-input>
                    </el-form-item>
                    <el-form-item label="支付方式">
                        <el-select v-model="payType" style="width: 120px">
                            <el-option label="微信" value="wechat" />
                            <el-option label="支付宝" value="alipay" />
                            <el-option label="收钱吧" value="sqb" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" :loading="payLoading" @click="handlePay">支付测试</el-button>
                    </el-form-item>
                    <el-form-item v-if="payUrl">
                        <QRCodeView :data="payUrl" :logo="profile" style="margin-top: 16px;" />
                    </el-form-item>
                </el-form>
            </el-col>
            <el-col :span="12">
                <QRCodeView :data="data" :logo="profile"></QRCodeView>
                <JsBarcodeView :data="data"></JsBarcodeView>
            </el-col>
        </el-row>
    </div>
</template>