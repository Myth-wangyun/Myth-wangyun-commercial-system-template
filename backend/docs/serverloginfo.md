结论先说：

当前 GitHub Actions 触发的“前端”并没有启动独立前端进程。它只是执行构建，然后把静态文件放到 dist，线上访问由 Nginx 直接托管。

依据在这里：
- 工作流只做前端构建，没有启动 Vite、Node、PM2 或 preview 服务：deploy.yml
- 构建后只重启了后端服务：deploy.yml
- Nginx 的站点根目录就是前端构建产物目录 /opt/qm-system/dist：nginx.conf

所以你现在要看的“前端日志”，实际应该分成两类：

1. 前端静态资源访问日志
实际文件在：
- /var/log/nginx/access.log
- /var/log/nginx/error.log

配置来源：
- nginx.conf
- nginx.conf

我已经核对过，这两个文件是当前真正有内容、持续写入的日志。

2. 项目目录下的本地日志文件
当前你机器上还有这些文件：
- /data/logs/access.log
- /data/logs/error.log
- /data/logs/production.log
- /data/logs/qm-backend.out.log
- /data/logs/qm-backend.err.log

但这里面：
- /data/logs/qm-backend.out.log 和 /data/logs/qm-backend.err.log 明显是后端日志
- /data/logs/access.log 和 /data/logs/error.log 目前很小，不像当前线上前端主访问日志
- 环境变量里定义了 Node 日志目录为 /data/logs/node 的意图可见于 .env.production，但这个目录现在不存在，所以当前没有独立 Node 前端进程在往那里写日志

补一句关键判断：
- GitHub Actions 触发后的前端线上日志，优先看 Nginx：
  - /var/log/nginx/access.log
  - /var/log/nginx/error.log
- 不是看 Vite、PM2 或 Node 前端日志，因为现在根本没有那种前端进程在跑

如果你要，我下一步可以继续直接帮你：
1. 过滤出最近一次部署后的前端访问日志
2. 查最近几分钟里韩维明加载菜单相关的前端资源与接口请求
3. 对照 Nginx 和后端日志一起定位“为什么菜单没全出来”