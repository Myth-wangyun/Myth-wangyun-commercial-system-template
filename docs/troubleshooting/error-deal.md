flowchart TD
    A[用户点击菜单] --> B[React Router 导航]
    B --> C{lazy component import}
    C -->|成功| D[✅ 页面正常渲染]
    C -->|失败| E[Layer 1: lazyWithRetry]
    E -->|首次失败| F[自动 reload 获取新 index.html]
    F --> D
    E -->|冷却期内再次失败| G[抛出错误到 errorElement]
    G --> H[Layer 2: AppRouteError 自动恢复]
    H -->|该路径首次出错| I[显示加载动画 + 自动 reload]
    I --> D
    H -->|30s内已 reload 过| J[显示手动错误页面]
    J -->|用户点击重试| K[清除恢复记录 + reload]
    K --> D

    style D fill:#52c41a,color:#fff
    style J fill:#ff4d4f,color:#fff
    style F fill:#1890ff,color:#fff
    style I fill:#1890ff,color:#fff
