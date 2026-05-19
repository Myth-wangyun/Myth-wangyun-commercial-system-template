密码重置安全加固说明
====================

两个密码重置接口 `/reset-password/{username}` 与 `/admin/reset-admin-password` 现已要求调用方在请求体中提供正确的密钥字段才能执行。

- 接口参数：在原有 `password` 字段基础上，额外需要 `secret_key`（或兼容字段 `reset_key`），其值必须匹配后端配置 `settings.SECRET_KEY`。
- 失败表现：缺少或密钥错误将返回 403，避免未授权调用重置任意用户或 admin 密码。
- 目的：在系统初始化或运维场景下增加二次校验，防止接口被滥用。

使用示例
-------
```json
{
  "password": "NewStrongP4ss",
  "secret_key": "<与后端配置一致的密钥>"
}
```
