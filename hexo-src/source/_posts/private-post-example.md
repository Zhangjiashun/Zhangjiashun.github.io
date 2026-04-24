---
title: 私密文章示例
date: 2026-02-25 10:00:00
categories:
  - Private
tags:
  - 私密
  - 测试
abstract: "这是一篇私密文章，需要密码才能查看完整内容。密码: demo123"
---

这是一篇受密码保护的文章示例。

## 权限管理功能说明

这篇文章属于 `Private` 分类，该分类已配置密码保护。

### 两种加密方式

#### 1. 文章级加密（单篇文章）

在文章的 Front Matter 中添加 `password` 属性：

```yaml
---
title: 文章标题
password: "你的密码"
message: "密码提示信息"
abstract: "文章摘要（未解锁前显示）"
wrong_pass_message: "密码错误提示"
---
```

#### 2. 分类级加密（整个分类）

在 `_config.yml` 中配置分类权限：

```yaml
access_control:
  enable: true
  categories:
    Private:
      public: false
      password: "demo123"
      message: "此分类需要密码访问"
```

### 可用属性说明

| 属性 | 说明 | 适用范围 |
|------|------|----------|
| `password` | 访问密码 | 文章/分类 |
| `message` | 密码输入框提示文字 | 文章/分类 |
| `abstract` | 文章摘要，未解锁前显示 | 文章 |
| `wrong_pass_message` | 密码错误时的提示信息 | 文章 |
| `public` | 是否公开访问 | 分类 |
| `description` | 分类描述 | 分类 |

### 测试密码

本文的访问密码是：`demo123`
