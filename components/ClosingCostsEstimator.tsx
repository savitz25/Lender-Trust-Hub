'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchLenderButton } from '@/components/MatchLenderButton';
import { formatCurrency } from '@/lib/utils';

export default function ClosingCostsEstimator() {
  const [homePrice, setHomePrice] = useState(400000);
  const [downPercent, setDownPercent] = useState(10);
  const [points, setPoints] = useState(0);
  const [copied, setCopied] = useState(false);

  const breakdown = useMemo(() => {
    const loanAmount = homePrice * (1 - downPercent / 100);
    const origination = loanAmount * 0.01;
    const appraisal = 550;
    const title = homePrice * 0.005;
    const recording = 150;
    const prepaidTax = homePrice * 0.008;
    const pointsCost = loanAmount * (points / 100);
    const total = origination + appraisal + title + recording + prepaidTax + pointsCost;

    return [
      { label: 'Origination Fee (1%)', amount: Math.round(origination) },
      { label: 'Appraisal', amount: appraisal },
      { label: 'Title & Escrow (0.5%)', amount: Math.round(title) },
      { label: 'Recording Fees', amount: recording },
      { label: 'Prepaid Taxes/Insurance', amount: Math.round(prepaidTax) },
      { label: `Discount Points (${points}%)`, amount: Math.round(pointsCost) },
      { label: 'Total Closing Costs', amount: Math.round(total), highlight: true },
    ];
  }, [homePrice, downPercent, points]);

  const total = breakdown[breakdown.length - 1].amount;
  const shareText = `Closing cost estimate for ${formatCurrency(homePrice)} home: ${formatCurrency(total)}. Calculated at LenderTrustHub.com`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Closing Costs Estimator</CardTitle>
        <p className="text-sm text-zinc-500">Interactive breakdown with shareable result card.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Home Price</span>
              <span className="font-bold text-[#3B82F6]">{formatCurrency(homePrice)}</span>
            </div>
            <Slider value={[homePrice]} min={100000} max={1500000} step={10000} onValueChange={(v) => setHomePrice(v[0])} aria-label="Home price" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Down Payment</span>
              <span className="font-bold text-[#3B82F6]">{downPercent}%</span>
            </div>
            <Slider value={[downPercent]} min={0} max={30} step={1} onValueChange={(v) => setDownPercent(v[0])} aria-label="Down payment percentage" />
          </div>
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Discount Points</span>
              <span className="font-bold text-[#3B82F6]">{points}%</span>
            </div>
            <Slider value={[points]} min={0} max={3} step={0.25} onValueChange={(v) => setPoints(v[0])} aria-label="Discount points" />
          </div>
        </div>

        <motion.div
          key={total}
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
          aria-label="Closing costs breakdown"
        >
          {breakdown.map((item) => (
            <div
              key={item.label}
              className={`flex justify-between text-sm ${
                item.highlight ? 'border-t border-zinc-200 pt-2 font-bold text-[#0A2540]' : 'text-zinc-600'
              }`}
            >
              <span>{item.label}</span>
              <span>{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] hover:bg-zinc-50"
            aria-label="Copy shareable result"
          >
            {copied ? <Check className="h-4 w-4 text-[#14B8A6]" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Result'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Closing Cost Estimate', text: shareText });
              } else {
                handleCopy();
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] hover:bg-zinc-50"
            aria-label="Share result"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        <MatchLenderButton filters={{ loanType: 'Conventional' }} label="Find Low-Fee Lenders" />
      </CardContent>
    </Card>
  );
}