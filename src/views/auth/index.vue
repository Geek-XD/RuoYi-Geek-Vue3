<script setup lang="ts">
import { computed, onMounted, ref, useCssModule, watch } from 'vue';
import { Document, ChatDotRound, User } from '@element-plus/icons-vue';
import { getConfigKey } from '@/api/system/config';
import { useRoute, useRouter } from 'vue-router';
import Oauth from "./oauth.vue";
import { getToken } from '@ruoyi/core/utils/auth';
import { RoutesAlias } from '@ruoyi/core/router/routesAlias';
import BackgroundAnimation from './background-animation.vue';
// 页面加载状态
const pageLoaded = ref(false);
const successCount = ref(0);
const targetSuccessCount = 100;

// 数字增长动画
function startCountAnimation() {
  const duration = 3000; // 动画持续时间（毫秒）
  const step = Math.ceil(targetSuccessCount / (duration / 50)); // 每50毫秒增加的数值
  const interval = setInterval(() => {
    successCount.value += step;
    if (successCount.value >= targetSuccessCount) {
      successCount.value = targetSuccessCount;
      clearInterval(interval);
    }
  }, 50);
}
// 验证码开关
const captchaEnabled = ref(false);
// 注册开关
const register = ref(false);

const route = useRoute();

onMounted(async () => {
  if (getToken()) {
    useRouter().push(RoutesAlias.Home)
    return;
  }
  try {
    captchaEnabled.value = await getConfigKey("sys.account.captchaEnabled").then(res => res.msg === 'true')
    register.value = await getConfigKey("sys.account.registerUser").then(res => res.msg === 'true')
  } finally {
    // 设置页面加载状态为true，触发动画
    pageLoaded.value = true;
    startCountAnimation();
  }
});

const features = [
  { icon: Document, text: '模块解耦' },
  { icon: ChatDotRound, text: '前沿技术' },
  { icon: User, text: '多端支持' }
];

const method = ref("password");
const methods = computed(() => {
  const text = route.name === 'Login' ? '登录' : '注册';
  return [
    { label: `密码${text}`, value: "password" },
    { label: `手机${text}`, value: "phone" },
    { label: `邮箱${text}`, value: "email" }
  ]
});

const title = computed(() => import.meta.env.VITE_APP_TITLE || '后台管理系统');

</script>
<template>
  <div class="auth">
    <BackgroundAnimation />
    <div class="container" :class="{ 'appear-animation': pageLoaded }">
      <div class="container-left">
        <h1>欢迎使用GEEK生态</h1>
        <p>打造高效、现代、可扩展的企业级开发平台</p>
        <div class="features">
          <div class="feature-item" v-for="(item, index) in features" :key="index">
            <el-icon>
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.text }}</span>
          </div>
        </div>
        <div class="success-stories">
          <div class="story-counter">
            <span class="counter">{{ successCount }}+</span>
            <span class="counter-label">成功案例</span>
          </div>
        </div>
      </div>
      <div class="container-right" v-if="pageLoaded">
        <h3 class="title">{{ title }}</h3>
        <el-segmented v-model="method" :options="methods" block />
        <div class="container-form">
          <router-view v-slot="{ Component }">
            <component :is="Component" :register="register" :captchaEnabled="captchaEnabled" :method="method" />
          </router-view>
        </div>
        <Oauth />
      </div>
    </div>
    <!--  底部  -->
    <div class="el-auth-footer">
      <span>Copyright © 2018-2024 若依Geek后台管理系统 All Rights Reserved.</span>
    </div>
  </div>
</template>
<style lang='scss' scoped>
.auth {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color) 100%);
}

.container {
  display: flex;
  width: 85%;
  max-width: 1200px;
  min-height: 600px;
  height: 70vh;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow);
  overflow: hidden;
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(30px);
  transition: all 1s ease;

  &.appear-animation {
    opacity: 1;
    transform: translateY(0);
  }

  @media screen and (max-width: 768px) {
    width: 95%;
  }
}

.container-left {
  flex: 0.6;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary-dark-3) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: var(--el-color-white);
  padding: 40px;
  text-align: center;

  @media screen and (max-width: 768px) {
    display: none;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 0px;
    font-weight: 600;
    text-shadow: 0 2px 4px var(--el-color-primary-dark-2);
  }

  p {
    margin-bottom: 60px;
    opacity: 0.9;
    line-height: 1.6;
  }

  .features {
    display: flex;
    justify-content: space-around;
    width: 60%;

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-8px) scale(1.05);

        .el-icon {
          box-shadow: 0 8px 16px var(--el-color-primary-dark-2);
          transform: rotate(5deg);
        }
      }

      .el-icon {
        font-size: 48px;
        margin-bottom: 15px;
        padding: 12px;
        background: var(--el-color-primary-light-6);
        border-radius: 50%;
        box-shadow: 0 4px 12px var(--el-color-primary-light-5);
        transition: all 0.3s ease;
      }

      span {
        font-size: 1rem;
        font-weight: 500;
      }
    }
  }

  .success-stories {
    margin-top: 40px;

    .story-counter {
      display: flex;
      flex-direction: column;
      align-items: center;

      .counter {
        font-size: 3rem;
        font-weight: 700;
        color: var(--el-color-white);
        text-shadow: 0 2px 8px var(--el-color-primary-dark-2);
      }

      .counter-label {
        margin-top: 5px;
        opacity: 0.9;
        font-weight: 500;
      }
    }
  }
}

.container-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  position: relative;

  @media screen and (max-width: 768px) {
    width: 100%;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0) 70%, rgba(235, 235, 235, 0.5) 100%);
    pointer-events: none;
  }

  .title {
    margin: 30px auto 20px auto;
    text-align: center;
    color: #333;
    font-size: 28px;
    font-weight: 600;
    background: linear-gradient(45deg, var(--el-color-primary-light-3), var(--el-color-primary-dark-3));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .el-segmented {
    $background: var(--el-color-primary-light-9);
    border-radius: 8px;
    background-color: $background;
    padding: 4px;

    :deep(.el-segmented__item-selected) {
      border-radius: 8px;
    }

    :deep(.el-segmented__item) {
      padding: 6px 12px;
      background-color: $background;
    }
  }
}

.container-form {
  width: 80%;
  max-width: 400px;
  padding: 20px;
}

.el-auth-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
}
</style>
