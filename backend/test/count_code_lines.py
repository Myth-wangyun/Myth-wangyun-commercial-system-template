"""
统计项目代码行数

统计清美教育管理系统的代码量
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import os
from pathlib import Path
from collections import defaultdict


class CodeLineCounter:
    """代码行数统计器"""
    
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.stats = defaultdict(lambda: {"files": 0, "lines": 0, "size": 0})
        
        # 定义文件类型分类
        self.categories = {
            "后端Python": [".py"],
            "前端JavaScript": [".js"],
            "前端HTML": [".html"],
            "前端CSS": [".css"],
            "SQL脚本": [".sql"],
            "配置文件": [".json", ".txt", ".ini", ".env", ".example"],
            "文档": [".md"],
        }
        
        # 需要排除的目录
        self.exclude_dirs = {
            "node_modules", "__pycache__", ".git", "venv", 
            "env", "dist", "build", "logs", "temp", "uploads"
        }
    
    def should_exclude(self, path):
        """判断是否应该排除该路径"""
        parts = path.parts
        return any(excluded in parts for excluded in self.exclude_dirs)
    
    def get_category(self, file_path):
        """获取文件类型分类"""
        ext = file_path.suffix.lower()
        
        for category, extensions in self.categories.items():
            if ext in extensions:
                return category
        
        return "其他文件"
    
    def count_lines(self, file_path):
        """统计文件行数"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return len(f.readlines())
        except:
            try:
                with open(file_path, 'r', encoding='gbk', errors='ignore') as f:
                    return len(f.readlines())
            except:
                return 0
    
    def scan_directory(self, directory=None):
        """扫描目录统计代码"""
        if directory is None:
            directory = self.project_root
        
        for file_path in directory.rglob('*'):
            if file_path.is_file():
                # 排除某些目录
                if self.should_exclude(file_path):
                    continue
                
                # 获取分类
                category = self.get_category(file_path)
                
                # 统计行数
                lines = self.count_lines(file_path)
                size = file_path.stat().st_size
                
                # 记录统计
                self.stats[category]["files"] += 1
                self.stats[category]["lines"] += lines
                self.stats[category]["size"] += size
    
    def generate_report(self):
        """生成统计报告"""
        print("="*70)
        print("📊 清美教育管理系统 - 代码行数统计报告")
        print("="*70)
        print(f"📁 项目路径：{self.project_root}")
        print("="*70)
        print()
        
        # 按行数排序
        sorted_stats = sorted(
            self.stats.items(), 
            key=lambda x: x[1]["lines"], 
            reverse=True
        )
        
        total_files = 0
        total_lines = 0
        total_size = 0
        
        print(f"{'类型':<20} {'文件数':>10} {'代码行数':>15} {'文件大小':>15}")
        print("-"*70)
        
        for category, data in sorted_stats:
            files = data["files"]
            lines = data["lines"]
            size = data["size"]
            
            total_files += files
            total_lines += lines
            total_size += size
            
            size_str = self.format_size(size)
            
            print(f"{category:<20} {files:>10} {lines:>15,} {size_str:>15}")
        
        print("="*70)
        print(f"{'总计':<20} {total_files:>10} {total_lines:>15,} {self.format_size(total_size):>15}")
        print("="*70)
        print()
        
        # 占比分析
        print("📊 代码占比分析")
        print("-"*70)
        
        code_categories = ["后端Python", "前端JavaScript", "前端HTML", "前端CSS", "SQL脚本"]
        code_lines = sum(self.stats[cat]["lines"] for cat in code_categories if cat in self.stats)
        doc_lines = self.stats["文档"]["lines"]
        
        print(f"代码总行数：{code_lines:,} 行")
        print(f"文档总行数：{doc_lines:,} 行")
        print(f"代码文档比：{code_lines}:{doc_lines} (1:{doc_lines/code_lines:.2f})")
        print()
        
        # 详细分类
        print("详细分类：")
        for category in code_categories:
            if category in self.stats:
                lines = self.stats[category]["lines"]
                percent = (lines / code_lines * 100) if code_lines > 0 else 0
                print(f"  {category:<20} {lines:>8,} 行 ({percent:>5.1f}%)")
        
        print("-"*70)
        
        return {
            "total_files": total_files,
            "total_lines": total_lines,
            "total_size": total_size,
            "code_lines": code_lines,
            "doc_lines": doc_lines,
            "stats": dict(self.stats)
        }
    
    def format_size(self, size_bytes):
        """格式化文件大小"""
        if size_bytes < 1024:
            return f"{size_bytes}B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes/1024:.1f}KB"
        else:
            return f"{size_bytes/1024/1024:.1f}MB"
    
    def save_report(self, stats):
        """保存报告到文件"""
        report_path = self.project_root / "代码行数统计报告.md"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# 📊 清美教育管理系统 - 代码行数统计报告\n\n")
            f.write(f"**统计时间**：2025-10-15\n")
            f.write(f"**项目路径**：{self.project_root}\n\n")
            
            f.write("## 📈 总体统计\n\n")
            f.write("| 指标 | 数值 |\n")
            f.write("|------|------|\n")
            f.write(f"| 总文件数 | {stats['total_files']:,} |\n")
            f.write(f"| 总代码行数 | {stats['total_lines']:,} |\n")
            f.write(f"| 总文件大小 | {self.format_size(stats['total_size'])} |\n")
            f.write(f"| 代码行数 | {stats['code_lines']:,} |\n")
            f.write(f"| 文档行数 | {stats['doc_lines']:,} |\n")
            f.write(f"| 代码文档比 | 1:{stats['doc_lines']/stats['code_lines']:.2f} |\n\n")
            
            f.write("## 📊 分类统计\n\n")
            f.write("| 类型 | 文件数 | 代码行数 | 占比 | 文件大小 |\n")
            f.write("|------|--------|----------|------|----------|\n")
            
            sorted_stats = sorted(
                stats['stats'].items(),
                key=lambda x: x[1]["lines"],
                reverse=True
            )
            
            for category, data in sorted_stats:
                files = data["files"]
                lines = data["lines"]
                size = data["size"]
                percent = (lines / stats['total_lines'] * 100) if stats['total_lines'] > 0 else 0
                
                f.write(f"| {category} | {files} | {lines:,} | {percent:.1f}% | {self.format_size(size)} |\n")
            
            f.write("\n## 🎯 代码质量指标\n\n")
            
            # 计算代码文档比
            code_doc_ratio = stats['doc_lines'] / stats['code_lines'] if stats['code_lines'] > 0 else 0
            
            f.write("### 文档覆盖率\n\n")
            if code_doc_ratio >= 1.0:
                f.write(f"✅ **优秀**：文档行数 > 代码行数 (比例 1:{code_doc_ratio:.2f})\n\n")
            elif code_doc_ratio >= 0.5:
                f.write(f"✅ **良好**：文档行数约为代码一半 (比例 1:{code_doc_ratio:.2f})\n\n")
            elif code_doc_ratio >= 0.3:
                f.write(f"⚠️ **一般**：文档行数偏少 (比例 1:{code_doc_ratio:.2f})\n\n")
            else:
                f.write(f"❌ **不足**：文档严重不足 (比例 1:{code_doc_ratio:.2f})\n\n")
            
            f.write("### 项目规模\n\n")
            total_code = stats['code_lines']
            
            if total_code > 10000:
                f.write(f"📈 **大型项目**：{total_code:,} 行代码\n\n")
            elif total_code > 5000:
                f.write(f"📈 **中大型项目**：{total_code:,} 行代码\n\n")
            elif total_code > 2000:
                f.write(f"📈 **中型项目**：{total_code:,} 行代码\n\n")
            else:
                f.write(f"📈 **小型项目**：{total_code:,} 行代码\n\n")
            
            f.write("## 📝 文件分类详情\n\n")
            
            for category in ["后端Python", "前端JavaScript", "前端HTML", "前端CSS", "SQL脚本", "文档"]:
                if category in stats['stats']:
                    data = stats['stats'][category]
                    f.write(f"### {category}\n\n")
                    f.write(f"- 文件数：{data['files']}\n")
                    f.write(f"- 代码行数：{data['lines']:,}\n")
                    f.write(f"- 文件大小：{self.format_size(data['size'])}\n")
                    f.write(f"- 平均每文件：{data['lines']//data['files'] if data['files'] > 0 else 0:,} 行\n\n")
            
            f.write("---\n\n")
            f.write("**统计日期**：2025-10-15\n")
            f.write("**统计工具**：count_code_lines.py\n")
        
        print(f"✅ 报告已保存到：{report_path}")


def main():
    """主函数"""
    # 获取项目根目录
    current_dir = Path(__file__).parent.parent
    
    print()
    print("🚀 开始统计代码行数...")
    print()
    
    counter = CodeLineCounter(current_dir)
    counter.scan_directory()
    stats = counter.generate_report()
    
    print()
    counter.save_report(stats)
    print()


if __name__ == "__main__":
    main()

