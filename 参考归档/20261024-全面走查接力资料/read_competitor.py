from pathlib import Path
import csv,json,sys,re
batches=json.loads(Path('/tmp/qs-wms-full-audit/competitor-batches.json').read_text());paths=[]
for num in sys.argv[1:]:paths+=batches[int(num)]
for name in paths:
 p=Path(name);print('\nFILE: '+str(p.resolve()))
 for n,line in enumerate(p.read_text().splitlines(),1):
  line=re.sub(r'!\[[^\]]*\]\([^\n]*\)','[图片链接省略]',line)
  if line.strip():print(f'{n:4} {line}')
f=Path('/tmp/qs-wms-full-audit/outbound-coverage.tsv');rows=list(csv.reader(f.open(),delimiter='\t'))
for row in rows[1:]:
 if row[1] in paths:row[4]='full_text_read';row[5]='原始操作正文完整读取，图片未逐张检查，不宣称厂商页面实测'
with f.open('w') as h:csv.writer(h,delimiter='\t').writerows(rows)
