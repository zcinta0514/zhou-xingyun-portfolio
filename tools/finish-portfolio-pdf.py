"""补充 PDF 书签、明确页内跳转，并压缩照片。需 pymupdf 与 Pillow。"""
from pathlib import Path
from io import BytesIO
import json
import fitz
from PIL import Image

root = Path(__file__).resolve().parent.parent
path = root / 'dist/zhou-xingyun-portfolio-2026.pdf'
doc = fitz.open(path)
chapters = json.loads((root / 'dist/portfolio-review/chapters.json').read_text())
assert len(doc) == len(chapters), 'PDF 页数与排版不一致'
targets = {c['id']: i for i, c in enumerate(chapters)}
doc.set_toc([[1, c['title'], i + 1] for i, c in enumerate(chapters)])
doc.set_metadata({'title': '周性运 · 产品运营、内容策划与 AI 应用作品集', 'author': '周性运',
                  'subject': '精选作品 · 2026-10-08', 'keywords': 'Cindy, AI, 工作流, 产品运营, TikTok, Instagram, 内容策划, 作品集'})
seen = set()
for page in doc:
    for link in page.get_links():
        if link.get('nameddest') in targets:
            page.update_link({'kind': fitz.LINK_GOTO, 'xref': link['xref'], 'from': link['from'],
                              'page': targets[link['nameddest']], 'to': fitz.Point(0, 0)})
    for item in page.get_images():
        xref, smask, width, height = item[:4]
        if xref in seen or smask or max(width, height) < 500:
            continue
        seen.add(xref)
        raw = doc.extract_image(xref)['image']
        image = Image.open(BytesIO(raw)).convert('RGB')
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        compressed = BytesIO()
        image.save(compressed, 'JPEG', quality=88, optimize=True)
        if len(compressed.getvalue()) < len(raw) * 0.85:
            page.replace_image(xref, stream=compressed.getvalue())
doc.subset_fonts()
temp = path.with_suffix('.optimized.pdf')
doc.save(temp, garbage=4, deflate=True, use_objstms=1)
doc.close()
temp.replace(path)
check = fitz.open(path)
internal = [l for p in check for l in p.get_links() if l['kind'] == fitz.LINK_GOTO]
assert len(internal) >= len(chapters) + 7, '目录或回目录链接缺失'
assert all(0 <= l['page'] < len(check) for l in internal)
assert len(check.get_toc()) == len(chapters)
lead_text = check[targets['tt-lead']].get_text()
assert '1.6M' in lead_text and '103,700' in lead_text
for page_id, text in [('cindy','产品运营实习生'),('cindy-video','独立完成'),('motion-atlas','动效素材库'),('photo-grade','摄影调色')]:
    assert text in check[targets[page_id]].get_text(), f'案例缺失: {page_id}'
assert '2228144556@qq.com' in check[-1].get_text()
print(f'已完成：{len(check)} 页，{len(internal)} 个页内链接，{path.stat().st_size / 1024 / 1024:.1f} MB')
