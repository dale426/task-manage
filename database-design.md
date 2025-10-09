# 任务管理系统数据库设计

## 概述

本文档描述了任务管理系统的数据库表结构设计，基于当前系统的数据模型，支持用户管理、项目管理、任务管理、预约提醒等核心功能。

## 数据库表结构

### 1. 用户表 (users)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 用户唯一标识符 |
| nickname | VARCHAR | 100 | NOT NULL | - | 用户昵称 |
| phone | VARCHAR | 20 | NULL | - | 手机号码 |
| note | TEXT | - | NULL | - | 用户备注 |
| level | ENUM | - | NULL | 'level_3' | 用户级别：level_1(一级), level_2(二级), level_3(三级) |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX idx_nickname (nickname)
- INDEX idx_level (level)

### 2. 项目表 (projects)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 项目唯一标识符 |
| name | VARCHAR | 200 | NOT NULL | - | 项目名称 |
| note | TEXT | - | NULL | - | 项目备注 |
| repeat | ENUM | - | NULL | 'none' | 重复频率：none(不重复), daily(每日), weekly(每周), monthly(每月) |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX idx_name (name)

### 3. 项目用户关联表 (project_users)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 关联关系唯一标识符 |
| project_id | VARCHAR | 32 | NOT NULL | - | 项目ID |
| user_id | VARCHAR | 32 | NOT NULL | - | 用户ID |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY uk_project_user (project_id, user_id)
- INDEX idx_project_id (project_id)
- INDEX idx_user_id (user_id)

### 4. 任务表 (tasks)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 任务唯一标识符 |
| name | VARCHAR | 200 | NOT NULL | - | 任务名称 |
| project_id | VARCHAR | 32 | NULL | - | 关联项目ID |
| note | TEXT | - | NULL | - | 任务备注 |
| type | ENUM | - | NOT NULL | - | 任务类型：single(单例), composite(复合) |
| due_at | TIMESTAMP | - | NULL | - | 任务截止时间 |
| completed | BOOLEAN | - | NOT NULL | FALSE | 任务是否完成 |
| completed_at | TIMESTAMP | - | NULL | - | 任务完成时间 |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX idx_project_id (project_id)
- INDEX idx_type (type)
- INDEX idx_completed (completed)
- INDEX idx_due_at (due_at)

### 5. 任务用户关联表 (task_users)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 关联关系唯一标识符 |
| task_id | VARCHAR | 32 | NOT NULL | - | 任务ID |
| user_id | VARCHAR | 32 | NOT NULL | - | 用户ID |
| completed | BOOLEAN | - | NOT NULL | FALSE | 用户是否完成该任务 |
| completed_at | TIMESTAMP | - | NULL | - | 用户完成时间 |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY uk_task_user (task_id, user_id)
- INDEX idx_task_id (task_id)
- INDEX idx_user_id (user_id)
- INDEX idx_completed (completed)

### 6. 任务步骤表 (task_steps)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 步骤唯一标识符 |
| task_id | VARCHAR | 32 | NOT NULL | - | 所属任务ID |
| name | VARCHAR | 200 | NOT NULL | - | 步骤名称 |
| sort_order | INT | - | NOT NULL | 0 | 步骤排序 |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX idx_task_id (task_id)
- INDEX idx_sort_order (sort_order)

### 7. 任务步骤完成记录表 (task_step_completions)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 完成记录唯一标识符 |
| step_id | VARCHAR | 32 | NOT NULL | - | 步骤ID |
| user_id | VARCHAR | 32 | NOT NULL | - | 完成用户ID |
| completed_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 完成时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY uk_step_user (step_id, user_id)
- INDEX idx_step_id (step_id)
- INDEX idx_user_id (user_id)

### 8. 子任务表 (subtasks)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 子任务唯一标识符 |
| task_id | VARCHAR | 32 | NOT NULL | - | 所属任务ID |
| name | VARCHAR | 200 | NOT NULL | - | 子任务名称 |
| owner_user_id | VARCHAR | 32 | NOT NULL | - | 子任务所属用户ID |
| completed | BOOLEAN | - | NOT NULL | FALSE | 子任务是否完成 |
| completed_at | TIMESTAMP | - | NULL | - | 子任务完成时间 |
| note | TEXT | - | NULL | - | 子任务备注 |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX idx_task_id (task_id)
- INDEX idx_owner_user_id (owner_user_id)
- INDEX idx_completed (completed)

### 9. 子任务步骤表 (subtask_steps)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 子任务步骤唯一标识符 |
| subtask_id | VARCHAR | 32 | NOT NULL | - | 所属子任务ID |
| name | VARCHAR | 200 | NOT NULL | - | 步骤名称 |
| sort_order | INT | - | NOT NULL | 0 | 步骤排序 |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX idx_subtask_id (subtask_id)
- INDEX idx_sort_order (sort_order)

### 10. 子任务步骤完成记录表 (subtask_step_completions)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 完成记录唯一标识符 |
| step_id | VARCHAR | 32 | NOT NULL | - | 步骤ID |
| user_id | VARCHAR | 32 | NOT NULL | - | 完成用户ID |
| completed_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 完成时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY uk_step_user (step_id, user_id)
- INDEX idx_step_id (step_id)
- INDEX idx_user_id (user_id)

### 11. 预约提醒表 (appointments)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 预约唯一标识符 |
| title | VARCHAR | 200 | NOT NULL | - | 预约标题 |
| content | TEXT | - | NULL | - | 预约内容 |
| start_time | TIMESTAMP | - | NOT NULL | - | 开始时间 |
| end_time | TIMESTAMP | - | NOT NULL | - | 结束时间 |
| completed | BOOLEAN | - | NOT NULL | FALSE | 是否完成 |
| completed_at | TIMESTAMP | - | NULL | - | 完成时间 |
| status | ENUM | - | NOT NULL | 'pending' | 状态：pending(未开始), started(已开始), completed(已完成), ended(已结束) |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- INDEX idx_start_time (start_time)
- INDEX idx_status (status)
- INDEX idx_completed (completed)

### 12. 预约用户关联表 (appointment_users)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 关联关系唯一标识符 |
| appointment_id | VARCHAR | 32 | NOT NULL | - | 预约ID |
| user_id | VARCHAR | 32 | NOT NULL | - | 用户ID |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY uk_appointment_user (appointment_id, user_id)
- INDEX idx_appointment_id (appointment_id)
- INDEX idx_user_id (user_id)

### 13. 用户备注表 (user_notes)

| 字段名 | 类型 | 长度 | 是否为空 | 默认值 | 描述 |
|--------|------|------|----------|--------|------|
| id | VARCHAR | 32 | NOT NULL | - | 备注唯一标识符 |
| entity_type | ENUM | - | NOT NULL | - | 实体类型：task, task_step, subtask |
| entity_id | VARCHAR | 32 | NOT NULL | - | 实体ID |
| user_id | VARCHAR | 32 | NOT NULL | - | 用户ID |
| note | TEXT | - | NOT NULL | - | 备注内容 |
| created_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | - | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**索引：**
- PRIMARY KEY (id)
- UNIQUE KEY uk_entity_user (entity_type, entity_id, user_id)
- INDEX idx_entity (entity_type, entity_id)
- INDEX idx_user_id (user_id)

## 数据关系说明

### 主要关系
1. **用户 ↔ 项目**：多对多关系，通过 `project_users` 表关联
2. **用户 ↔ 任务**：多对多关系，通过 `task_users` 表关联
3. **用户 ↔ 预约**：多对多关系，通过 `appointment_users` 表关联
4. **项目 ↔ 任务**：一对多关系，任务表直接关联项目ID
5. **任务 ↔ 步骤**：一对多关系，通过 `task_steps` 表关联
6. **任务 ↔ 子任务**：一对多关系，通过 `subtasks` 表关联
7. **子任务 ↔ 子任务步骤**：一对多关系，通过 `subtask_steps` 表关联

### 完成状态跟踪
- **任务完成**：通过 `task_users` 表的 `completed` 字段跟踪每个用户的完成状态
- **步骤完成**：通过 `task_step_completions` 表记录每个用户对每个步骤的完成情况
- **子任务完成**：通过 `subtasks` 表的 `completed` 字段跟踪子任务完成状态
- **子任务步骤完成**：通过 `subtask_step_completions` 表记录每个用户对每个子任务步骤的完成情况

## 接口设计建议

### RESTful API 设计
```
GET    /api/users                    # 获取用户列表
POST   /api/users                    # 创建用户
PUT    /api/users/:id                # 更新用户
DELETE /api/users/:id                # 删除用户

GET    /api/projects                 # 获取项目列表
POST   /api/projects                 # 创建项目
PUT    /api/projects/:id             # 更新项目
DELETE /api/projects/:id             # 删除项目

GET    /api/tasks                    # 获取任务列表
POST   /api/tasks                    # 创建任务
PUT    /api/tasks/:id                # 更新任务
DELETE /api/tasks/:id                # 删除任务

GET    /api/appointments             # 获取预约列表
POST   /api/appointments             # 创建预约
PUT    /api/appointments/:id         # 更新预约
DELETE /api/appointments/:id         # 删除预约
```

### 特殊操作接口
```
POST   /api/tasks/:id/steps/:stepId/complete    # 标记步骤完成
POST   /api/subtasks/:id/steps/:stepId/complete # 标记子任务步骤完成
POST   /api/tasks/:id/complete                  # 标记任务完成
POST   /api/subtasks/:id/complete               # 标记子任务完成
POST   /api/appointments/:id/complete            # 标记预约完成
```

## 数据迁移策略

### 从 LocalStorage 到数据库
1. **数据导出**：从 LocalStorage 导出 JSON 数据
2. **数据转换**：将嵌套的 JSON 结构转换为关系型数据库结构
3. **数据导入**：批量插入到数据库表中
4. **数据验证**：确保数据完整性和一致性

### 渐进式迁移
1. **接口层抽象**：创建统一的数据访问接口
2. **适配器模式**：实现 LocalStorage 和数据库两种存储适配器
3. **配置切换**：通过配置选择使用哪种存储方式
4. **平滑过渡**：支持两种存储方式并存

## 性能优化建议

### 数据库优化
1. **索引优化**：为常用查询字段建立合适的索引
2. **分页查询**：大数据量时使用分页查询
3. **缓存策略**：对热点数据进行缓存
4. **连接池**：使用数据库连接池提高性能

### 应用层优化
1. **懒加载**：按需加载数据
2. **数据预取**：提前加载可能需要的数据
3. **状态管理**：合理使用缓存和状态管理
4. **接口合并**：减少网络请求次数

## 安全考虑

### 数据安全
1. **输入验证**：对所有输入数据进行验证和过滤
2. **SQL注入防护**：使用参数化查询
3. **权限控制**：实现基于角色的访问控制
4. **数据加密**：敏感数据加密存储

### 接口安全
1. **身份认证**：实现用户身份认证机制
2. **授权验证**：验证用户操作权限
3. **请求限制**：防止恶意请求
4. **日志记录**：记录重要操作日志

## 总结

本数据库设计基于当前系统的数据模型，采用关系型数据库设计，支持：
- 用户管理和权限控制
- 项目管理和任务分配
- 任务步骤和子任务管理
- 预约提醒功能
- 用户备注和完成状态跟踪

通过合理的表结构设计和索引优化，能够支持系统的各项功能需求，并为后续的功能扩展提供良好的基础。
