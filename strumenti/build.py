#!/usr/bin/env python3
"""Impacchetta un sorgente in src/ in un unico file HTML autonomo (funziona offline).

  @DATA:percorso@        -> data URI base64 (immagini, font)
  /*@JS:percorso@*/      -> contenuto del file JavaScript
  @VERSIONE@             -> numero di versione (file VERSIONE) e data/ora della build (ora italiana)

Uso:  python3 strumenti/build.py src/prova-stile.html prova-stile.html
"""
import base64, datetime, mimetypes, pathlib, re, sys
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIME = {'.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml'}

def data_uri(m):
    p = ROOT / m.group(1)
    mime = MIME.get(p.suffix) or mimetypes.guess_type(p.name)[0]
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()

def js(m):
    return (ROOT / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')

src, dst = sys.argv[1], sys.argv[2]
html = (ROOT / src).read_text(encoding='utf-8')
html = re.sub(r'/\*@JS:([^@]+)@\*/', js, html)
html = re.sub(r'@DATA:([^@]+)@', data_uri, html)
versione = (ROOT / 'VERSIONE').read_text(encoding='utf-8').strip()
quando = datetime.datetime.now(ZoneInfo('Europe/Rome')).strftime('%d/%m/%Y %H:%M')
html = html.replace('@VERSIONE@', f'v{versione} · {quando}')
(ROOT / dst).write_text(html, encoding='utf-8')
print(f"{dst}: {len(html.encode())/1024:.0f} KB · v{versione}")
