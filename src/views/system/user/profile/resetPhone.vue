<template>
    <el-form ref="pwdRef" :model="user" :rules="rules" label-width="80px">
        <el-form-item label="手机号码" prop="phonenumber">
            <el-input v-model="user.phonenumber" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
            <el-input v-model="user.password" placeholder="请输入密码" type="password" show-password />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
            <el-input v-model="user.code" placeholder="请输入验证码" />
        </el-form-item>
        <el-form-item>
            <el-button type="primary" @click="sendCode">发送验证码</el-button>
            <el-button type="primary" @click="submit">保存</el-button>
            <el-button type="danger" @click="close">关闭</el-button>
        </el-form-item>
    </el-form>
</template>

<script setup>
import { updateUserPwd } from "@/api/system/user";
import { postAction } from "@/utils/request"

const { proxy } = getCurrentInstance();

const user = reactive({
    phonenumber: undefined,
    password: undefined,
});
const rules = ref({
    phonenumber: [
        { required: true, message: "手机号码不能为空", trigger: "blur" },
        { pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/, message: "请输入正确的手机号码", trigger: "blur" }
    ],
    password: [{ required: true, message: "密码不能为空", trigger: "blur" }],
});

function sendCode() {
    postAction("/auth/phone/send/bind", user)
}

/** 提交按钮 */
function submit() {
    postAction("/auth/phone/verify/bind", user)
};
/** 关闭按钮 */
function close() {
    proxy.$tab.closePage();
};
</script>