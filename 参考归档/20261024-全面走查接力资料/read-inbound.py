from pathlib import Path
import sys,re,hashlib
files=Path('/tmp/qs-wms-full-audit/inbound-return-manifest.txt').read_text().splitlines()
for i in map(int,sys.argv[1:]):
 f=Path(files[i]); body=f.read_text(); lines=body.splitlines(); print(f'\nFILE {i} {f.name} ({f.parent.name}) L1-{len(lines)}')
 for n,s in enumerate(lines,1):
  s=re.sub(r'\]\([^)]*\)',']',s)
  s=re.sub(r'[-─━]{4,}','---',s)
  s=re.sub(r' {2,}',' ',s)
  if s.strip(): print(f'{n} {s}')
 with Path('/tmp/qs-wms-full-audit/inbound-return-coverage.tsv').open('a') as h: h.write(f'{f}\t1-{len(lines)}\ttext-emitted-review\t{hashlib.sha256(body.encode()).hexdigest()}\n')
