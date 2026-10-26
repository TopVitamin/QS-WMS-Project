from pathlib import Path
import csv,json,sys
batches=json.loads(Path('/tmp/qs-wms-full-audit/outbound-batches.json').read_text())
paths=[]
for num in sys.argv[1:]:paths+=batches[int(num)]
for name in paths:
 p=Path(name);print('\nFILE: '+str(p.resolve()))
 for n,line in enumerate(p.read_text().splitlines(),1):print(f'{n:4} {line}')
f=Path('/tmp/qs-wms-full-audit/outbound-coverage.tsv')
rows=list(csv.reader(f.open(),delimiter='\t'))
for row in rows[1:]:
 if row[1] in [str(Path(p).resolve()) for p in paths]:row[4]='full_read';row[5]='全文件逐行读取，业务与页面交叉评审'
with f.open('w') as h:csv.writer(h,delimiter='\t').writerows(rows)
