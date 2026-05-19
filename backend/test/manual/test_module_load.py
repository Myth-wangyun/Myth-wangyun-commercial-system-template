import sys
sys.path.insert(0, '.')
import importlib.util
from pathlib import Path

spec_path = Path('app/teaching-quality/TQcampus_monthly_class_promotion_goals_results_api.py')
print(f'文件存在: {spec_path.exists()}')

spec = importlib.util.spec_from_file_location('test_mod', str(spec_path))
module = importlib.util.module_from_spec(spec)
try:
    spec.loader.exec_module(module)
    print('模块加载成功')
    has_router = hasattr(module, 'router')
    print(f'有router: {has_router}')
    if has_router:
        print(f'路由数: {len(module.router.routes)}')
        for r in module.router.routes:
            print(f'  {r.methods} {r.path}')
except Exception as e:
    print(f'模块加载失败: {e}')
    import traceback
    traceback.print_exc()
