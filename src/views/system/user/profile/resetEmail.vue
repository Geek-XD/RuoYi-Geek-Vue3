<template>
    <el-form ref="pwdRef" :model="user" :rules="rules" label-width="80px">
        <el-form-item label="邮箱" prop="email">
            <el-input v-model="user.email" placeholder="请输入邮箱" />
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
    email: undefined,
    password: undefined,
});
const rules = ref({
    email: [
        { required: true, message: "邮箱地址不能为空", trigger: "blur" },
        { type: "email", message: "请输入正确的邮箱地址", trigger: ["blur", "change"] }
    ],
    password: [{ required: true, message: "密码不能为空", trigger: "blur" }],
});

function sendCode() {
    postAction("/auth/mail/send/bind", user)
}

/** 提交按钮 */
function submit() {
    postAction("/auth/mail/verify/bind", user)
};
/** 关闭按钮 */
function close() {
    proxy.$tab.closePage();
};
</script>