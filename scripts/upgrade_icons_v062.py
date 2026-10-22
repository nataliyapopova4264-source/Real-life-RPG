from pathlib import Path
import base64, io, json, re
from PIL import Image, ImageEnhance, ImageFilter

SRC = Path('rpg-v0.6.1.html')
DST = Path('rpg-v0.6.2.html')
text = SRC.read_text(encoding='utf-8')
assert 'REAL LIFE RPG v0.6.1' in text
match = re.search(r'const HERO_ART=(\{.*?\});\n', text, re.S)
assert match
art = json.loads(match.group(1))
assert len(art) == 20

female = {'priestess','valkyrie','sorceress','shadow_rogue','shining_singer',
          'moon_assassin','storm_gunner','forest_druid','crimson_empress','cyber_idol'}
for char, value in art.items():
    raw = base64.b64decode(value['face'].split(',', 1)[1])
    face = Image.open(io.BytesIO(raw)).convert('RGB')
    assert face.size == (116, 131), (char, face.size)
    box = (3, 0, 104, 101) if char in female else (4, 0, 114, 110)
    face = face.crop(box)
    face = ImageEnhance.Contrast(face).enhance(1.065)
    face = ImageEnhance.Color(face).enhance(1.025)
    face = face.filter(ImageFilter.UnsharpMask(radius=.72, percent=115, threshold=2))
    face = face.resize((512, 512), Image.Resampling.LANCZOS)
    face = face.filter(ImageFilter.UnsharpMask(radius=1.25, percent=120, threshold=2))
    face = ImageEnhance.Sharpness(face).enhance(1.07)
    output = io.BytesIO()
    face.save(output, 'WEBP', quality=97, method=6, exact=True)
    value['face'] = 'data:image/webp;base64,' + base64.b64encode(output.getvalue()).decode('ascii')

text = text[:match.start(1)] + json.dumps(art, ensure_ascii=False, separators=(',', ':')) + text[match.end(1):]
text = text.replace('REAL LIFE RPG · 0.6.1', 'REAL LIFE RPG · 0.6.2')
text = text.replace('30 ДНЕЙ ПРОКАЧКИ · v0.6.1', '30 ДНЕЙ ПРОКАЧКИ · v0.6.2')
text = text.replace('REAL LIFE RPG v0.6.1', 'REAL LIFE RPG v0.6.2')
text = text.replace("const VERSION=14,STORE='real-life-rpg-v14',STEP=500;",
                    "const VERSION=15,STORE='real-life-rpg-v15',STEP=500;")
text = text.replace("localStorage.getItem('real-life-rpg-v13')||",
                    "localStorage.getItem('real-life-rpg-v14')||localStorage.getItem('real-life-rpg-v13')||")
text = text.replace('REAL-LIFE-RPG-0.6.1-', 'REAL-LIFE-RPG-0.6.2-')
text = text.replace('</style>', '''
/* v0.6.2: 512px sharpened portrait thumbnails */
.character-thumb img{filter:none;object-position:center center;image-rendering:auto}
.character-thumb{background:#15101f;isolation:isolate}
.character-thumb:after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),inset 0 -10px 15px rgba(7,3,12,.06)}
</style>''', 1)
assert 'const VERSION=15' in text
assert "localStorage.getItem('real-life-rpg-v14')" in text
DST.write_text(text, encoding='utf-8')
print(f'Created {DST}, 20 character face sprites in 512x512, {DST.stat().st_size} bytes')
