import csv,hashlib,json,pathlib,argparse
root=pathlib.Path(__file__).resolve().parents[1]
base=root/'data/hmda/by-state/KS'
county=base/'county_market_summary.csv'; lei=base/'lender_state_summary.csv'; activity=base/'lender_activity_by_county.csv'
def read(p):
 with p.open(encoding='utf-8-sig',newline='') as f: return list(csv.DictReader(f))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
cr=read(county); lr=read(lei); ar=read(activity)
num=lambda rows,k:sum(int(r[k] or 0) for r in rows)
result={
 'state':'KS','sourceVintage':2025,'sourceRetrievedAt':'NOT_RETAINED','generatedAt':'2026-10-06',
 'countyAggregate':{'rows':len(cr),'applications':num(cr,'total_applications'),'originations':num(cr,'total_originations'),'denials':num(cr,'denial_count'),'sourceFile':'data/hmda/by-state/KS/county_market_summary.csv','sha256':sha(county)},
 'leiStateSummary':{'rows':len(lr),'distinctLeis':len({r['lei'] for r in lr if r['lei']}),'applications':num(lr,'total_applications'),'originations':num(lr,'total_originations'),'sourceFile':'data/hmda/by-state/KS/lender_state_summary.csv','sha256':sha(lei)},
 'lenderCountyActivity':{'rows':len(ar),'distinctLeis':len({r['lei'] for r in ar if r['lei']}),'applications':num(ar,'applications'),'originations':num(ar,'originations'),'denials':num(ar,'denials'),'sourceFile':'data/hmda/by-state/KS/lender_activity_by_county.csv','sha256':sha(activity)},
 'knownReconciliationDifferences':{'countyVsLeiApplications':num(cr,'total_applications')-num(lr,'total_applications'),'countyVsLenderCountyApplications':num(cr,'total_applications')-num(ar,'applications')},
 'existingKansasHmdaSlice':{'majorMarketCountyRows':16,'lenderCountyActivityRows':2767,'leiSummaryRows':677,'highConfidenceLeiDirectoryMappings':137,'source':'data/hmda/kansas/'},
 'licensing':{'mortgageCompany':'NOT_ACQUIRED','branch':'NOT_ACQUIRED','mloPerson':'NOT_ACQUIRED','supervisedLender':'NOT_ACQUIRED','stateCharteredBank':'NOT_ACQUIRED','graphWrites':0,'canonicalEntityWrites':0}
}
out=root/'data/kansas/hmda-snapshot.json'; out.write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
