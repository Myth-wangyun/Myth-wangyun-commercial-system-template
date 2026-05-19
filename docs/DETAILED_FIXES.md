# 详细修复清单

## 问题根源
在 `backend/app/teaching-quality` 目录中，以下两个文件被重命名：
1. `class_list_db.py` → `TQclass_list_db.py`
2. `QT_class_employment_summary_db.py` → `TQ_class_employment_summary_db.py`

但是有8个Python文件仍然在使用旧的文件名进行动态导入，导致 `FileNotFoundError`。

---

## 修复详情

### 1️⃣ backend/app/crud/teacher_employment_summary.py
**问题**: 第26-44行使用了旧的文件名和模块名

**修改前**:
```python
_qt_summary_file = _tq_dir / "QT_class_employment_summary_db.py"
_qt_summary_mod_name = "app.teaching_quality.QT_class_employment_summary_db_dynamic_for_teacher"
...
_classlist_file = _tq_dir / "class_list_db.py"
_classlist_mod_name = "app.teaching_quality.class_list_db_dynamic_for_teacher"
```

**修改后**:
```python
_qt_summary_file = _tq_dir / "TQ_class_employment_summary_db.py"
_qt_summary_mod_name = "app.teaching_quality.TQ_class_employment_summary_db_dynamic_for_teacher"
...
_classlist_file = _tq_dir / "TQclass_list_db.py"
_classlist_mod_name = "app.teaching_quality.TQclass_list_db_dynamic_for_teacher"
```

---

### 2️⃣ backend/app/teaching-quality/TQcampus_monthly_class_promotion_goals_results_api.py
**问题**: 第43行使用了旧的文件名

**修改前**:
```python
_cls_file = _tq_dir / "class_list_db.py"
_cls_mod_name = "app.teaching_quality.class_list_db_dynamic_for_class_promotion"
```

**修改后**:
```python
_cls_file = _tq_dir / "TQclass_list_db.py"
_cls_mod_name = "app.teaching_quality.TQclass_list_db_dynamic_for_class_promotion"
```

---

### 3️⃣ backend/app/teaching-quality/TQclass_list_api.py
**问题**: 第19行使用了旧的文件名

**修改前**:
```python
_db_file = _tq_dir / "class_list_db.py"
_mod_name = "app.teaching_quality.class_list_db_dynamic"
```

**修改后**:
```python
_db_file = _tq_dir / "TQclass_list_db.py"
_mod_name = "app.teaching_quality.TQclass_list_db_dynamic"
```

---

### 4️⃣ backend/app/teaching-quality/TQ_class_employment_summary_api.py
**问题**: 第22行和第53行使用了旧的文件名

**修改前**:
```python
_summary_db_file = _tq_dir / "QT_class_employment_summary_db.py"
_summary_mod_name = "app.teaching_quality.QT_class_employment_summary_db_dynamic"
...
_classlist_db_file = _tq_dir / "class_list_db.py"
_classlist_mod_name = "app.teaching_quality.class_list_db_dynamic"
```

**修改后**:
```python
_summary_db_file = _tq_dir / "TQ_class_employment_summary_db.py"
_summary_mod_name = "app.teaching_quality.TQ_class_employment_summary_db_dynamic"
...
_classlist_db_file = _tq_dir / "TQclass_list_db.py"
_classlist_mod_name = "app.teaching_quality.TQclass_list_db_dynamic"
```

---

### 5️⃣ backend/app/teaching-quality/TQmgnt_employment_goals_results_api.py
**问题**: 第36-38行使用了旧的文件名

**修改前**:
```python
QT汇总模块 = _load_db("QT_class_employment_summary_db.py", "app.teaching_quality.QT_class_employment_summary_db_dyn")
班级列表模块 = _load_db("class_list_db.py", "app.teaching_quality.class_list_db_dyn")
```

**修改后**:
```python
QT汇总模块 = _load_db("TQ_class_employment_summary_db.py", "app.teaching_quality.TQ_class_employment_summary_db_dyn")
班级列表模块 = _load_db("TQclass_list_db.py", "app.teaching_quality.TQclass_list_db_dyn")
```

---

### 6️⃣ backend/app/api/v1/endpoints/employment_star.py
**问题**: 第41行使用了旧的文件名

**修改前**:
```python
_classlist_file = _tq_dir / "class_list_db.py"
_classlist_mod_name = "app.teaching_quality.class_list_db_dynamic_for_star"
```

**修改后**:
```python
_classlist_file = _tq_dir / "TQclass_list_db.py"
_classlist_mod_name = "app.teaching_quality.TQclass_list_db_dynamic_for_star"
```

---

### 7️⃣ backend/app/teaching-quality/TQcampus_core_data_summary_api.py
**问题**: 第155行和第247行使用了旧的文件名

**修改前**:
```python
班级列表 = _get_db_module(
    "class_list_db.py",
    "app.teaching_quality.class_list_db_dynamic",
    "班级列表"
)
...
QT班级就业信息汇总表 = _get_db_module(
    "QT_class_employment_summary_db.py",
    "app.teaching_quality.QT_class_employment_summary_db_dynamic",
    "QT班级就业信息汇总表"
)
```

**修改后**:
```python
班级列表 = _get_db_module(
    "TQclass_list_db.py",
    "app.teaching_quality.TQclass_list_db_dynamic",
    "班级列表"
)
...
QT班级就业信息汇总表 = _get_db_module(
    "TQ_class_employment_summary_db.py",
    "app.teaching_quality.TQ_class_employment_summary_db_dynamic",
    "QT班级就业信息汇总表"
)
```

---

### 8️⃣ backend/app/teaching-quality/TQclass_employment_info_api.py
**问题**: 第251行使用了旧的文件名

**修改前**:
```python
sum_file = _tq_dir / "QT_class_employment_summary_db.py"
```

**修改后**:
```python
sum_file = _tq_dir / "TQ_class_employment_summary_db.py"
```

---

## 验证结果

✅ 所有8个文件已成功修复
✅ 所有旧的文件名引用已更新为新的文件名
✅ 所有对应的模块名称也已更新

## 预期效果

修复后，应该能够解决以下错误：
```
FileNotFoundError: [Errno 2] No such file or directory: 'D:\\...\\class_list_db.py'
FileNotFoundError: [Errno 2] No such file or directory: 'D:\\...\\QT_class_employment_summary_db.py'
```

应用程序应该能够正确导入这些模块并正常运行。

