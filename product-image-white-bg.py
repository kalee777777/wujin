#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════╗
║  产品图片转白底工具  v1.0                                        ║
║  Product Image White Background Converter                        ║
╠══════════════════════════════════════════════════════════════════╣
║  功能：自动检测产品图片的非白色背景，并替换为纯白色(#FFFFFF)      ║
║  适用：纯色背景（灰/米/浅黄等）的产品图，不适合复杂场景图       ║
║  输入：workspace/产品图片/ 目录下的所有图片                       ║
║  输出：直接覆盖原图（处理前建议git备份）                         ║
╚══════════════════════════════════════════════════════════════════╝

使用方法：
    python3 产品图片转白底.py

处理逻辑：
    1. 采样图片4个角落的颜色
    2. 如果角落颜色相似（纯色背景）且不是纯白色 → 处理
    3. 创建遮罩分离前景产品和背景
    4. 背景替换为纯白，边缘平滑过渡
"""
#!/usr/bin/env python3
"""
Product Image White Background Converter - Final Version
Targets: Images with UNIFORM non-white backgrounds (solid color bg like gray, beige, etc.)
Skips: Complex/scene photos where corners differ significantly

Strategy:
1. Sample 4 corners and check if they're similar (uniform bg)
2. If uniform AND bg is not white -> process
3. Detect background by color distance from corner color
4. Replace background with pure white
"""

import cv2
import numpy as np
from pathlib import Path

BASE_DIR = Path('/sessions/6a490f65c42a5e7bbbd2e477/workspace/产品图片')

# Tunable parameters
CORNER_SIZE = 20           # Corner sample size
MAX_CORNER_DIFF = 70       # Max color diff between corners to be "uniform"
BG_WHITENESS = 230         # RGB avg above this = considered white
COLOR_DIST = 45            # Color distance threshold for background
MIN_BG_RATIO = 0.25        # Min background area to process
MAX_BG_RATIO = 0.97        # Max background area (avoid over-processing)


def sample_corners(img):
    """Sample average color from 4 corners."""
    h, w = img.shape[:2]
    s = min(CORNER_SIZE, h // 4, w // 4)
    corners = {
        'tl': img[:s, :s],
        'tr': img[:s, -s:],
        'bl': img[-s:, :s],
        'br': img[-s:, -s:]
    }
    return {k: np.mean(v, axis=(0, 1)) for k, v in corners.items()}


def is_uniform_bg(corners):
    """Check if corners have similar colors (uniform background)."""
    vals = list(corners.values())
    max_diff = 0
    for i in range(4):
        for j in range(i + 1, 4):
            diff = np.linalg.norm(vals[i] - vals[j])
            if diff > max_diff:
                max_diff = diff
    return max_diff <= MAX_CORNER_DIFF


def is_white_bg(avg_color):
    """Check if average background color is pure white (all channels > 250)."""
    return np.all(avg_color > 250)


def create_mask(img, bg_color):
    """Create background mask using color distance."""
    # Calculate per-pixel color distance from bg_color
    diff = cv2.absdiff(img, bg_color.astype(np.uint8))
    distance = np.mean(diff, axis=2).astype(np.uint8)
    
    # Pixels close to bg_color are background
    _, mask = cv2.threshold(distance, COLOR_DIST, 255, cv2.THRESH_BINARY_INV)
    
    # Morphological cleanup
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    
    # Remove small noise islands
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    for i in range(1, num_labels):
        if stats[i, cv2.CC_STAT_AREA] < 300:
            mask[labels == i] = 0
    
    return mask


def apply_white_bg(img, mask):
    """Replace background with white using smooth blending."""
    white = np.ones_like(img) * 255
    mask_3ch = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
    mask_smooth = cv2.GaussianBlur(mask_3ch, (3, 3), 0)
    alpha = mask_smooth.astype(np.float32) / 255.0
    result = (img.astype(np.float32) * (1 - alpha) +
              white.astype(np.float32) * alpha).astype(np.uint8)
    return result


def process_image(img_path):
    """Process a single image. Returns status string."""
    img = cv2.imread(str(img_path))
    if img is None:
        return "ERROR"
    
    corners = sample_corners(img)
    
    if not is_uniform_bg(corners):
        return "SKIP_COMPLEX"
    
    avg_bg = np.mean(list(corners.values()), axis=0)
    
    if is_white_bg(avg_bg):
        return "SKIP_WHITE"
    
    mask = create_mask(img, avg_bg)
    bg_ratio = np.sum(mask > 128) / mask.size
    
    if bg_ratio < MIN_BG_RATIO:
        return "SKIP_SMALL_BG"
    if bg_ratio > MAX_BG_RATIO:
        return "SKIP_LARGE_BG"
    
    result = apply_white_bg(img, mask)
    cv2.imwrite(str(img_path), result)
    return "DONE"


def main():
    stats = {"DONE": 0, "SKIP_WHITE": 0, "SKIP_COMPLEX": 0,
             "SKIP_SMALL_BG": 0, "SKIP_LARGE_BG": 0, "ERROR": 0}
    total = 0
    
    for folder in sorted(BASE_DIR.iterdir()):
        if not folder.is_dir():
            continue
        
        folder_results = []
        for img_file in sorted(folder.iterdir()):
            if img_file.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp'):
                continue
            
            total += 1
            status = process_image(img_file)
            stats[status] += 1
            
            if status == "DONE":
                folder_results.append(img_file.name)
        
        if folder_results:
            print(f"✅ {folder.name}: {len(folder_results)} processed")
    
    print(f"\n{'='*55}")
    print(f"Total images scanned:     {total}")
    print(f"Converted to white bg:    {stats['DONE']}")
    print(f"Skipped (already white):  {stats['SKIP_WHITE']}")
    print(f"Skipped (complex/scene):  {stats['SKIP_COMPLEX']}")
    print(f"Skipped (bg too small):   {stats['SKIP_SMALL_BG']}")
    print(f"Skipped (bg too large):   {stats['SKIP_LARGE_BG']}")
    print(f"Errors:                   {stats['ERROR']}")
    print(f"{'='*55}")


if __name__ == '__main__':
    main()
