<template>
  <div class="app-container home">
    <div class="welcome-container">
      <h1 class="welcome-title">欢迎使用 RuoYi-Geek-Vue3</h1>
      <p class="welcome-desc">基于 Vue3、TypeScript、Vite、Element-Plus 的后台管理系统</p>
    </div>

    <el-row :gutter="20" class="feature-section">
      <el-col :span="8" v-for="(feature, index) in features" :key="index">
        <el-card class="feature-card">
          <div class="feature-icon">
            <el-icon>
              <component :is="feature.icon"/>
            </el-icon>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加插件和指令说明部分 -->
    <div class="section-title">内置功能说明</div>
    
    <el-row :gutter="20" class="docs-section">
      <el-col :span="12">
        <el-card class="doc-card">
          <template #header>
            <div class="card-header">
              <span>内置插件 (plugins)</span>
            </div>
          </template>
          <div class="doc-content">
            <div v-for="(plugin, index) in plugins" :key="index" class="doc-item">
              <h4>{{ plugin.name }}</h4>
              <p>{{ plugin.description }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="doc-card">
          <template #header>
            <div class="card-header">
              <span>内置指令 (directives)</span>
            </div>
          </template>
          <div class="doc-content">
            <div v-for="(directive, index) in directives" :key="index" class="doc-item">
              <h4>v-{{ directive.name }}</h4>
              <p>{{ directive.description }}</p>
              <el-tag size="small" effect="plain">用法：{{ directive.usage }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup name="Index">
import { ref } from 'vue'

const features = ref([
  {
    icon: 'Monitor',
    title: '技术先进',
    description: '采用Vue3、TypeScript等最新技术栈，保持与时俱进'
  },
  {
    icon: 'SetUp',
    title: '简单易用',
    description: '开箱即用的后台解决方案，内置完整的权限验证系统'
  },
  {
    icon: 'Document',
    title: '规范开发',
    description: '遵循最佳实践，统一的编码规范，让项目更易维护'
  }
])

const plugins = ref([
  {
    name: 'Auth 权限验证',
    description: '提供了权限验证相关方法，包括hasPermi、hasRole等功能，用于控制按钮和功能的访问权限'
  },
  {
    name: 'Cache 缓存',
    description: '提供了浏览器缓存操作方法，支持session和local存储的设置与获取'
  },
  {
    name: 'Modal 弹窗',
    description: '封装了Element Plus的弹窗组件，提供了更便捷的调用方式'
  }
])

const directives = ref([
  {
    name: 'hasPermi',
    description: '用于控制按钮级别的权限',
    usage: 'v-hasPermi="[\'system:user:add\']"'
  },
  {
    name: 'hasRole',
    description: '用于控制角色级别的权限',
    usage: 'v-hasRole="[\'admin\']"'
  },
  {
    name: 'auth',
    description: '通用权限验证指令',
    usage: 'v-auth="\'system:user:edit\'"'
  }
])
</script>

<style scoped lang="scss">
.home {
  padding: 20px;
  
  .welcome-container {
    text-align: center;
    margin-bottom: 40px;
    
    .welcome-title {
      font-size: 2.5em;
      color: var(--el-text-color-primary);
      margin-bottom: 20px;
    }
    
    .welcome-desc {
      font-size: 1.2em;
      color: var(--el-text-color-secondary);
    }
  }

  .feature-section {
    .feature-card {
      height: 100%;
      text-align: center;
      transition: transform 0.3s;
      
      &:hover {
        transform: translateY(-5px);
      }

      .feature-icon {
        font-size: 2.5em;
        color: var(--el-color-primary);
        margin-bottom: 20px;
      }

      h3 {
        margin: 10px 0;
        font-size: 1.2em;
        color: var(--el-text-color-primary);
      }

      p {
        color: var(--el-text-color-secondary);
        line-height: 1.5;
      }
    }
  }
}

.section-title {
  font-size: 1.5em;
  color: var(--el-text-color-primary);
  margin: 40px 0 20px;
  text-align: center;
}

.docs-section {
  margin-top: 20px;
  
  .doc-card {
    height: 100%;
    
    .card-header {
      font-weight: bold;
    }
    
    .doc-content {
      .doc-item {
        margin-bottom: 20px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        h4 {
          margin: 0 0 10px;
          color: var(--el-color-primary);
        }
        
        p {
          margin: 0 0 10px;
          color: var(--el-text-color-secondary);
          line-height: 1.5;
        }
        
        .el-tag {
          font-family: monospace;
        }
      }
    }
  }
}
</style>
